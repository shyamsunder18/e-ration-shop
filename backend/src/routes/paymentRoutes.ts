import express from 'express';
import { simulatePayment } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/simulate', protect, simulatePayment);

export default router;
