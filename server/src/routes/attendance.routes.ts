import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import {
  getAttendanceByBatchAndDate,
  getMyAttendanceRecords,
  markBulkAttendance,
} from '../controllers/attendance.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/my-records', authorizeRoles(Role.STUDENT), getMyAttendanceRecords);
router.post('/bulk', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), markBulkAttendance);
router.get('/:batchId/:date', getAttendanceByBatchAndDate);

export default router;
