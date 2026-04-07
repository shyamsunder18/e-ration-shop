import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
    vendor: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    quantity: number;
    pricePerUnit: number;
    pendingQuantity?: number;
    stockStatus?: 'STABLE' | 'PENDING_APPROVAL' | 'FLAGGED';
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
    {
        vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 0 },
        pricePerUnit: { type: Number, required: true },
        pendingQuantity: { type: Number },
        stockStatus: { type: String, enum: ['STABLE', 'PENDING_APPROVAL', 'FLAGGED'], default: 'STABLE' },
    },
    { timestamps: true }
);

// Compound index to ensure one record per product per vendor
InventorySchema.index({ vendor: 1, product: 1 }, { unique: true });

export default mongoose.model<IInventory>('Inventory', InventorySchema);
