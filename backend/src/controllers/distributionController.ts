import { NextFunction, Request, Response } from 'express';
import DistributionRecord from '../models/DistributionRecord';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import RationCard from '../models/RationCard';
import RationRegistry from '../models/RationRegistry';
import CollectionCode from '../models/CollectionCode';
import User, { UserRole, VendorStatus } from '../models/User';
import { createNotification } from '../utils/notifications';

const currentMonthKey = () => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
};

const normalizeCommodityKey = (name?: string) => {
    const normalized = String(name || '').trim().toLowerCase();
    if (normalized.includes('rice')) return 'rice';
    if (normalized.includes('wheat')) return 'wheat';
    if (normalized.includes('sugar')) return 'sugar';
    if (normalized.includes('kerosene')) return 'kerosene';
    return normalized;
};

const fallbackQuota = (commodityKey: string, cardType?: string, familyMembers = 1) => {
    if (commodityKey === 'rice') {
        if (cardType === 'AAY' || cardType === 'BPL') return 4 * familyMembers;
        if (cardType === 'PHH') return 5 * familyMembers;
        return 0;
    }
    if (commodityKey === 'wheat') {
        if (cardType === 'AAY' || cardType === 'PHH') return 2 * familyMembers;
        if (cardType === 'BPL') return 1 * familyMembers;
        return 0;
    }
    if (commodityKey === 'sugar') {
        if (cardType === 'AAY' || cardType === 'PHH') return 1 * familyMembers;
        if (cardType === 'BPL') return 0.5 * familyMembers;
        return 0;
    }
    if (commodityKey === 'kerosene') {
        if (cardType === 'AAY' || cardType === 'PHH') return 1 * familyMembers;
        if (cardType === 'BPL') return 0.5 * familyMembers;
        return 0;
    }
    return 0;
};

const resolveQuota = (_registryValue: number | undefined, fallbackValue: number) => fallbackValue;

const getQuotaMap = (registry: any, cardType?: string, familyMembers = 1) => ({
    rice: resolveQuota(registry?.riceQuota, fallbackQuota('rice', cardType, familyMembers)),
    wheat: resolveQuota(registry?.wheatQuota, fallbackQuota('wheat', cardType, familyMembers)),
    sugar: resolveQuota(registry?.sugarQuota, fallbackQuota('sugar', cardType, familyMembers)),
    kerosene: fallbackQuota('kerosene', cardType, familyMembers),
});

export const createDistributionRecord = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, aadhaarNumber, verificationMethod, verificationReference, slot, collectionCode, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: 'At least one commodity must be distributed' });
        return;
    }

    try {
        const vendor = req.user;
        if (!vendor || vendor.role !== UserRole.VENDOR) {
            res.status(403).json({ message: 'Only dealers can record ration collection' });
            return;
        }

        const citizen = await User.findOne({
            _id: userId,
            assignedVendor: vendor._id,
            role: UserRole.USER,
            status: VendorStatus.APPROVED,
        });

        if (!citizen) {
            res.status(404).json({ message: 'Assigned approved citizen not found' });
            return;
        }

        const rationCard = await RationCard.findOne({ user: citizen._id });
        if (!rationCard) {
            res.status(404).json({ message: 'Citizen ration card not found' });
            return;
        }

        const matchedMember = rationCard.members.find((member) => member.aadhaarNumber === String(aadhaarNumber || '').trim());
        const isHead = rationCard.aadhaarNumber === String(aadhaarNumber || '').trim();

        if (!matchedMember && !isHead) {
            res.status(400).json({ message: 'Provided Aadhaar is not linked to this ration card' });
            return;
        }

        if (verificationMethod === 'BIOMETRIC' && !verificationReference) {
            res.status(400).json({ message: 'Biometric reference is required for biometric verification' });
            return;
        }

        const registry = await RationRegistry.findOne({ rationCardNumber: rationCard.rationCardNumber });
        const familyMembers = registry?.members?.length || rationCard.numberOfFamilyMembers || citizen.familyMembers || 1;
        const cardType = registry?.cardType || rationCard.cardType || citizen.cardCategory;
        const quotaMap = getQuotaMap(registry, cardType, familyMembers);
        const monthKey = currentMonthKey();

        const activeCode = await CollectionCode.findOne({
            user: citizen._id,
            vendor: vendor._id,
            monthKey,
            status: 'ACTIVE',
        });

        if (!activeCode) {
            res.status(400).json({ message: 'No active admin-issued collection code found for this citizen' });
            return;
        }

        if (String(collectionCode || '').trim() !== activeCode.code) {
            res.status(400).json({ message: 'Invalid collection code' });
            return;
        }

        const previousRecords = await DistributionRecord.find({
            user: citizen._id,
            vendor: vendor._id,
            monthKey,
        });

        const alreadyCollected = previousRecords.reduce<Record<string, number>>((acc, record) => {
            for (const item of record.items) {
                const key = normalizeCommodityKey(item.productName);
                acc[key] = (acc[key] || 0) + item.quantity;
            }
            return acc;
        }, {});

        const productIds = items.map((item: any) => item.productId).filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((product) => [String(product._id), product]));

        const inventoryRows = await Inventory.find({
            vendor: vendor._id,
            product: { $in: productIds },
        });
        const inventoryMap = new Map(inventoryRows.map((row) => [String(row.product), row]));

        const recordItems = [];
        let totalQuantity = 0;

        for (const rawItem of items) {
            const product = productMap.get(String(rawItem.productId));
            const inventory = inventoryMap.get(String(rawItem.productId));
            const quantity = Number(rawItem.quantity || 0);

            if (!product || !inventory) {
                res.status(400).json({ message: 'Selected commodity is not available with this dealer' });
                return;
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                res.status(400).json({ message: `Invalid quantity for ${product.name}` });
                return;
            }

            if (inventory.quantity < quantity) {
                res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                return;
            }

            const commodityKey = normalizeCommodityKey(product.name);
            const quotaLimit = quotaMap[commodityKey as keyof typeof quotaMap] ?? 0;
            const alreadyTaken = alreadyCollected[commodityKey] || 0;

            if (alreadyTaken + quantity > quotaLimit) {
                res.status(400).json({
                    message: `${product.name} exceeds the monthly quota. Remaining quota: ${Math.max(0, quotaLimit - alreadyTaken)} ${product.unit}.`,
                });
                return;
            }

            inventory.quantity -= quantity;
            await inventory.save();

            totalQuantity += quantity;
            recordItems.push({
                product: product._id,
                productName: product.name,
                unit: product.unit,
                quantity,
            });
        }

        const distributionRecord = await DistributionRecord.create({
            user: citizen._id,
            vendor: vendor._id,
            rationCardNumber: rationCard.rationCardNumber,
            verifiedPersonName: isHead ? rationCard.headOfFamilyName : matchedMember!.name,
            verifiedPersonAadhaar: String(aadhaarNumber).trim(),
            verificationMethod,
            verificationReference: verificationReference || undefined,
            slot: slot || undefined,
            monthKey,
            items: recordItems,
            totalQuantity,
            collectedAt: new Date(),
        });

        activeCode.status = 'USED';
        activeCode.usedAt = new Date();
        await activeCode.save();

        await createNotification({
            user: citizen._id,
            title: 'Ration collected successfully',
            message: `Your ration collection has been recorded by ${vendor.shopName || vendor.name}.`,
            type: 'RATION_COLLECTED',
            priority: 'medium',
            actionUrl: '/citizen-dashboard/history',
            metadata: {
                distributionId: String(distributionRecord._id),
                slot: slot || null,
            },
        });

        const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
        for (const admin of admins) {
            await createNotification({
                user: admin._id,
                title: 'Verified ration collection',
                message: `${citizen.name} collected ration from ${vendor.shopName || vendor.name}. Verification: ${verificationMethod}.`,
                type: 'RATION_COLLECTION_VERIFIED',
                priority: 'medium',
                actionUrl: '/admin-dashboard/reports',
                metadata: { distributionId: String(distributionRecord._id), vendorId: String(vendor._id), userId: String(citizen._id) },
            });
        }

        res.status(201).json({ success: true, data: distributionRecord });
    } catch (error) {
        next(error);
    }
};

export const getDistributionRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        let query: Record<string, unknown> = {};

        if (currentUser.role === UserRole.USER) {
            query = { user: currentUser._id };
        } else if (currentUser.role === UserRole.VENDOR) {
            query = { vendor: currentUser._id };
        } else if (currentUser.role === UserRole.ADMIN) {
            query = {};
        }

        const records = await DistributionRecord.find(query)
            .populate('user', 'name rationCardNumber district state')
            .populate('vendor', 'name shopName district state')
            .sort({ collectedAt: -1, createdAt: -1 });

        res.json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};
