import mongoose, { Document, Schema } from 'mongoose';

export interface IDistributionItem {
    product: mongoose.Types.ObjectId;
    productName: string;
    unit: string;
    quantity: number;
}

export interface IDistributionRecord extends Document {
    user: mongoose.Types.ObjectId;
    vendor: mongoose.Types.ObjectId;
    rationCardNumber: string;
    verifiedPersonName: string;
    verifiedPersonAadhaar: string;
    verificationMethod: 'AADHAAR' | 'BIOMETRIC';
    verificationReference?: string;
    slot?: string;
    monthKey: string;
    items: IDistributionItem[];
    totalQuantity: number;
    collectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DistributionItemSchema = new Schema<IDistributionItem>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true, trim: true },
        unit: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0.01 },
    },
    { _id: false }
);

const DistributionRecordSchema = new Schema<IDistributionRecord>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        rationCardNumber: { type: String, required: true, trim: true },
        verifiedPersonName: { type: String, required: true, trim: true },
        verifiedPersonAadhaar: { type: String, required: true, trim: true },
        verificationMethod: { type: String, enum: ['AADHAAR', 'BIOMETRIC'], required: true },
        verificationReference: { type: String, trim: true },
        slot: { type: String, trim: true },
        monthKey: { type: String, required: true, trim: true, index: true },
        items: { type: [DistributionItemSchema], default: [] },
        totalQuantity: { type: Number, required: true, min: 0.01 },
        collectedAt: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

DistributionRecordSchema.index({ user: 1, monthKey: 1 });
DistributionRecordSchema.index({ vendor: 1, monthKey: 1 });

export default mongoose.model<IDistributionRecord>('DistributionRecord', DistributionRecordSchema);
