import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string; // e.g., Rice, Wheat, Sugar
    description?: string;
    unit: string; // e.g., kg, liter
    price: number; // Centralized price set by admin
    thumbnail?: string; // URL to image
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
        unit: { type: String, required: true },
        price: { type: Number, default: 0 },
        thumbnail: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
