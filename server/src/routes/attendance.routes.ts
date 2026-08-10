import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import {
  getAttendanceByBatchAndDate,
  markBulkAttendance,
  getAttendanceRoster,
  markAttendance,
} from '../controllers/attendance.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/:batchId', getAttendanceRoster);
router.post('/bulk', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), markBulkAttendance);
router.post('/:batchId', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), markAttendance);
router.get('/:batchId/:date', getAttendanceByBatchAndDate);

export default router;
