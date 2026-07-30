import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { uploadMaterial, listMaterials } from '../controllers/material.controller';
import { Role } from '../generated/prisma/client.js';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles(Role.TEACHER, Role.SUPER_ADMIN), upload.single('file'), uploadMaterial);
router.get('/batch/:batchId', listMaterials);

export default router;
