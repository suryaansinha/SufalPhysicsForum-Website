import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { getAttendanceByBatchAndDate, markBulkAttendance } from '../controllers/attendance.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/:batchId/:date', getAttendanceByBatchAndDate);
router.post('/bulk', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), markBulkAttendance);

export default router;
