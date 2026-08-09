import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import {
  listBatches,
  createBatch,
  getBatch,
  deleteBatch,
  getUnenrolledStudents,
  enrollStudents,
} from '../controllers/batch.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.get('/:batchId/unenrolled-students', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), getUnenrolledStudents);
router.post('/:batchId/enroll', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), enrollStudents);

router.get('/', listBatches);
router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createBatch);
router.get('/:id', getBatch);
router.delete('/:id', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), deleteBatch);

export default router;
