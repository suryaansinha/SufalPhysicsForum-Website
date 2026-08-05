import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadSingleImage } from '../middlewares/upload.middleware';
import {
  createQuestion,
  getQuestion,
  getQuestions,
  addAnswer,
  resolveQuestion,
} from '../controllers/forum.controller';

const router = Router();

router.use(authenticate);

router.post('/questions', uploadSingleImage, createQuestion);
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestion);
router.post('/questions/:id/answers', uploadSingleImage, addAnswer);
router.patch('/questions/:id/resolve', resolveQuestion);

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ success: false, message: `Upload failed: ${error.message}` });
    return;
  }
  if (error instanceof Error) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  res.status(400).json({ success: false, message: 'Upload failed' });
});

export default router;
