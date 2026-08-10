import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AttendanceStatus } from '../generated/prisma/client.js';

export async function getAttendanceByBatchAndDate(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;
    const dateStr = req.params.date as string;

    if (!dateStr) {
      res.status(400).json({ success: false, message: 'Date path parameter is required (YYYY-MM-DD)' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const date = new Date(dateStr + 'T00:00:00.000Z');

    if (isNaN(date.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        instituteId,
        batchId,
        date,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function markBulkAttendance(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const { batchId, date: dateStr, records } = req.body;

    if (!batchId || !dateStr || !records || !Array.isArray(records)) {
      res.status(400).json({
        success: false,
        message: 'batchId, date, and records (array) are required',
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

    const date = new Date(dateStr + 'T00:00:00.000Z');

    if (isNaN(date.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const validStatuses = Object.values(AttendanceStatus);

    const data = records.map((record) => {
      const status = (record.status as string).toUpperCase();
      if (!validStatuses.includes(status as AttendanceStatus)) {
        throw new Error(`Invalid status: ${record.status}. Must be one of ${validStatuses.join(', ')}`);
      }
      return {
        instituteId,
        batchId,
        studentId: record.studentId,
        date,
        status: status as AttendanceStatus,
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      return Promise.all(
        data.map((d) =>
          tx.attendance.upsert({
            where: {
              batchId_studentId_date: {
                batchId: d.batchId,
                studentId: d.studentId,
                date: d.date,
              },
            },
            update: { status: d.status },
            create: d,
          })
        )
      );
    });

    res.json({
      success: true,
      data: { count: result.length },
      message: `Attendance saved for ${result.length} students`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid status:')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Bulk attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getAttendanceRoster(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;
    const dateStr = req.query.date as string | undefined;

    if (!dateStr) {
      res.status(400).json({ success: false, message: 'date query parameter is required (YYYY-MM-DD)' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
      include: {
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const attendance = await prisma.attendance.findMany({
      where: { batchId, date },
      select: { studentId: true, status: true },
    });

    const statusByStudent = new Map(attendance.map((a) => [a.studentId, a.status]));

    const roster = batch.enrollments.map((enrollment) => ({
      studentId: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      status: statusByStudent.get(enrollment.student.id) ?? AttendanceStatus.PRESENT,
    }));

    res.json({ success: true, data: roster });
  } catch (error) {
    console.error('Get attendance roster error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function markAttendance(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;
    const { date: dateStr, records } = req.body as {
      date?: string;
      records?: { studentId: string; status: string }[];
    };

    if (!dateStr || !records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'date and records (array) are required' });
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

    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const enrolled = await prisma.enrollment.findMany({
      where: { batchId },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));

    const validStatuses = Object.values(AttendanceStatus);
    const data: {
      instituteId: string;
      batchId: string;
      studentId: string;
      date: Date;
      status: AttendanceStatus;
    }[] = [];

    for (const record of records) {
      const status = record.status.toUpperCase();
      if (!validStatuses.includes(status as AttendanceStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid status: ${record.status}. Must be one of ${validStatuses.join(', ')}`,
        });
        return;
      }
      if (!enrolledIds.has(record.studentId)) continue;
      data.push({
        instituteId,
        batchId,
        studentId: record.studentId,
        date,
        status: status as AttendanceStatus,
      });
    }

    if (data.length === 0) {
      res.status(400).json({ success: false, message: 'No valid student records to save' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      return Promise.all(
        data.map((d) =>
          tx.attendance.upsert({
            where: {
              batchId_studentId_date: {
                batchId: d.batchId,
                studentId: d.studentId,
                date: d.date,
              },
            },
            update: { status: d.status },
            create: d,
          })
        )
      );
    });

    res.json({
      success: true,
      data: { count: result.length },
      message: `Attendance saved for ${result.length} students`,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
