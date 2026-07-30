import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cloudinary } from '../utils/cloudinary';

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ url: result.secure_url });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function createHomework(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { batchId, title, description, dueDate } = req.body;
    const file = req.file;

    if (!batchId || !title || !dueDate) {
      res.status(400).json({ success: false, message: 'batchId, title, and dueDate are required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    let fileUrl: string | null = null;

    if (file) {
      const result = await uploadToCloudinary(file.buffer, `institutes/${instituteId}/homework`);
      fileUrl = result.url;
    }

    const homework = await prisma.homework.create({
      data: {
        batchId,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        fileUrl,
      },
    });

    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function listHomework(req: Request, res: Response): Promise<void> {
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

    const homework = await prisma.homework.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: homework });
  } catch (error) {
    console.error('List homework error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
