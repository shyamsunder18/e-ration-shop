import { Request, Response } from 'express';
import Notification from '../models/Notification';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { type, read, page = '1', limit = '50' } = req.query;
        const query: Record<string, unknown> = { user: req.user?._id };

        if (type && String(type) !== 'all') {
            query.type = String(type);
        }

        if (read === 'true' || read === 'false') {
            query.read = read === 'true';
        }

        const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const safePage = Math.max(parseInt(String(page), 10) || 1, 1);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit),
            Notification.countDocuments(query),
            Notification.countDocuments({ user: req.user?._id, read: false }),
        ]);

        res.json({
            notifications,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                hasMore: safePage * safeLimit < total,
            },
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user?._id });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany({ user: req.user?._id, read: false }, { $set: { read: true } });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user?._id });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        res.json({ message: 'Notification removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
