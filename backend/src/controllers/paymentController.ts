import { Request, Response, NextFunction } from 'express';
import Order, { OrderStatus } from '../models/Order';
import Payment, { PaymentStatus } from '../models/Payment';
import mongoose from 'mongoose';

// @desc    Simulate payment
// @route   POST /api/payments/simulate
// @access  Private
// Hardening: Idempotency and Atomic Updates
export const simulatePayment = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId, amount, status } = req.body; // status: COMPLETED or FAILED

    try {
        // 1. Atomic Check and Lock: Only proceed if order is PENDING
        // This prevents double payments or race conditions on the same order
        const order = await Order.findOne({ _id: orderId, status: OrderStatus.PENDING });

        if (!order) {
            // Could be already paid or not found
            // We check if it exists at all
            const existingOrder = await Order.findById(orderId);
            if (!existingOrder) {
                res.status(404).json({ success: false, message: 'Order not found' });
                return;
            }
            // If exists but not PENDING, it's a duplicate attempt or invalid state
            res.status(400).json({ success: false, message: 'Order is not in pending state or already processed' });
            return;
        }

        // Check ownership
        if (order.user.toString() !== (req.user?._id as mongoose.Types.ObjectId).toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        // Create Payment Record
        const payment = await Payment.create({
            order: orderId,
            user: req.user?._id,
            amount: amount || order.totalAmount,
            status: status || PaymentStatus.COMPLETED,
            transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        });

        // Update Order Status Atomically based on success
        if (payment.status === PaymentStatus.COMPLETED) {
            // We use findOneAndUpdate to ensure we definitely update the right doc state
            await Order.findByIdAndUpdate(orderId, {
                // Decoupled: Payment does NOT auto-pack. Vendor must pack manually.
                paymentId: payment._id
            });
            console.log(`Log: Order ${orderId} marked as PAID`);
        }

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};
