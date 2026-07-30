import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

export async function createLiveClass(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { batchId, title, agenda, scheduledFor, durationMins } = req.body;

    if (!batchId || !title || !scheduledFor) {
      res.status(400).json({
        success: false,
        message: 'batchId, title, and scheduledFor are required',
      });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const jitsiRoomName = crypto.randomBytes(16).toString('hex');

    const liveClass = await prisma.liveClass.create({
      data: {
        batchId,
        title,
        agenda: agenda || null,
        scheduledFor: new Date(scheduledFor),
        durationMins: durationMins ? parseInt(durationMins) : 60,
        jitsiRoomName,
      },
    });

    res.status(201).json({ success: true, data: liveClass });
  } catch (error) {
    console.error('Create live class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function listLiveClasses(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const classes = await prisma.liveClass.findMany({
      where: { batchId },
      orderBy: { scheduledFor: 'desc' },
    });

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('List live classes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getLiveClass(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const id = req.params.id as string;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: { batch: { select: { id: true, instituteId: true, name: true } } },
    });

    if (!liveClass || liveClass.batch.instituteId !== instituteId) {
      res.status(404).json({ success: false, message: 'Live class not found' });
      return;
    }

    res.json({ success: true, data: liveClass });
  } catch (error) {
    console.error('Get live class error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
