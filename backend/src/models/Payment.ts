import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface IPayment extends Document {
    order: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    amount: number;
    status: PaymentStatus;
    transactionId?: string; // Mocked transaction ID
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
    {
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
        transactionId: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
