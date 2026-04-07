import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { protect, vendorOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id/status')
    .put(protect, vendorOnly, updateOrderStatus);

export default router;
