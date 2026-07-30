import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface CreateFeePaymentBody {
  studentId: string;
  batchId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  transactionId?: string;
  monthFor: string;
  status?: string;
  remarks?: string;
}

export async function createFeePayment(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const body = req.body as CreateFeePaymentBody;
    const {
      studentId,
      batchId,
      amount,
      paymentDate,
      paymentMethod,
      transactionId,
      monthFor,
      status,
      remarks,
    } = body;

    if (!studentId || !batchId || !amount || !paymentMethod || !monthFor) {
      res.status(400).json({
        success: false,
        message: 'studentId, batchId, amount, paymentMethod, and monthFor are required',
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
      return;
    }

    const validPaymentMethods = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD'];
    if (!validPaymentMethods.includes(paymentMethod.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`,
      });
      return;
    }

    const [student, batch] = await Promise.all([
      prisma.user.findFirst({
        where: { id: studentId, instituteId },
      }),
      prisma.batch.findFirst({
        where: { id: batchId, instituteId },
      }),
    ]);

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const feePayment = await prisma.feePayment.create({
      data: {
        studentId,
        batchId,
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod.toUpperCase(),
        transactionId: transactionId || null,
        monthFor,
        status: status || 'COMPLETED',
        remarks: remarks || null,
      },
    });

    res.status(201).json({ success: true, data: feePayment });
  } catch (error) {
    console.error('Create fee payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function listFeePaymentsByBatch(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;
    const batchId = req.params.batchId as string;

    if (!batchId) {
      res.status(400).json({ success: false, message: 'batchId is required' });
      return;
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instituteId },
    });

    if (!batch) {
      res.status(404).json({ success: false, message: 'Batch not found' });
      return;
    }

    const payments = await prisma.feePayment.findMany({
      where: { batchId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('List fee payments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getFeeStats(req: Request, res: Response): Promise<void> {
  try {
    const instituteId = req.user!.instituteId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalCollected, monthCollected, pendingCount] = await Promise.all([
      prisma.feePayment.aggregate({
        where: {
          student: { instituteId },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.feePayment.aggregate({
        where: {
          student: { instituteId },
          status: 'COMPLETED',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      prisma.feePayment.count({
        where: {
          student: { instituteId },
          status: 'PENDING',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCollected: totalCollected._sum.amount || 0,
        monthCollected: monthCollected._sum.amount || 0,
        pendingCount,
      },
    });
  } catch (error) {
    console.error('Get fee stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
