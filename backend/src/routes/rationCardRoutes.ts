import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getMyRationCard, upsertMyRationCard, verifyFamilyMemberEligibility } from '../controllers/rationCardController';

const router = express.Router();

router.use(protect);

router.get('/me', getMyRationCard);
router.put('/me', upsertMyRationCard);
router.post('/verify-member', verifyFamilyMemberEligibility);

export default router;
