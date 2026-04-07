import mongoose, { Schema, Document } from 'mongoose';

export enum RationCardType {
    AAY = 'AAY',
    BPL = 'BPL',
    APL = 'APL',
    PHH = 'PHH',
}

export interface IFamilyMember {
    name: string;
    age: number;
    relationshipToHead: string;
    aadhaarNumber: string;
    biometricReference?: string;
    fingerprintTemplate?: string;
}

export interface IRationCard extends Document {
    user: mongoose.Types.ObjectId;
    headOfFamilyName: string;
    rationCardNumber: string;
    aadhaarNumber: string;
    cardType: RationCardType;
    numberOfFamilyMembers: number;
    addressLine?: string;
    district?: string;
    state?: string;
    familyPhotoUrl?: string;
    biometricReference?: string;
    fingerprintTemplate?: string;
    members: IFamilyMember[];
    createdAt: Date;
    updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
    {
        name: { type: String, required: true, trim: true },
        age: { type: Number, required: true, min: 0 },
        relationshipToHead: { type: String, required: true, trim: true },
        aadhaarNumber: { type: String, required: true, trim: true },
        biometricReference: { type: String, trim: true },
        fingerprintTemplate: { type: String, trim: true },
    },
    { _id: false }
);

const RationCardSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        headOfFamilyName: { type: String, required: true, trim: true },
        // Multiple registered users can belong to the same household ration card.
        rationCardNumber: { type: String, required: true, trim: true },
        aadhaarNumber: { type: String, required: true, trim: true },
        cardType: { type: String, enum: Object.values(RationCardType), default: RationCardType.APL },
        numberOfFamilyMembers: { type: Number, required: true, min: 1, default: 1 },
        addressLine: { type: String, trim: true },
        district: { type: String, trim: true },
        state: { type: String, trim: true },
        familyPhotoUrl: { type: String, trim: true },
        biometricReference: { type: String, trim: true },
        fingerprintTemplate: { type: String, trim: true },
        members: { type: [FamilyMemberSchema], default: [] },
    },
    { timestamps: true }
);

RationCardSchema.index({ rationCardNumber: 1 });

export default mongoose.model<IRationCard>('RationCard', RationCardSchema);
