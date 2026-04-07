import express from 'express';
import { createDistributionRecord, getDistributionRecords } from '../controllers/distributionController';
import { protect, vendorOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getDistributionRecords);
router.post('/collect', protect, vendorOnly, createDistributionRecord);

export default router;
