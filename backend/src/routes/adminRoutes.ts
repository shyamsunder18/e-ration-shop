import express from 'express';
import { getVendors, updateVendorStatus, getAdminStats, getComplaints, getUsers, getRationCards, getRationCardById, assignUserToVendor, updateUserStatus, updateUserCategory, updateUserFamilyMembers, deleteUser, deleteVendor, getProducts, updateProduct, getGlobalInventory, updateVendorStock, getDealerDemandPlan, releaseStockToVendor, getCentralStock, issueCollectionCode, resolveFlaggedStock } from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect, adminOnly); // Apply to all routes

router.get('/users', getUsers);
router.get('/ration-cards', getRationCards);
router.get('/ration-cards/:id', getRationCardById);
router.put('/users/:id/assign-dealer', assignUserToVendor);
router.put('/users/:id/update-status', updateUserStatus);
router.put('/users/:id/update-category', updateUserCategory);
router.put('/users/:id/update-family', updateUserFamilyMembers);
router.post('/users/:id/collection-code', issueCollectionCode);
router.delete('/users/:id', deleteUser);
router.get('/vendors', getVendors);
router.put('/vendors/:id/status', updateVendorStatus);
router.delete('/vendors/:id', deleteVendor);
router.get('/stats', getAdminStats);
router.get('/complaints', getComplaints);

router.get('/products', getProducts);
router.put('/products/:id', updateProduct);
router.get('/inventory/global', getGlobalInventory);
router.get('/inventory/demand-plan', getDealerDemandPlan);
router.get('/inventory/central-stock', getCentralStock);
router.post('/inventory/release', releaseStockToVendor);
router.put('/inventory/:id', updateVendorStock);
router.post('/inventory/:id/resolve', resolveFlaggedStock);

export default router;
