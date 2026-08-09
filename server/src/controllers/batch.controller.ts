import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/client.js';

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

export async function deleteBatch(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const id = req.params.id as string;

    const batch = await prisma.batch.findFirst({
      where: { id, instituteId },
      select: { id: true },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    await prisma.batch.delete({ where: { id } });

    res.json({ success: true, data: { id }, message: 'Batch deleted' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getUnenrolledStudents(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
      select: { id: true },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const students = await prisma.user.findMany({
      where: {
        instituteId,
        role: Role.STUDENT,
        enrollments: { none: { batchId } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('List unenrolled students error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function enrollStudents(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;
    const { studentIds } = req.body as { studentIds?: unknown };

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({ success: false, message: 'studentIds array is required' });
      return;
    }

    const ids = studentIds.filter((id): id is string => typeof id === 'string');
    if (ids.length === 0) {
      res.status(400).json({ success: false, message: 'studentIds array is required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
      select: { id: true },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const validStudents = await prisma.user.findMany({
      where: { id: { in: ids }, instituteId, role: Role.STUDENT },
      select: { id: true },
    });

    if (validStudents.length === 0) {
      res.status(400).json({ success: false, message: 'No valid students selected' });
      return;
    }

    const [result] = await prisma.$transaction([
      prisma.enrollment.createMany({
        data: validStudents.map((student) => ({ studentId: student.id, batchId })),
        skipDuplicates: true,
      }),
    ]);

    res.json({ success: true, data: { created: result.count } });
  } catch (error) {
    console.error('Enroll students error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
