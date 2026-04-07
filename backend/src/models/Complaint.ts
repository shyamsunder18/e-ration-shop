import mongoose, { Schema, Document } from 'mongoose';

export enum ComplaintStatus {
    OPEN = 'OPEN',
    RESOLVED = 'RESOLVED'
}

export interface IComplaint extends Document {
    user: mongoose.Types.ObjectId;
    subject: string;
    description: string;
    status: ComplaintStatus;
    adminResponse?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.OPEN },
        adminResponse: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
