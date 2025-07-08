import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAllPackages,
  getPackagesByService,
  createPackage,
  updatePackage,
  deletePackage
} from '../controllers/serviceController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Package routes - HARUS DI ATAS routes dengan parameter
router.get('/packages', getAllPackages);
router.post('/packages', authenticateToken, requireAdmin, createPackage);
router.put('/packages/:id', authenticateToken, requireAdmin, updatePackage);
router.delete('/packages/:id', authenticateToken, requireAdmin, deletePackage);

// Public routes (untuk booking form)
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/:serviceId/packages', getPackagesByService);

// Admin routes (protected)
router.post('/', authenticateToken, requireAdmin, createService);
router.put('/:id', authenticateToken, requireAdmin, updateService);
router.delete('/:id', authenticateToken, requireAdmin, deleteService);

export default router;