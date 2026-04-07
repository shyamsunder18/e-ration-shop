import express from 'express';
import { getProducts, createProduct } from '../controllers/productController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, adminOnly, createProduct);

export default router;
