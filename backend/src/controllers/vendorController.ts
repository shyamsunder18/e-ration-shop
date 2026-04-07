import { Request, Response, NextFunction } from 'express';
import User, { UserRole, VendorStatus } from '../models/User';
import Inventory from '../models/Inventory';
import mongoose from 'mongoose';
import { createNotification, createNotifications } from '../utils/notifications';

// @desc    Get all citizens assigned to the logged-in vendor
// @route   GET /api/vendor/beneficiaries
// @access  Private/Vendor
export const getAssignedBeneficiaries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const beneficiaries = await User.find({
            role: UserRole.USER,
            assignedVendor: req.user?._id,
            status: VendorStatus.APPROVED,
        });
        res.json({ success: true, data: beneficiaries });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm stock adjustment from admin
// @route   POST /api/vendor/inventory/:id/confirm
// @access  Private/Vendor
export const confirmStockUpdate = async (req: Request, res: Response) => {
    try {
        const inventory = await Inventory.findOne({ _id: req.params.id, vendor: req.user?._id });
        if (!inventory) {
            res.status(404).json({ message: 'Inventory record not found' });
            return;
        }

        if (inventory.stockStatus !== 'PENDING_APPROVAL') {
            res.status(400).json({ message: 'No pending stock update to confirm' });
            return;
        }

        inventory.quantity += inventory.pendingQuantity || 0;
        inventory.pendingQuantity = 0;
        inventory.stockStatus = 'STABLE';
        await inventory.save();

        const admins = await User.find({ role: UserRole.ADMIN }).select('_id');

        await createNotifications(
            admins.map((admin) => ({
                user: admin._id,
                title: 'Dealer confirmed stock receipt',
                message: `${req.user?.shopName || req.user?.name} confirmed an admin stock release.`,
                type: 'STOCK_CONFIRMED',
                priority: 'medium' as const,
                actionUrl: '/admin-dashboard/goods',
                metadata: { inventoryId: String(inventory._id), vendorId: String(req.user?._id) },
            }))
        );

        res.json({ success: true, message: 'Stock update confirmed', data: inventory });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Flag stock adjustment from admin
// @route   POST /api/vendor/inventory/:id/flag
// @access  Private/Vendor
export const flagStockUpdate = async (req: Request, res: Response) => {
    const { reason } = req.body;
    try {
        const inventory = await Inventory.findOne({ _id: req.params.id, vendor: req.user?._id });
        if (!inventory) {
            res.status(404).json({ message: 'Inventory record not found' });
            return;
        }

        inventory.stockStatus = 'FLAGGED';
        await inventory.save();

        // Notify Admin
        const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
        await createNotifications(
            admins.map((admin) => ({
                user: admin._id,
                title: 'Stock discrepancy reported',
                message: `Dealer ${req.user?.shopName || req.user?.name} flagged a stock update. Reason: ${reason || 'Not specified'}.`,
                type: 'STOCK_FLAG',
                priority: 'high',
                actionUrl: '/admin-dashboard/goods',
                metadata: { inventoryId: String(inventory._id), vendorId: String(req.user?._id), reason },
            }))
        );

        res.json({ success: true, message: 'Stock update flagged to Admin' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send a global notification to all assigned citizens
// @route   POST /api/vendor/notify-citizens
// @access  Private/Vendor
export const notifyCitizens = async (req: Request, res: Response) => {
    const { message } = req.body;
    try {
        const citizens = await User.find({
            assignedVendor: req.user?._id,
            role: UserRole.USER,
            status: VendorStatus.APPROVED,
        });

        if (citizens.length === 0) {
            res.status(400).json({ message: 'No citizens assigned to you' });
            return;
        }

        await createNotifications(
            citizens.map((c) => ({
                user: c._id,
                title: 'Global dealer update',
                message: message || `Reminder from ${req.user?.shopName || req.user?.name}: Your monthly ration is available for collection.`,
                type: 'GLOBAL_COLLECTION_ALERT',
                priority: 'medium',
                actionUrl: '/citizen-dashboard/notifications',
                metadata: { vendorId: String(req.user?._id), scope: 'GLOBAL' },
            }))
        );

        await createNotification({
            user: req.user!._id,
            title: 'Global citizen broadcast sent',
            message: `Your global notification was sent to ${citizens.length} assigned citizens.`,
            type: 'BROADCAST_SENT',
            priority: 'low',
            actionUrl: '/dealer-dashboard/notifications',
            metadata: { recipients: citizens.length, scope: 'GLOBAL' },
        });

        res.json({ success: true, message: `Notification sent to ${citizens.length} citizens` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send a personal slot notification to one assigned citizen
// @route   POST /api/vendor/notify-citizen/:userId
// @access  Private/Vendor
export const notifyCitizenPersonal = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { message, slot } = req.body;

    try {
        const citizen = await User.findOne({
            _id: userId,
            assignedVendor: req.user?._id,
            role: UserRole.USER,
            status: VendorStatus.APPROVED,
        });

        if (!citizen) {
            res.status(404).json({ message: 'Assigned citizen not found' });
            return;
        }

        const slotMessage = slot ? ` Your allotted slot is ${slot}.` : '';

        await createNotification({
            user: citizen._id,
            title: 'Personal ration collection slot',
            message: message || `Message from ${req.user?.shopName || req.user?.name}: Please collect your ration at your assigned slot.${slotMessage}`,
            type: 'PERSONAL_SLOT_ALLOCATION',
            priority: 'high',
            actionUrl: '/citizen-dashboard/notifications',
            metadata: {
                vendorId: String(req.user?._id),
                scope: 'PERSONAL',
                slot: slot || null,
            },
        });

        await createNotification({
            user: req.user!._id,
            title: 'Personal citizen notification sent',
            message: `A personal notification was sent to ${citizen.name}${slot ? ` for slot ${slot}` : ''}.`,
            type: 'BROADCAST_SENT',
            priority: 'low',
            actionUrl: '/dealer-dashboard/notifications',
            metadata: { recipient: String(citizen._id), scope: 'PERSONAL', slot: slot || null },
        });

        res.json({ success: true, message: `Personal notification sent to ${citizen.name}` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
