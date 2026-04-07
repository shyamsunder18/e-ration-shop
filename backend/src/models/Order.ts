import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
    PENDING = 'PENDING',
    PACKED = 'PACKED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
    priceAtPurchase: number;
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    vendor: mongoose.Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    status: OrderStatus;
    paymentId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true }, // Snapshotted price
});

const OrderSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [OrderItemSchema],
        totalAmount: { type: Number, required: true },
        status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
        paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    },
    { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
