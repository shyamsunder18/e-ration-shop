import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './config/db';
import seedAdmin from './seeder';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await seedAdmin();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error: any) {
        console.error(`Failed to start server: ${error?.message || error}`);
        process.exit(1);
    }
};

startServer();
