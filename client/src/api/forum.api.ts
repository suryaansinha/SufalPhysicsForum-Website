import api from '../lib/api';

export type DoubtStatus = 'PENDING' | 'ANSWERED';

export interface ForumAuthor {
  id: string;
  name: string;
}

export interface ForumQuestionImage {
  id: string;
  url: string;
}

export interface ForumAnswer {
  id: string;
  body: string;
  imageUrl: string | null;
  questionId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
}

export interface ForumQuestion {
  id: string;
  title: string;
  body: string;
  status: DoubtStatus;
  isResolved: boolean;
  authorId: string;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  images: ForumQuestionImage[];
  _count: { answers: number };
  answers?: ForumAnswer[];
}

export interface ForumPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ForumQuestionList {
  questions: ForumQuestion[];
  pagination: ForumPagination;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function fetchQuestions(
  batchId: string,
  page = 1,
  limit = 10
): Promise<ForumQuestionList> {
  const { data } = await api.get<ApiEnvelope<ForumQuestionList>>('/forum/questions', {
    params: { batchId, page, limit },
  });
  return data.data;
}

export async function fetchQuestion(questionId: string): Promise<ForumQuestion> {
  const { data } = await api.get<ApiEnvelope<ForumQuestion>>(`/forum/questions/${questionId}`);
  return data.data;
}

export async function createQuestion(formData: FormData): Promise<ForumQuestion> {
  const { data } = await api.post<ApiEnvelope<ForumQuestion>>('/forum/questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function updateQuestion(questionId: string, formData: FormData): Promise<ForumQuestion> {
  const { data } = await api.put<ApiEnvelope<ForumQuestion>>(`/forum/questions/${questionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteQuestion(questionId: string): Promise<{ id: string }> {
  const { data } = await api.delete<ApiEnvelope<{ id: string }>>(`/forum/questions/${questionId}`);
  return data.data;
}

export async function addAnswer(questionId: string, formData: FormData): Promise<ForumAnswer> {
  const { data } = await api.post<ApiEnvelope<ForumAnswer>>(
    `/forum/questions/${questionId}/answers`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data.data;
}

export async function resolveQuestion(questionId: string): Promise<ForumQuestion> {
  const { data } = await api.patch<ApiEnvelope<ForumQuestion>>(`/forum/questions/${questionId}/resolve`);
  return data.data;
}
