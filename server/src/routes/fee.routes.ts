import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { Role } from '../generated/prisma/client.js';
import {
  createFeePayment,
  listFeePaymentsByBatch,
  getFeeStats,
  getMyFees,
  payFee,
} from '../controllers/fee.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createFeePayment);
router.get('/batch/:batchId', listFeePaymentsByBatch);
router.get('/stats', getFeeStats);
router.get('/my', getMyFees);
router.post('/pay', authorizeRoles(Role.STUDENT), payFee);

export default router;
