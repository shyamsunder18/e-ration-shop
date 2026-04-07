import mongoose, { Document, Schema } from 'mongoose';

export interface ICollectionCode extends Document {
    user: mongoose.Types.ObjectId;
    vendor: mongoose.Types.ObjectId;
    code: string;
    monthKey: string;
    status: 'ACTIVE' | 'USED' | 'EXPIRED';
    issuedBy: mongoose.Types.ObjectId;
    usedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CollectionCodeSchema = new Schema<ICollectionCode>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        code: { type: String, required: true, trim: true },
        monthKey: { type: String, required: true, trim: true, index: true },
        status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE', index: true },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        usedAt: { type: Date },
    },
    { timestamps: true }
);

CollectionCodeSchema.index({ user: 1, vendor: 1, monthKey: 1, status: 1 });

export default mongoose.model<ICollectionCode>('CollectionCode', CollectionCodeSchema);
