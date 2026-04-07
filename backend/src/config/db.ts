import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RationCard from '../models/RationCard';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Legacy schema created a unique index on rationCardNumber.
        // Shared household cards require duplicate ration card numbers across related users.
        try {
            await RationCard.collection.dropIndex('rationCardNumber_1');
            console.log('Dropped legacy unique index on RationCard.rationCardNumber');
        } catch (error: any) {
            if (!error?.message?.includes('index not found')) {
                console.error(`RationCard index normalization warning: ${error.message}`);
            }
        }

        await RationCard.syncIndexes();
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
