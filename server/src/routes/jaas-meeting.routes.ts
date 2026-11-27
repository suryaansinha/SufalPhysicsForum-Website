import { Router } from 'express';
import { createJaasToken } from '../controllers/jaas-meeting.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/jaas-token', authenticate, createJaasToken);

export default router;
