import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { DoubtStatus, Role } from '../generated/prisma/client.js';
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from '../utils/cloudinary';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const IMAGE_UPLOAD_FOLDER = 'forum';

const questionAuthorSelect = { select: { id: true, name: true } } as const;

const questionListInclude = {
  author: questionAuthorSelect,
  images: { select: { id: true, url: true }, orderBy: { createdAt: 'asc' as const } },
  _count: { select: { answers: true } },
};

const questionDetailInclude = {
  ...questionListInclude,
  answers: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: questionAuthorSelect },
  },
};

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit as string, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseRemoveImageIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
      }
    } catch {
      return raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }
  return [];
}

async function findInstituteQuestion(questionId: string, instituteId: string) {
  return prisma.forumQuestion.findFirst({
    where: { id: questionId, batch: { instituteId } },
    include: { images: true },
  });
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const { title, body, batchId } = req.body;
    const file = req.file;

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

    let uploadedImage: { url: string; publicId: string } | null = null;

    if (file) {
      try {
        uploadedImage = await uploadImageToCloudinary(file.buffer, `${IMAGE_UPLOAD_FOLDER}/questions`);
      } catch (uploadError) {
        console.error('Question image upload failed; creating question without image:', uploadError);
      }
    }

    const question = await prisma.forumQuestion.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        batchId,
        authorId,
        images: uploadedImage
          ? {
              create: {
                url: uploadedImage.url,
                publicId: uploadedImage.publicId,
              },
            }
          : undefined,
      },
      include: questionListInclude,
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error('Create forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const questionId = req.params.id as string;

    const question = await prisma.forumQuestion.findFirst({
      where: { id: questionId, batch: { instituteId } },
      include: questionDetailInclude,
    });

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    res.json({ success: true, data: question });
  } catch (error) {
    console.error('Get forum question error:', error);
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
        include: questionListInclude,
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

export async function updateDoubt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const questionId = req.params.id as string;
    const { title, body } = req.body;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const removeImageIds = parseRemoveImageIds(req.body.removeImageIds);

    const hasTitle = typeof title === 'string';
    const hasBody = typeof body === 'string';
    if (!hasTitle && !hasBody && files.length === 0 && removeImageIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one of title, body, images, or removeImageIds is required',
      });
      return;
    }

    const question = await findInstituteQuestion(questionId, instituteId);

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    if (question.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Only the author can edit this question' });
      return;
    }

    if (question.status !== DoubtStatus.PENDING) {
      res.status(409).json({ success: false, message: 'Only PENDING doubts can be edited' });
      return;
    }

    if (hasTitle && !title.trim()) {
      res.status(400).json({ success: false, message: 'title cannot be empty' });
      return;
    }

    if (hasBody && !body.trim()) {
      res.status(400).json({ success: false, message: 'body cannot be empty' });
      return;
    }

    const ownedRemoveIds = question.images
      .filter((image) => removeImageIds.includes(image.id))
      .map((image) => image.id);

    const imagesToDelete = question.images.filter((image) => ownedRemoveIds.includes(image.id));

    const uploadedImages: { url: string; publicId: string }[] = [];
    let uploadFailures = 0;
    for (const file of files) {
      try {
        const uploaded = await uploadImageToCloudinary(file.buffer, `${IMAGE_UPLOAD_FOLDER}/questions`);
        uploadedImages.push(uploaded);
      } catch (uploadError) {
        uploadFailures += 1;
        console.error('Question image upload failed during update:', uploadError);
      }
    }

    if (files.length > 0 && uploadedImages.length === 0) {
      res.status(500).json({ success: false, message: 'Image upload failed' });
      return;
    }

    if (uploadFailures > 0) {
      console.error(`Question update: ${uploadFailures} of ${files.length} image uploads failed`);
    }

    await Promise.all(imagesToDelete.map((image) => deleteImageFromCloudinary(image.publicId)));

    const updated = await prisma.$transaction(async (tx) => {
      if (ownedRemoveIds.length > 0) {
        await tx.forumQuestionImage.deleteMany({
          where: { id: { in: ownedRemoveIds }, questionId },
        });
      }

      if (uploadedImages.length > 0) {
        await tx.forumQuestionImage.createMany({
          data: uploadedImages.map((image) => ({
            questionId,
            url: image.url,
            publicId: image.publicId,
          })),
        });
      }

      return tx.forumQuestion.update({
        where: { id: questionId },
        data: {
          ...(hasTitle ? { title: title.trim() } : {}),
          ...(hasBody ? { body: body.trim() } : {}),
        },
        include: questionListInclude,
      });
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteDoubt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const questionId = req.params.id as string;

    const question = await findInstituteQuestion(questionId, instituteId);

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    if (question.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Only the author can delete this question' });
      return;
    }

    if (question.status !== DoubtStatus.PENDING) {
      res.status(409).json({ success: false, message: 'Only PENDING doubts can be deleted' });
      return;
    }

    await Promise.all(question.images.map((image) => deleteImageFromCloudinary(image.publicId)));

    await prisma.forumQuestion.delete({ where: { id: questionId } });

    res.json({ success: true, data: { id: questionId } });
  } catch (error) {
    console.error('Delete forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function addAnswer(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const instituteId = req.user!.instituteId;
    const role = req.user!.role;
    const questionId = req.params.id as string;
    const { body, imageUrl: bodyImageUrl } = req.body;
    const file = req.file;

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

    let imageUrl: string | null = bodyImageUrl || null;

    if (file) {
      try {
        const uploaded = await uploadImageToCloudinary(file.buffer, `${IMAGE_UPLOAD_FOLDER}/answers`);
        imageUrl = uploaded.url;
      } catch (uploadError) {
        console.error('Answer image upload failed; creating answer without image:', uploadError);
      }
    }

    const isTeacher = role === Role.TEACHER || role === Role.SUPER_ADMIN;

    const answer = await prisma.$transaction(async (tx) => {
      const created = await tx.forumAnswer.create({
        data: {
          body: body.trim(),
          questionId,
          imageUrl,
          authorId,
        },
        include: {
          author: questionAuthorSelect,
        },
      });

      if (isTeacher && question.status === DoubtStatus.PENDING) {
        await tx.forumQuestion.update({
          where: { id: questionId },
          data: { status: DoubtStatus.ANSWERED },
        });
      }

      return created;
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
      include: questionListInclude,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve forum question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
