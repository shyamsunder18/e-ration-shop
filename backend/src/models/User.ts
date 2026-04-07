import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'ADMIN',
    VENDOR = 'VENDOR',
    USER = 'USER'
}

export enum VendorStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED'
}

export enum CardCategory {
    AAY = 'AAY',
    BPL = 'BPL',
    APL = 'APL',
    PHH = 'PHH'
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    // Specific to Vendor
    licenseNumber?: string;
    shopName?: string;
    status?: VendorStatus;
    // Specific to User
    rationCardNumber?: string;
    address?: string;
    mobileNumber?: string;
    state?: string;
    district?: string;
    cardCategory?: CardCategory;
    familyMembers?: number;
    aadhaar?: string;
    assignedVendor?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },

        // Vendor Fields
        licenseNumber: { type: String },
        shopName: { type: String },
        status: {
            type: String,
            enum: Object.values(VendorStatus),
            default: VendorStatus.PENDING
        },

        // User Fields
        rationCardNumber: { type: String },
        address: { type: String },
        mobileNumber: { type: String },
        state: { type: String },
        district: { type: String },
        cardCategory: { type: String, enum: Object.values(CardCategory) },
        familyMembers: { type: Number, default: 1 },
        aadhaar: { type: String },
        assignedVendor: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
