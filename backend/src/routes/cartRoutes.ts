import express from 'express';
import { getCart, addToCart } from '../controllers/cartController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getCart) // Check role? protect is enough, but logic inside controller checks user ownership.
    .post(protect, addToCart);

export default router;
