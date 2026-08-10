import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { listStudents, createStudent, getStudent, deleteStudent } from '../controllers/student.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/', listStudents);
router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createStudent);
router.get('/:id', getStudent);
router.delete('/:id', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), deleteStudent);

export default router;
