import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma/client.js';
import { uploadImageToCloudinary } from '../utils/cloudinary';

const INSTITUTE_LOGO_FOLDER = 'institute';

export async function getInstituteSettings(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        logoUrl: true,
        aboutDescription: true,
        experienceText: true,
        whatsappNumber: true,
        blogUrl: true,
        youtubeUrl: true,
      },
    });

    if (!institute) {
      res.status(404).json({ success: false, message: 'Institute not found' });
      return;
    }

    res.json({ success: true, data: institute });
  } catch (error) {
    console.error('Get institute settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateInstituteSettings(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const {
      name,
      aboutDescription,
      whatsappNumber,
      youtubeUrl,
      phone,
      email,
      experienceText,
      blogUrl,
    } = req.body;
    const file = req.file;

    const data: Prisma.InstituteUpdateInput = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    } else if (name !== undefined) {
      res.status(400).json({ success: false, message: 'Institute name cannot be empty' });
      return;
    }

    if (typeof aboutDescription === 'string') {
      data.aboutDescription = aboutDescription.trim() || null;
    }
    if (typeof whatsappNumber === 'string') {
      data.whatsappNumber = whatsappNumber.trim() || null;
    }
    if (typeof youtubeUrl === 'string') {
      data.youtubeUrl = youtubeUrl.trim() || null;
    }
    if (typeof phone === 'string') {
      data.phone = phone.trim() || null;
    }
    if (typeof email === 'string') {
      data.email = email.trim() || null;
    }
    if (typeof experienceText === 'string') {
      data.experienceText = experienceText.trim() || null;
    }
    if (typeof blogUrl === 'string') {
      data.blogUrl = blogUrl.trim() || null;
    }

    if (file) {
      try {
        const uploaded = await uploadImageToCloudinary(file.buffer, INSTITUTE_LOGO_FOLDER);
        data.logoUrl = uploaded.url;
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Logo upload failed. Please check your Cloudinary configuration.',
        });
        return;
      }
    }

    const institute = await prisma.institute.update({
      where: { id: instituteId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        logoUrl: true,
        aboutDescription: true,
        experienceText: true,
        whatsappNumber: true,
        blogUrl: true,
        youtubeUrl: true,
      },
    });

    res.json({ success: true, data: institute, message: 'Institute settings updated' });
  } catch (error) {
    console.error('Update institute settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
