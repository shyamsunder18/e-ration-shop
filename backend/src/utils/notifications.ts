import Notification from '../models/Notification';

type NotificationPayload = {
    user: string | object;
    title: string;
    message: string;
    type: string;
    priority?: 'low' | 'medium' | 'high';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
};

export const createNotification = async (payload: NotificationPayload) => {
    return Notification.create({
        read: false,
        priority: 'medium',
        ...payload,
    });
};

export const createNotifications = async (payloads: NotificationPayload[]) => {
    if (payloads.length === 0) return [];

    return Notification.insertMany(
        payloads.map((payload) => ({
            read: false,
            priority: 'medium',
            ...payload,
        }))
    );
};
