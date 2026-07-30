import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/client.js';
import {
  createFeePayment,
  listFeePaymentsByBatch,
  getFeeStats,
} from '../controllers/fee.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createFeePayment);
router.get('/batch/:batchId', listFeePaymentsByBatch);
router.get('/stats', getFeeStats);

export default router;
