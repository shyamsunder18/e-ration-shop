import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';
import seedAdmin from './seeder';

let isConnected = false;

const handler = async (req: any, res: any) => {
  try {
    if (!isConnected) {
      await connectDB();
      //await seedAdmin();
      isConnected = true;
      console.log("✅ DB Connected & Admin Seeded");
    }

    return app(req, res); // pass request to express app
  } catch (error: any) {
    console.error("❌ Error:", error?.message || error);
    res.status(500).send("Server Error");
  }
};

export default handler;