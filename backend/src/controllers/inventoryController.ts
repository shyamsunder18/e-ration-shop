import { Request, Response, NextFunction } from 'express';
import Inventory from '../models/Inventory';
import Product from '../models/Product';

const CORE_COMMODITIES = ['Rice', 'Wheat', 'Sugar', 'Kerosene'];

// @desc    Get vendor's inventory
// @route   GET /api/inventory
// @access  Private/Vendor
export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendorId = req.user?._id;
        const products = await Product.find({ name: { $in: CORE_COMMODITIES } });
        const validProductIds = products.map((product) => product._id);

        for (const product of products) {
            await Inventory.findOneAndUpdate(
                { vendor: vendorId, product: product._id },
                {
                    $setOnInsert: {
                        vendor: vendorId,
                        product: product._id,
                        quantity: 0,
                        pricePerUnit: product.price || 0,
                        pendingQuantity: 0,
                        stockStatus: 'STABLE',
                    },
                },
                { upsert: true, new: false }
            );
        }

        const inventory = await Inventory.find({
            vendor: vendorId,
            product: { $in: validProductIds },
        }).populate('product');
        res.json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

// @desc    Update stock for a product
// @route   PUT /api/inventory/:productId
// @access  Private/Vendor
export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.params;
    const { quantity, pricePerUnit } = req.body;

    try {
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }

        // Safety constraint: Prevent negative stock setting by mistake
        if (quantity < 0) {
            res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
            return;
        }

        // Find inventory record for this vendor and product
        let inventory = await Inventory.findOne({
            vendor: req.user?._id,
            product: productId,
        });

        if (inventory) {
            // Update existing record
            // We enforce strict ownership via the query above (vendor: req.user?._id)
            inventory.quantity = quantity;
            if (pricePerUnit !== undefined) inventory.pricePerUnit = pricePerUnit;
            await inventory.save();
            res.json({ success: true, data: inventory });
        } else {
            // Create new record
            if (!pricePerUnit) {
                res.status(400).json({ success: false, message: 'Price per unit is required for new inventory items' });
                return;
            }
            inventory = await Inventory.create({
                vendor: req.user?._id,
                product: productId,
                quantity,
                pricePerUnit,
            });
            res.status(201).json({ success: true, data: inventory });
        }
    } catch (error) {
        next(error);
    }
};
