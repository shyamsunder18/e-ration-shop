import express from 'express';
import { getInventory, updateStock } from '../controllers/inventoryController';
import { protect, vendorOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, vendorOnly, getInventory);

router.route('/:productId')
    .put(protect, vendorOnly, updateStock);

export default router;
