import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createQuestion,
  getQuestions,
  addAnswer,
  resolveQuestion,
} from '../controllers/forum.controller';

const router = Router();

router.use(authenticate);

router.post('/questions', createQuestion);
router.get('/questions', getQuestions);
router.post('/questions/:id/answers', addAnswer);
router.patch('/questions/:id/resolve', resolveQuestion);

export default router;
