import express from 'express';
import { getAssignedBeneficiaries, confirmStockUpdate, flagStockUpdate, notifyCitizens, notifyCitizenPersonal } from '../controllers/vendorController';
import { protect, vendorOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect, vendorOnly); // Only approved vendors can access these routes

router.get('/beneficiaries', getAssignedBeneficiaries);
router.post('/inventory/:id/confirm', confirmStockUpdate);
router.post('/inventory/:id/flag', flagStockUpdate);
router.post('/notify-citizens', notifyCitizens);
router.post('/notify-citizen/:userId', notifyCitizenPersonal);

export default router;
