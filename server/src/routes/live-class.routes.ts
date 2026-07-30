import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { createLiveClass, listLiveClasses, getLiveClass } from '../controllers/live-class.controller';
import { Role } from '../generated/prisma';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), createLiveClass);
router.get('/batch/:batchId', listLiveClasses);
router.get('/:id', getLiveClass);

export default router;
