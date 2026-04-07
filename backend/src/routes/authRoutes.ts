import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, lookupRationRegistry } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.get('/ration-registry/:rationCardNumber', lookupRationRegistry);

export default router;
