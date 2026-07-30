import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { getAttendance, bulkAttendance } from '../controllers/attendance.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/:batchId', getAttendance);
router.post('/bulk', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), bulkAttendance);

export default router;
