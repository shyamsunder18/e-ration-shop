import { Request, Response } from 'express';
import User, { UserRole, VendorStatus } from '../models/User';
import Order from '../models/Order';
import Complaint from '../models/Complaint';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Notification from '../models/Notification';
import Cart from '../models/Cart';
import Payment from '../models/Payment';
import RationCard from '../models/RationCard';
import RationRegistry from '../models/RationRegistry';
import CollectionCode from '../models/CollectionCode';
import { createNotification } from '../utils/notifications';
import { deductCentralStock, ensureMonthlyCentralStock } from '../utils/centralStock';

type CommodityDemandLine = {
    commodityKey: string;
    commodityName: string;
    unit: string;
    productId: string | null;
    inventoryId: string | null;
    approvedCitizens: number;
    activeRationCards: number;
    monthlyDemand: number;
    currentStock: number;
    pendingRelease: number;
    availableAfterPending: number;
    shortfall: number;
    stockStatus: 'STABLE' | 'PENDING_APPROVAL' | 'FLAGGED';
};

type DealerDemandPlan = {
    vendorId: string;
    dealerName: string;
    shopName: string;
    district: string;
    state: string;
    approvedCitizens: number;
    activeRationCards: number;
    commodities: CommodityDemandLine[];
};

const commodityCatalog = [
    {
        key: 'rice',
        label: 'Rice',
        fallbackQuota: (cardType?: string, familyMembers = 1) =>
            cardType === 'AAY' || cardType === 'BPL' ? 4 * familyMembers : (cardType === 'PHH' ? 5 * familyMembers : 0),
    },
    {
        key: 'wheat',
        label: 'Wheat',
        fallbackQuota: (cardType?: string, familyMembers = 1) =>
            cardType === 'AAY' || cardType === 'PHH' ? 2 * familyMembers : (cardType === 'BPL' ? 1 * familyMembers : 0),
    },
    {
        key: 'sugar',
        label: 'Sugar',
        fallbackQuota: (cardType?: string, familyMembers = 1) =>
            cardType === 'AAY' || cardType === 'PHH' ? 1 * familyMembers : (cardType === 'BPL' ? 0.5 * familyMembers : 0),
    },
    {
        key: 'kerosene',
        label: 'Kerosene',
        fallbackQuota: (cardType?: string, familyMembers = 1) =>
            cardType === 'AAY' || cardType === 'PHH' ? 1 * familyMembers : (cardType === 'BPL' ? 0.5 * familyMembers : 0),
    },
];

const CORE_COMMODITIES = ['Rice', 'Wheat', 'Sugar', 'Kerosene'];

const normalizeCommodityName = (name?: string): string => (name || '').trim().toLowerCase();

const detectCommodityKey = (name?: string): string | null => {
    const normalized = normalizeCommodityName(name);
    if (normalized.includes('rice')) return 'rice';
    if (normalized.includes('wheat')) return 'wheat';
    if (normalized.includes('sugar')) return 'sugar';
    if (normalized.includes('kerosene')) return 'kerosene';
    return null;
};

const resolveQuota = (_registryValue: number | undefined, fallbackValue: number) => fallbackValue;

const currentMonthKey = () => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
};

const buildDealerDemandPlans = async (): Promise<DealerDemandPlan[]> => {
    const [approvedVendors, approvedUsers, products, inventoryRows] = await Promise.all([
        User.find({ role: UserRole.VENDOR, status: VendorStatus.APPROVED }).select('_id name shopName district state'),
        User.find({
            role: UserRole.USER,
            status: VendorStatus.APPROVED,
            assignedVendor: { $ne: null },
        }).select('_id name assignedVendor rationCardNumber familyMembers cardCategory'),
        Product.find({}).select('_id name unit price'),
        Inventory.find({})
            .populate('product', 'name unit price')
            .select('_id vendor product quantity pendingQuantity stockStatus'),
    ]);

    const rationCardNumbers = Array.from(new Set(
        approvedUsers
            .map((user) => user.rationCardNumber)
            .filter((rationCardNumber): rationCardNumber is string => Boolean(rationCardNumber))
    ));

    const registryRows = await RationRegistry.find({ rationCardNumber: { $in: rationCardNumbers } })
        .select('rationCardNumber cardType riceQuota wheatQuota sugarQuota members');
    const registryMap = new Map(registryRows.map((row) => [row.rationCardNumber, row]));

    const productMap = new Map<string, any>();
    for (const product of products) {
        const commodityKey = detectCommodityKey(product.name);
        if (commodityKey && !productMap.has(commodityKey)) {
            productMap.set(commodityKey, product);
        }
    }

    const inventoryMap = new Map<string, any>();
    for (const row of inventoryRows) {
        const product = row.product as any;
        const commodityKey = detectCommodityKey(product?.name);
        if (!commodityKey) continue;
        inventoryMap.set(`${String(row.vendor)}:${commodityKey}`, row);
    }

    const usersByVendor = new Map<string, typeof approvedUsers>();
    for (const user of approvedUsers) {
        const vendorId = String(user.assignedVendor);
        if (!usersByVendor.has(vendorId)) {
            usersByVendor.set(vendorId, []);
        }
        usersByVendor.get(vendorId)!.push(user);
    }

    return approvedVendors.map((vendor) => {
        const vendorId = String(vendor._id);
        const assignedUsers = usersByVendor.get(vendorId) || [];
        const rationCards = new Map<string, any>();

        for (const user of assignedUsers) {
            const rationCardNumber = user.rationCardNumber || `USER-${String(user._id)}`;
            if (!rationCards.has(rationCardNumber)) {
                rationCards.set(rationCardNumber, user);
            }
        }

        const commodities: CommodityDemandLine[] = commodityCatalog.map((commodity) => {
            let monthlyDemand = 0;

            for (const [rationCardNumber, user] of rationCards.entries()) {
                const registry = registryMap.get(rationCardNumber);
                const familyMembers = registry?.members?.length || user.familyMembers || 1;
                const cardType = registry?.cardType || user.cardCategory;

                if (commodity.key === 'rice') {
                    monthlyDemand += resolveQuota(registry?.riceQuota, commodity.fallbackQuota(cardType, familyMembers));
                } else if (commodity.key === 'wheat') {
                    monthlyDemand += resolveQuota(registry?.wheatQuota, commodity.fallbackQuota(cardType, familyMembers));
                } else if (commodity.key === 'sugar') {
                    monthlyDemand += resolveQuota(registry?.sugarQuota, commodity.fallbackQuota(cardType, familyMembers));
                } else {
                    monthlyDemand += commodity.fallbackQuota(cardType, familyMembers);
                }
            }

            const product = productMap.get(commodity.key) || null;
            const inventory = inventoryMap.get(`${vendorId}:${commodity.key}`) || null;
            const currentStock = inventory?.quantity || 0;
            const pendingRelease = inventory?.pendingQuantity || 0;
            const availableAfterPending = currentStock + pendingRelease;

            return {
                commodityKey: commodity.key,
                commodityName: product?.name || commodity.label,
                unit: product?.unit || (commodity.key === 'kerosene' ? 'L' : 'kg'),
                productId: product?._id ? String(product._id) : null,
                inventoryId: inventory?._id ? String(inventory._id) : null,
                approvedCitizens: assignedUsers.length,
                activeRationCards: rationCards.size,
                monthlyDemand,
                currentStock,
                pendingRelease,
                availableAfterPending,
                shortfall: Math.max(0, monthlyDemand - availableAfterPending),
                stockStatus: inventory?.stockStatus || 'STABLE',
            };
        });

        return {
            vendorId,
            dealerName: vendor.name,
            shopName: vendor.shopName || vendor.name,
            district: vendor.district || 'N/A',
            state: vendor.state || 'N/A',
            approvedCitizens: assignedUsers.length,
            activeRationCards: rationCards.size,
            commodities,
        };
    });
};

// @desc    Get all citizens (users)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ role: UserRole.USER }).populate('assignedVendor', 'shopName name state district');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
export const getVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await User.find({ role: UserRole.VENDOR });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all ration cards with user info
// @route   GET /api/admin/ration-cards
// @access  Private/Admin
export const getRationCards = async (req: Request, res: Response) => {
    try {
        const rationCards = await RationCard.find({})
            .populate('user', 'name email status district state')
            .sort({ updatedAt: -1 });
        res.json(rationCards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single ration card by id
// @route   GET /api/admin/ration-cards/:id
// @access  Private/Admin
export const getRationCardById = async (req: Request, res: Response) => {
    try {
        const rationCard = await RationCard.findById(req.params.id)
            .populate('user', 'name email status district state');

        if (!rationCard) {
            res.status(404).json({ message: 'Ration card not found' });
            return;
        }

        res.json(rationCard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update vendor status
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
export const updateVendorStatus = async (req: Request, res: Response) => {
    const { status } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.VENDOR) {
            res.status(404).json({ message: 'Vendor not found' });
            return;
        }

        user.status = status;
        await user.save();

        await createNotification({
            user: user._id,
            title: `Dealer status updated: ${status}`,
            message: `Your dealer account for ${user.shopName || user.name} has been marked as ${status}.`,
            type: 'DEALER_STATUS_UPDATE',
            priority: status === 'APPROVED' ? 'medium' : 'high',
            actionUrl: '/dealer-dashboard',
            metadata: { status },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({ role: UserRole.USER });
        const activeVendors = await User.countDocuments({ role: UserRole.VENDOR, status: VendorStatus.APPROVED });
        const pendingUsers = await User.countDocuments({ role: UserRole.USER, status: VendorStatus.PENDING });
        const pendingVendors = await User.countDocuments({ role: UserRole.VENDOR, status: VendorStatus.PENDING });
        const totalOrders = await Order.countDocuments({});

        // Calculate total distributed commodities (mock logic or aggregate from orders)
        // For now, simpler stats
        res.json({
            totalUsers,
            pendingUsers,
            activeVendors,
            pendingVendors,
            totalOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get complaints
// @route   GET /api/admin/complaints
// @access  Private/Admin
export const getComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await Complaint.find({}).populate('user', 'name email');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Assign user to a vendor/dealer
// @route   PUT /api/admin/users/:id/assign
// @access  Private/Admin
export const assignUserToVendor = async (req: Request, res: Response) => {
    const { vendorId } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.assignedVendor = vendorId;
        await user.save();

        if (vendorId) {
            const vendor = await User.findById(vendorId).select('_id shopName name');
            if (vendor) {
                await createNotification({
                    user: user._id,
                    title: 'Dealer assigned',
                    message: `You have been assigned to ${vendor.shopName || vendor.name} for ration distribution.`,
                    type: 'DEALER_ASSIGNED',
                    priority: 'medium',
                    actionUrl: '/citizen-dashboard/notifications',
                    metadata: { vendorId: String(vendor._id) },
                });

                await createNotification({
                    user: vendor._id,
                    title: 'New beneficiary assigned',
                    message: `${user.name} has been assigned to your distribution area.`,
                    type: 'BENEFICIARY_ASSIGNED',
                    priority: 'medium',
                    actionUrl: '/dealer-dashboard/beneficiaries',
                    metadata: { userId: String(user._id) },
                });
            }
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user (citizen) status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req: Request, res: Response) => {
    const { status } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.status = status;
        await user.save();

        await createNotification({
            user: user._id,
            title: `Citizen status updated: ${status}`,
            message: status === 'APPROVED'
                ? 'Your citizen registration has been approved. You can now sign in and view your ration details.'
                : `Your citizen registration status is now ${status}. Please contact the department if needed.`,
            type: 'CITIZEN_STATUS_UPDATE',
            priority: status === 'APPROVED' ? 'medium' : 'high',
            actionUrl: '/auth',
            metadata: { status },
        });

        if (status === VendorStatus.APPROVED && user.assignedVendor) {
            const vendor = await User.findById(user.assignedVendor).select('_id shopName name');

            if (vendor) {
                await createNotification({
                    user: vendor._id,
                    title: 'New approved beneficiary assigned',
                    message: `${user.name} has been approved and is now active under ${vendor.shopName || vendor.name}.`,
                    type: 'BENEFICIARY_ASSIGNED',
                    priority: 'medium',
                    actionUrl: '/dealer-dashboard/beneficiaries',
                    metadata: { userId: String(user._id) },
                });
            }
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user (citizen) category (AAY, BPL, APL)
// @route   PUT /api/admin/users/:id/category
// @access  Private/Admin
export const updateUserCategory = async (req: Request, res: Response) => {
    const { category } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.cardCategory = category;
        await user.save();

        await createNotification({
            user: user._id,
            title: 'Card category updated',
            message: `Your ration card category has been updated to ${category}.`,
            type: 'CARD_CATEGORY_UPDATED',
            priority: 'medium',
            actionUrl: '/citizen-dashboard',
            metadata: { category },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user (citizen) family members count
// @route   PUT /api/admin/users/:id/family
// @access  Private/Admin
export const updateUserFamilyMembers = async (req: Request, res: Response) => {
    const { members } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.familyMembers = members;
        await user.save();

        await createNotification({
            user: user._id,
            title: 'Family count updated',
            message: `Your registered family member count was updated to ${members}.`,
            type: 'FAMILY_DETAILS_UPDATED',
            priority: 'medium',
            actionUrl: '/citizen-dashboard',
            metadata: { members },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Issue monthly collection code for a citizen
// @route   POST /api/admin/users/:id/collection-code
// @access  Private/Admin
export const issueCollectionCode = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.status !== VendorStatus.APPROVED) {
            res.status(400).json({ message: 'Collection code can be issued only for approved citizens' });
            return;
        }

        if (!user.assignedVendor) {
            res.status(400).json({ message: 'Citizen must be assigned to a dealer before issuing a collection code' });
            return;
        }

        const monthKey = currentMonthKey();
        await CollectionCode.updateMany(
            { user: user._id, vendor: user.assignedVendor, monthKey, status: 'ACTIVE' },
            { $set: { status: 'EXPIRED' } }
        );

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const collectionCode = await CollectionCode.create({
            user: user._id,
            vendor: user.assignedVendor,
            code,
            monthKey,
            status: 'ACTIVE',
            issuedBy: req.user!._id,
        });

        await createNotification({
            user: user._id,
            title: 'Monthly ration collection code',
            message: `Your ration collection code for ${monthKey} is ${code}. Share this code with the dealer at the time of collection.`,
            type: 'COLLECTION_CODE_ISSUED',
            priority: 'high',
            actionUrl: '/citizen-dashboard/notifications',
            metadata: {
                code,
                monthKey,
                vendorId: String(user.assignedVendor),
                collectionCodeId: String(collectionCode._id),
            },
        });

        res.json({ success: true, data: { code, monthKey, id: collectionCode._id } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a citizen user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== UserRole.USER) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        await Promise.all([
            Cart.deleteOne({ user: user._id }),
            Complaint.deleteMany({ user: user._id }),
            Notification.deleteMany({ user: user._id }),
            Payment.deleteMany({ user: user._id }),
            Order.deleteMany({ user: user._id }),
            RationCard.deleteMany({ user: user._id }),
            User.findByIdAndDelete(user._id),
        ]);

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a vendor/dealer
// @route   DELETE /api/admin/vendors/:id
// @access  Private/Admin
export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const vendor = await User.findById(req.params.id);

        if (!vendor || vendor.role !== UserRole.VENDOR) {
            res.status(404).json({ message: 'Vendor not found' });
            return;
        }

        const vendorOrders = await Order.find({ vendor: vendor._id }).select('_id');
        const orderIds = vendorOrders.map((order) => order._id);

        await Promise.all([
            User.updateMany({ assignedVendor: vendor._id }, { $unset: { assignedVendor: '' } }),
            Inventory.deleteMany({ vendor: vendor._id }),
            Notification.deleteMany({ user: vendor._id }),
            Payment.deleteMany({ order: { $in: orderIds } }),
            Order.deleteMany({ vendor: vendor._id }),
            User.findByIdAndDelete(vendor._id),
        ]);

        res.json({ message: 'Vendor removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update product (price, name, etc.)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = async (req: Request, res: Response) => {
    const { name, description, unit, price } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.unit = unit || product.unit;
        if (price !== undefined) product.price = price;

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get global stock levels
// @route   GET /api/admin/inventory/global
// @access  Private/Admin
export const getGlobalInventory = async (req: Request, res: Response) => {
    try {
        const products = await Product.find({ name: { $in: CORE_COMMODITIES } }).select('_id');
        const validProductIds = products.map((product) => product._id);

        const inventory = await Inventory.find({
            product: { $in: validProductIds },
        })
            .populate('vendor', 'shopName name district state')
            .populate('product', 'name unit');
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get dealer-wise demand plan for commodity distribution
// @route   GET /api/admin/inventory/demand-plan
// @access  Private/Admin
export const getDealerDemandPlan = async (req: Request, res: Response) => {
    try {
        const plans = await buildDealerDemandPlans();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get central monthly admin stock balance
// @route   GET /api/admin/inventory/central-stock
// @access  Private/Admin
export const getCentralStock = async (req: Request, res: Response) => {
    try {
        const stock = await ensureMonthlyCentralStock();
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const queueVendorStockRelease = async (vendorId: string, productId: string, quantity: number) => {
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== UserRole.VENDOR) {
        throw new Error('Vendor not found');
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
    }

    const commodityKey = detectCommodityKey(product.name);
    if (!commodityKey) {
        throw new Error('No central stock mapping found for this commodity');
    }

    await deductCentralStock(commodityKey, quantity);

    let inventory = await Inventory.findOne({ vendor: vendor._id, product: product._id });

    if (!inventory) {
        inventory = await Inventory.create({
            vendor: vendor._id,
            product: product._id,
            quantity: 0,
            pendingQuantity: quantity,
            stockStatus: 'PENDING_APPROVAL',
            pricePerUnit: product.price || 0,
        });
    } else {
        inventory.pendingQuantity = (inventory.pendingQuantity || 0) + quantity;
        inventory.stockStatus = 'PENDING_APPROVAL';
        if (!inventory.pricePerUnit && product.price !== undefined) {
            inventory.pricePerUnit = product.price;
        }
        await inventory.save();
    }

    await createNotification({
        user: vendor._id,
        title: 'Commodity release queued',
        message: `${quantity} ${product.unit} of ${product.name} has been released by admin and is waiting for your confirmation.`,
        type: 'STOCK_UPDATE',
        priority: 'medium',
        actionUrl: '/dealer-dashboard/inventory',
        metadata: {
            inventoryId: String(inventory._id),
            productId: String(product._id),
            quantity,
        },
    });

    return inventory;
};

// @desc    Update or initialize vendor stock
// @route   PUT /api/admin/inventory/:id
// @access  Private/Admin
export const updateVendorStock = async (req: Request, res: Response) => {
    const { quantity } = req.body;
    try {
        const inventory = await Inventory.findById(req.params.id).populate('product', 'name');
        if (!inventory) {
            res.status(404).json({ message: 'Inventory record not found' });
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            res.status(400).json({ message: 'Release quantity must be greater than zero' });
            return;
        }

        const commodityKey = detectCommodityKey((inventory.product as any)?.name);
        if (!commodityKey) {
            res.status(400).json({ message: 'No central stock mapping found for this commodity' });
            return;
        }

        try {
            await deductCentralStock(commodityKey, quantity);
        } catch (error: any) {
            const message = String(error?.message || 'Failed to deduct central stock');
            const status = message.startsWith('Insufficient admin stock') ? 400 : 500;
            res.status(status).json({ message });
            return;
        }

        inventory.pendingQuantity = (inventory.pendingQuantity || 0) + quantity;
        inventory.stockStatus = 'PENDING_APPROVAL';
        await inventory.save();

        await createNotification({
            user: inventory.vendor,
            title: 'Admin stock update pending confirmation',
            message: `Admin has released ${quantity} more units for a product. Please confirm receipt or flag an issue.`,
            type: 'STOCK_UPDATE',
            priority: 'high',
            actionUrl: '/dealer-dashboard/inventory',
            metadata: { inventoryId: String(inventory._id), quantity },
        });

        const updatedInventory = await Inventory.findById(req.params.id)
            .populate('vendor', 'shopName name')
            .populate('product', 'name unit');

        res.json(updatedInventory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resolve a flagged stock discrepancy
// @route   POST /api/admin/inventory/:id/resolve
// @access  Private/Admin
export const resolveFlaggedStock = async (req: Request, res: Response) => {
    try {
        const inventory = await Inventory.findById(req.params.id)
            .populate('vendor', 'name shopName')
            .populate('product', 'name unit');

        if (!inventory) {
            res.status(404).json({ message: 'Inventory record not found' });
            return;
        }

        if (inventory.stockStatus !== 'FLAGGED') {
            res.status(400).json({ message: 'Only flagged stock discrepancies can be resolved' });
            return;
        }

        inventory.stockStatus = 'STABLE';
        await inventory.save();

        await createNotification({
            user: inventory.vendor as any,
            title: 'Stock discrepancy resolved',
            message: `Admin marked the ${((inventory.product as any)?.name) || 'stock'} issue as resolved.`,
            type: 'STOCK_CONFIRMED',
            priority: 'medium',
            actionUrl: '/dealer-dashboard/inventory',
            metadata: { inventoryId: String(inventory._id), resolvedBy: 'ADMIN' },
        });

        const updatedInventory = await Inventory.findById(req.params.id)
            .populate('vendor', 'shopName name district state')
            .populate('product', 'name unit');

        res.json(updatedInventory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Release stock to a vendor by selecting vendor and product
// @route   POST /api/admin/inventory/release
// @access  Private/Admin
export const releaseStockToVendor = async (req: Request, res: Response) => {
    const { vendorId, productId, quantity } = req.body;

    try {
        const inventory = await queueVendorStockRelease(String(vendorId), String(productId), Number(quantity));
        const updatedInventory = await Inventory.findById(inventory._id)
            .populate('vendor', 'shopName name district state')
            .populate('product', 'name unit');

        res.json(updatedInventory);
    } catch (error: any) {
        if (
            error?.message === 'Vendor not found' ||
            error?.message === 'Product not found' ||
            error?.message === 'Central stock not configured'
        ) {
            res.status(404).json({ message: error.message });
            return;
        }

        if (
            error?.message === 'Quantity must be greater than zero' ||
            error?.message === 'No central stock mapping found for this commodity' ||
            String(error?.message || '').startsWith('Insufficient admin stock')
        ) {
            res.status(400).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: 'Server Error' });
    }
};
