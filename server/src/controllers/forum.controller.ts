import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/client.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit as string, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const { title, body, batchId, imageUrl } = req.body;

    if (!title?.trim() || !body?.trim() || !batchId) {
      res.status(400).json({ success: false, message: 'title, body, and batchId are required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const question = await prisma.forumQuestion.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        batchId,
        imageUrl: imageUrl || null,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { answers: true } },
      },
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error('Create forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getQuestions(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.query.batchId as string | undefined;
    const { page, limit, skip } = getPagination(req.query);

    if (!batchId) {
      res.status(400).json({ success: false, message: 'batchId query parameter is required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const where = { batchId };

    const [questions, total] = await Promise.all([
      prisma.forumQuestion.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.forumQuestion.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get forum questions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function addAnswer(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const questionId = req.params.id as string;
    const { body, imageUrl } = req.body;

    if (!body?.trim()) {
      res.status(400).json({ success: false, message: 'body is required' });
      return;
    }

    const question = await prisma.forumQuestion.findFirst({
      where: { id: questionId, batch: { instituteId } },
    });

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    const answer = await prisma.forumAnswer.create({
      data: {
        body: body.trim(),
        questionId,
        imageUrl: imageUrl || null,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: answer });
  } catch (error) {
    console.error('Add forum answer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function resolveQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const instituteId = req.user!.instituteId;
    const questionId = req.params.id as string;

    const question = await prisma.forumQuestion.findFirst({
      where: { id: questionId, batch: { instituteId } },
    });

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    const isTeacher = role === Role.TEACHER || role === Role.SUPER_ADMIN;
    if (!isTeacher && question.authorId !== userId) {
      res
        .status(403)
        .json({ success: false, message: 'Only the author or a teacher can resolve this question' });
      return;
    }

    const updated = await prisma.forumQuestion.update({
      where: { id: questionId },
      data: { isResolved: true },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { answers: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
