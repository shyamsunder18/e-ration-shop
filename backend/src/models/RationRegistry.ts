import mongoose, { Document, Schema } from 'mongoose';
import { RationCardType } from './RationCard';

export interface IRegistryMember {
    name: string;
    age: number;
    relationshipToHead: string;
    aadhaarNumber: string;
    biometricReference?: string;
}

export interface IRationRegistry extends Document {
    rationCardNumber: string;
    dist: string;
    headOfFamilyName: string;
    headAadhaarNumber: string;
    cardType: RationCardType;
    addressLine: string;
    district: string;
    state: string;
    dealerAssigned?: string;
    riceQuota?: number;
    wheatQuota?: number;
    sugarQuota?: number;
    members: IRegistryMember[];
    createdAt: Date;
    updatedAt: Date;
}

const RegistryMemberSchema = new Schema<IRegistryMember>(
    {
        name: { type: String, required: true, trim: true },
        age: { type: Number, required: true, min: 0 },
        relationshipToHead: { type: String, required: true, trim: true },
        aadhaarNumber: { type: String, required: true, trim: true },
        biometricReference: { type: String, trim: true },
    },
    { _id: false }
);

const RationRegistrySchema = new Schema<IRationRegistry>(
    {
        rationCardNumber: { type: String, required: true, unique: true, trim: true },
        dist: { type: String, required: true, trim: true },
        headOfFamilyName: { type: String, required: true, trim: true },
        headAadhaarNumber: { type: String, required: true, trim: true },
        cardType: { type: String, enum: Object.values(RationCardType), required: true },
        addressLine: { type: String, required: true, trim: true },
        district: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        dealerAssigned: { type: String, trim: true },
        riceQuota: { type: Number, default: 0 },
        wheatQuota: { type: Number, default: 0 },
        sugarQuota: { type: Number, default: 0 },
        members: { type: [RegistryMemberSchema], default: [] },
    },
    { timestamps: true }
);

export default mongoose.model<IRationRegistry>('RationRegistry', RationRegistrySchema);
