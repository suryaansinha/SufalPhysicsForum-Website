export interface Institute {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  aboutDescription?: string | null;
  experienceText?: string | null;
  whatsappNumber?: string | null;
  blogUrl?: string | null;
  youtubeUrl?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  instituteId: string;
  name: string;
  gradeLevel: string | null;
  grade: string | null;
  targetExam: string | null;
  subject: string;
  timing: string | null;
  feeAmount: number | null;
  createdAt: string;
  updatedAt: string;
  enrollments: BatchEnrollment[];
}

export interface BatchEnrollment {
  student: Pick<User, 'id' | 'name' | 'email'>;
}

export interface StudentEnrollment {
  batch: Pick<Batch, 'id' | 'name' | 'gradeLevel' | 'subject' | 'timing'>;
}

export interface Student extends Pick<User, 'id' | 'name' | 'email' | 'phone' | 'isActive' | 'createdAt'> {
  enrollments: StudentEnrollment[];
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  student: Pick<User, 'id' | 'name' | 'email'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  institute: Institute;
}

export interface LiveClass {
  id: string;
  batchId: string;
  title: string;
  agenda: string | null;
  scheduledFor: string;
  durationMins: number;
  jitsiRoomName: string;
  status: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string | null;
  category: string;
  createdAt: string;
}

export interface Homework {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  dueDate: string;
  fileUrl: string | null;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  studentName: string;
  examCleared: string | null;
  content: string;
  rating: number;
  createdAt: string;
}

export interface InstitutePublic {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  aboutDescription: string | null;
  experienceText: string | null;
  whatsappNumber: string | null;
  blogUrl: string | null;
  youtubeUrl: string | null;
  testimonials: Testimonial[];
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD';

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface FeePayment {
  id: string;
  studentId: string;
  batchId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  monthFor: string;
  status: PaymentStatus;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  student: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
}

export interface FeeStats {
  totalCollected: number;
  monthCollected: number;
  pendingCount: number;
}
