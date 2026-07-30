import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function listBatches(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;

    const batches = await prisma.batch.findMany({
      where: { instituteId },
      include: {
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('List batches error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createBatch(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { name, gradeLevel, grade, targetExam, subject, timing, feeAmount } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Batch name is required' });
      return;
    }

    const batch = await prisma.batch.create({
      data: {
        instituteId,
        name,
        gradeLevel: gradeLevel || null,
        grade: grade || null,
        targetExam: targetExam || null,
        subject: subject || 'Physics',
        timing: timing || null,
        feeAmount: feeAmount ? parseFloat(feeAmount) : null,
      },
      include: {
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getBatch(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const id = req.params.id as string;

    const batch = await prisma.batch.findFirst({
      where: { id, instituteId },
      include: {
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
