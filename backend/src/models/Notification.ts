import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    message: string;
    read: boolean;
    type: string; // 'ORDER_UPDATE', 'VENDOR_APPROVAL', 'SYSTEM'
    priority?: 'low' | 'medium' | 'high';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        type: { type: String, required: true },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        actionUrl: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1, type: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
