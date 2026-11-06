import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const publicInstituteSelect = {
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
  testimonials: {
    select: {
      id: true,
      studentName: true,
      examCleared: true,
      content: true,
      rating: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

router.get('/institute/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    let institute = await prisma.institute.findUnique({
      where: { slug },
      select: publicInstituteSelect,
    });

    // The public site is single-institute, while some deployed databases may
    // have been initialized with a different legacy slug. Resolve that one
    // institute safely; deployments with multiple institutes still require
    // an exact slug match.
    if (!institute && (await prisma.institute.count()) === 1) {
      institute = await prisma.institute.findFirst({ select: publicInstituteSelect });
    }

    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    res.json({ success: true, data: institute });
  } catch (error) {
    console.error('Error fetching public institute data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
