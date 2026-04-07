import express from 'express';
import { createComplaint, getMyComplaints } from '../controllers/complaintController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createComplaint);

router.get('/me', protect, getMyComplaints);

export default router;
