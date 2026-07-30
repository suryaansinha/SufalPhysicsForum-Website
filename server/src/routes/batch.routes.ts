import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { listBatches, createBatch, getBatch } from '../controllers/batch.controller';
import { Role } from '../generated/prisma';

const router = Router();

router.use(authenticate);

router.get('/', listBatches);
router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createBatch);
router.get('/:id', getBatch);

export default router;
