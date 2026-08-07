import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { registerInstitute, login, googleLogin, refresh, me } from '../controllers/auth.controller';

const router = Router();

router.post('/register-institute', registerInstitute);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

export default router;
