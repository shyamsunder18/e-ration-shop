import mongoose, { Document, Schema } from 'mongoose';

export interface ICentralStock extends Document {
    commodityKey: string;
    commodityName: string;
    unit: string;
    monthlyQuota: number;
    availableQuantity: number;
    monthKey: string;
    createdAt: Date;
    updatedAt: Date;
}

const CentralStockSchema = new Schema<ICentralStock>(
    {
        commodityKey: { type: String, required: true, unique: true, trim: true },
        commodityName: { type: String, required: true, trim: true },
        unit: { type: String, required: true, trim: true },
        monthlyQuota: { type: Number, required: true, min: 0 },
        availableQuantity: { type: Number, required: true, min: 0 },
        monthKey: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

export default mongoose.model<ICentralStock>('CentralStock', CentralStockSchema);
