import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cloudinary } from '../utils/cloudinary';

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<{ url: string; type: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ url: result.secure_url, type: result.resource_type });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadMaterial(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { batchId, title, description, category, youtubeUrl } = req.body;
    const file = req.file;

    if (!batchId || !title) {
      res.status(400).json({ success: false, message: 'batchId and title are required' });
      return;
    }

    const isYoutubeVideo = category === 'YOUTUBE_VIDEO' && youtubeUrl;

    if (!isYoutubeVideo && !file) {
      res.status(400).json({ success: false, message: 'Either a file or a YouTube URL is required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    let fileUrl = '';
    let fileType: string | null = null;

    if (isYoutubeVideo) {
      fileUrl = youtubeUrl;
      fileType = 'video/youtube';
    } else if (file) {
      const result = await uploadToCloudinary(file.buffer, `institutes/${instituteId}/materials`);
      fileUrl = result.url;
      fileType = file.mimetype;
    }

    const material = await prisma.studyMaterial.create({
      data: {
        batchId,
        title,
        description: description || null,
        fileUrl: fileUrl || '',
        fileType,
        category: category || 'NOTES',
      },
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function listMaterials(req: Request, res: Response): Promise<void> {
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

    const materials = await prisma.studyMaterial.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('List materials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
