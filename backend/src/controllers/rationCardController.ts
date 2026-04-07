import { Request, Response } from 'express';
import RationCard, { IFamilyMember, RationCardType } from '../models/RationCard';
import { UserRole } from '../models/User';
import RationRegistry from '../models/RationRegistry';
import DistributionRecord from '../models/DistributionRecord';

const toRationCardType = (value?: string): RationCardType => {
    if (value === RationCardType.AAY) return RationCardType.AAY;
    if (value === RationCardType.BPL) return RationCardType.BPL;
    if (value === RationCardType.PHH) return RationCardType.PHH;
    return RationCardType.APL;
};

const sanitizeMembers = (members: unknown): IFamilyMember[] => {
    if (!Array.isArray(members)) return [];

    return members
        .filter((member) => member && typeof member === 'object')
        .map((member: any) => ({
            name: String(member.name || '').trim(),
            age: Number(member.age || 0),
            relationshipToHead: String(member.relationshipToHead || '').trim(),
            aadhaarNumber: String(member.aadhaarNumber || '').trim(),
            biometricReference: member.biometricReference ? String(member.biometricReference).trim() : undefined,
            fingerprintTemplate: member.fingerprintTemplate ? String(member.fingerprintTemplate).trim() : undefined,
        }))
        .filter((member) => member.name && member.relationshipToHead && member.aadhaarNumber);
};

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
        if (cardType === RationCardType.AAY || cardType === RationCardType.BPL) return 4 * familyMembers;
        if (cardType === RationCardType.PHH) return 5 * familyMembers;
        return 0;
    }
    if (commodityKey === 'wheat') {
        if (cardType === RationCardType.AAY || cardType === RationCardType.PHH) return 2 * familyMembers;
        if (cardType === RationCardType.BPL) return 1 * familyMembers;
        return 0;
    }
    if (commodityKey === 'sugar') {
        if (cardType === RationCardType.AAY || cardType === RationCardType.PHH) return 1 * familyMembers;
        if (cardType === RationCardType.BPL) return 0.5 * familyMembers;
        return 0;
    }
    if (commodityKey === 'kerosene') {
        if (cardType === RationCardType.AAY || cardType === RationCardType.PHH) return 1 * familyMembers;
        if (cardType === RationCardType.BPL) return 0.5 * familyMembers;
        return 0;
    }
    return 0;
};

const resolveQuota = (_registryValue: number | undefined, fallbackValue: number) => fallbackValue;

// @desc    Get logged-in citizen's ration card
// @route   GET /api/ration-card/me
// @access  Private/User
export const getMyRationCard = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (user.role !== UserRole.USER) {
            res.status(403).json({ message: 'Only citizens can access ration cards' });
            return;
        }

        let rationCard = await RationCard.findOne({ user: user._id });

        if (!rationCard) {
            rationCard = await RationCard.create({
                user: user._id,
                headOfFamilyName: user.name,
                rationCardNumber: user.rationCardNumber || `RC-${Date.now()}`,
                aadhaarNumber: user.aadhaar || '',
                cardType: toRationCardType(user.cardCategory),
                numberOfFamilyMembers: user.familyMembers || 1,
                district: user.district,
                state: user.state,
                addressLine: user.address,
                members: [
                    {
                        name: user.name,
                        age: 0,
                        relationshipToHead: 'Head',
                        aadhaarNumber: user.aadhaar || '',
                    },
                ],
            });
        }

        const registry = await RationRegistry.findOne({ rationCardNumber: rationCard.rationCardNumber }).select('riceQuota wheatQuota sugarQuota members cardType');
        const familyMembers = registry?.members?.length || rationCard.numberOfFamilyMembers || user.familyMembers || 1;
        const cardType = registry?.cardType || rationCard.cardType || toRationCardType(user.cardCategory);
        const monthlyQuota = {
            rice: resolveQuota(registry?.riceQuota, fallbackQuota('rice', cardType, familyMembers)),
            wheat: resolveQuota(registry?.wheatQuota, fallbackQuota('wheat', cardType, familyMembers)),
            sugar: resolveQuota(registry?.sugarQuota, fallbackQuota('sugar', cardType, familyMembers)),
            kerosene: fallbackQuota('kerosene', cardType, familyMembers),
        };

        const monthKey = currentMonthKey();
        const distributionRecords = await DistributionRecord.find({ user: user._id, monthKey }).select('items');
        const monthlyCollected = distributionRecords.reduce<Record<string, number>>((acc, record) => {
            for (const item of record.items) {
                const key = normalizeCommodityKey(item.productName);
                acc[key] = (acc[key] || 0) + Number(item.quantity || 0);
            }
            return acc;
        }, { rice: 0, wheat: 0, sugar: 0, kerosene: 0 });

        res.json({
            ...rationCard.toObject(),
            monthlyQuota,
            monthlyCollected: {
                rice: monthlyCollected.rice || 0,
                wheat: monthlyCollected.wheat || 0,
                sugar: monthlyCollected.sugar || 0,
                kerosene: monthlyCollected.kerosene || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update logged-in citizen's ration card and members
// @route   PUT /api/ration-card/me
// @access  Private/User
export const upsertMyRationCard = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (user.role !== UserRole.USER) {
            res.status(403).json({ message: 'Only citizens can update ration cards' });
            return;
        }

        const {
            headOfFamilyName,
            rationCardNumber,
            aadhaarNumber,
            cardType,
            addressLine,
            district,
            state,
            familyPhotoUrl,
            biometricReference,
            fingerprintTemplate,
            members,
            numberOfFamilyMembers,
        } = req.body;

        const sanitizedMembers = sanitizeMembers(members);
        const resolvedFamilyCount = Math.max(
            Number(numberOfFamilyMembers || 0),
            sanitizedMembers.length || 1
        );

        const updatePayload = {
            user: user._id,
            headOfFamilyName: headOfFamilyName || user.name,
            rationCardNumber: rationCardNumber || user.rationCardNumber || `RC-${Date.now()}`,
            aadhaarNumber: aadhaarNumber || user.aadhaar || '',
            cardType: toRationCardType((cardType as string) || user.cardCategory),
            numberOfFamilyMembers: resolvedFamilyCount,
            addressLine: addressLine ?? user.address,
            district: district ?? user.district,
            state: state ?? user.state,
            familyPhotoUrl,
            biometricReference,
            fingerprintTemplate,
            members: sanitizedMembers.length ? sanitizedMembers : undefined,
        };

        const rationCard = await RationCard.findOneAndUpdate(
            { user: user._id },
            updatePayload,
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.json(rationCard);
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(400).json({ message: 'Ration card number already exists' });
            return;
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify if a citizen/member is eligible under a ration card
// @route   POST /api/ration-card/verify-member
// @access  Private/Vendor or Admin
export const verifyFamilyMemberEligibility = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (currentUser.role !== UserRole.VENDOR && currentUser.role !== UserRole.ADMIN) {
            res.status(403).json({ message: 'Only dealers/admins can verify family members' });
            return;
        }

        const aadhaarNumber = String(req.body?.aadhaarNumber || '').trim();
        const rationCardNumber = String(req.body?.rationCardNumber || '').trim();

        if (!aadhaarNumber && !rationCardNumber) {
            res.status(400).json({ message: 'Aadhaar number or ration card number is required' });
            return;
        }

        const conditions: Record<string, unknown>[] = [];
        if (aadhaarNumber) {
            conditions.push({ aadhaarNumber }, { 'members.aadhaarNumber': aadhaarNumber });
        }
        if (rationCardNumber) {
            conditions.push({ rationCardNumber });
        }

        const rationCard = await RationCard.findOne({ $or: conditions });
        if (!rationCard) {
            res.status(404).json({ message: 'No ration card or member found for provided details' });
            return;
        }

        const matchedMember = aadhaarNumber
            ? rationCard.members.find((member) => member.aadhaarNumber === aadhaarNumber)
            : undefined;

        const isHead = !!aadhaarNumber && rationCard.aadhaarNumber === aadhaarNumber;

        res.json({
            eligible: true,
            rationCardNumber: rationCard.rationCardNumber,
            cardType: rationCard.cardType,
            headOfFamilyName: rationCard.headOfFamilyName,
            numberOfFamilyMembers: rationCard.numberOfFamilyMembers,
            matchedPerson: isHead
                ? { name: rationCard.headOfFamilyName, relationshipToHead: 'Head', aadhaarNumber: rationCard.aadhaarNumber }
                : (matchedMember || null),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
