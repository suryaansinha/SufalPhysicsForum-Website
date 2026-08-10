import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { Prisma, Role } from '../generated/prisma/client.js';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTempPassword(): string {
  const length = 8 + Math.floor(Math.random() * 3);
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return password;
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;

    const students = await prisma.user.findMany({
      where: { instituteId, role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            batch: {
              select: { id: true, name: true, gradeLevel: true, subject: true, timing: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { name, email, phone, batchId } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email_instituteId: { email, instituteId } },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'A user with this email already exists in your institute' });
      return;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const student = await prisma.user.create({
      data: {
        instituteId,
        name,
        email,
        passwordHash,
        role: Role.STUDENT,
        phone: phone || null,
      },
    });

    if (batchId) {
      const batch = await prisma.batch.findFirst({
        where: { id: batchId, instituteId },
      });

      if (batch) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            batchId: batch.id,
          },
        });
      }
    }

    const created = await prisma.user.findUnique({
      where: { id: student.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            batch: {
              select: { id: true, name: true, gradeLevel: true, subject: true, timing: true },
            },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: { student: created, tempPassword } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A user with this email already exists in your institute' });
      return;
    }
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const id = req.params.id as string;

    const student = await prisma.user.findFirst({
      where: { id, instituteId, role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            batch: {
              select: { id: true, name: true, gradeLevel: true, subject: true, timing: true, feeAmount: true },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const id = req.params.id as string;

    const student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, instituteId: true, role: true },
    });

    if (!student || student.role !== Role.STUDENT) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (student.instituteId !== instituteId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, data: { id }, message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
