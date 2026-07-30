import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { listStudents, createStudent, getStudent } from '../controllers/student.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/', listStudents);
router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createStudent);
router.get('/:id', getStudent);

export default router;
