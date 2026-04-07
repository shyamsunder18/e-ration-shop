import { Request, Response, NextFunction } from 'express';
import Order, { OrderStatus } from '../models/Order';
import Cart, { ICart } from '../models/Cart';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private/User
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { vendorId } = req.body;

    try {
        const cart = await Cart.findOne({ user: req.user?._id });

        if (!cart || cart.items.length === 0) {
            res.status(400).json({ success: false, message: 'No items in cart' });
            return;
        }

        const orderItems = [];
        let totalAmount = 0;

        const inventoryItems = await Inventory.find({
            vendor: vendorId,
            product: { $in: cart.items.map(i => i.product) }
        });

        const inventoryMap = new Map();
        inventoryItems.forEach(inv => inventoryMap.set(inv.product.toString(), inv));

        // Fetch products to identify "Rice"
        const products = await Product.find({ _id: { $in: cart.items.map(i => i.product) } });
        const productMap = new Map();
        products.forEach((p: any) => productMap.set(p._id.toString(), p));

        const user = req.user;
        const category = user?.cardCategory;
        const familyMembers = user?.familyMembers || 1;

        for (const item of cart.items) {
            const inv = inventoryMap.get(item.product.toString());
            const product = productMap.get(item.product.toString());

            if (!inv || !product) {
                res.status(400).json({ success: false, message: `Product ${item.product} not found` });
                return;
            }

            if (inv.quantity < item.quantity) {
                res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
                return;
            }

            let price = product.price || 0;
            let effectivePrice = price;
            const productName = product.name.toLowerCase();
            const freeQuota =
                productName.includes('rice')
                    ? (category === 'AAY' || category === 'BPL' ? 4 * familyMembers : category === 'PHH' ? 5 * familyMembers : 0)
                    : productName.includes('wheat')
                        ? (category === 'AAY' || category === 'PHH' ? 2 * familyMembers : category === 'BPL' ? 1 * familyMembers : 0)
                        : productName.includes('sugar')
                            ? (category === 'AAY' || category === 'PHH' ? 1 * familyMembers : category === 'BPL' ? 0.5 * familyMembers : 0)
                            : productName.includes('kerosene')
                                ? (category === 'AAY' || category === 'PHH' ? 1 * familyMembers : category === 'BPL' ? 0.5 * familyMembers : 0)
                                : 0;

            if (freeQuota > 0) {
                if (item.quantity <= freeQuota) {
                    effectivePrice = 0;
                } else {
                    const paidQuantity = item.quantity - freeQuota;
                    effectivePrice = (paidQuantity * price) / item.quantity;
                }
            }

            totalAmount += effectivePrice * item.quantity;

            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                priceAtPurchase: effectivePrice
            });
        }

        // Attempt Atomic Decrement
        const updatePromises = cart.items.map(item => {
            return Inventory.findOneAndUpdate(
                {
                    vendor: vendorId,
                    product: item.product,
                    quantity: { $gte: item.quantity }
                },
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );
        });

        const results = await Promise.all(updatePromises);

        const failedUpdateIndex = results.findIndex(res => res === null);

        if (failedUpdateIndex !== -1) {
            // Rollback
            const rollbackPromises = results.map((res, index) => {
                if (res && index !== failedUpdateIndex) {
                    const item = cart.items[index];
                    return Inventory.findOneAndUpdate(
                        { vendor: vendorId, product: item.product },
                        { $inc: { quantity: item.quantity } }
                    );
                }
                return Promise.resolve();
            });
            await Promise.all(rollbackPromises);

            res.status(400).json({ success: false, message: 'Stock changed during checkout. Please try again.' });
            return;
        }

        const order = await Order.create({
            user: req.user?._id,
            vendor: vendorId,
            items: orderItems,
            totalAmount,
            status: OrderStatus.PENDING,
        });

        cart.items = [];
        await cart.save();

        console.log(`Log: Order ${order._id} created by user ${req.user?._id}`);

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Get orders (Role based filtering)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userRole = req.user?.role;
        let query = {};

        if (userRole === UserRole.USER) {
            query = { user: req.user?._id };
        } else if (userRole === UserRole.VENDOR) {
            query = { vendor: req.user?._id };
        } else if (userRole === UserRole.ADMIN) {
            query = {}; // All orders
        } else {
            res.status(403).json({ success: false, message: "Not Authorized" });
            return;
        }

        const orders = await Order.find(query)
            .populate('user', 'name email address')
            .populate('vendor', 'name shopName')
            .populate('items.product', 'name unit thumbnail')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PACKED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.body;

    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found' });
            return;
        }

        // Ensure vendor owns this order
        const orderVendorId = order.vendor.toString();
        const currentUserId = (req.user?._id as mongoose.Types.ObjectId).toString();

        if (orderVendorId !== currentUserId) {
            res.status(403).json({ success: false, message: 'Not authorized to update this order' });
            return;
        }

        // Correctness Fix: Status Transition Validation
        const allowedTransitions: OrderStatus[] = VALID_TRANSITIONS[order.status as OrderStatus] || [];

        // Allow staying in same status check if needed, but strictly moving forward:
        if (order.status !== status && !allowedTransitions.includes(status as OrderStatus)) {
            res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`
            });
            return;
        }

        order.status = status;
        await order.save();

        console.log(`Log: Order ${order._id} status updated to ${status} for User ${order.user}`);

        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};
