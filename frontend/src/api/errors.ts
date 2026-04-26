import axios from 'axios';

export type ApiError = {
  status: number;
  code?: string;
  title?: string;
  message: string;
  errors?: Record<string, string[]>;
  traceId?: string;
};

type UnknownErrorBody = {
  code?: string;
  title?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
};

const defaultMessageByStatus = (status: number): string => {
  if (status === 400) return 'Invalid request.';
  if (status === 401) return 'You are not authorized. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'This action conflicts with existing data.';
  if (status === 429) return 'Too many requests. Please wait and try again.';
  if (status >= 500) return 'Something went wrong on the server. Please try again.';
  return 'Request failed. Please try again.';
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) {
    return {
      status: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  if (!error.response) {
    return {
      status: 0,
      message: 'Network issue. Please check your connection and try again.',
    };
  }

  const status = error.response.status;
  const payload = (error.response.data ?? {}) as UnknownErrorBody;

  return {
    status,
    code: payload.code,
    title: payload.title,
    message: payload.message ?? payload.error ?? defaultMessageByStatus(status),
    errors: payload.errors,
    traceId: payload.traceId,
  };
};

export const getApiErrorMessage = (error: unknown): string => {
  const normalized = normalizeApiError(error);
  if (normalized.status === 429) {
    return `${normalized.message} Please wait a moment before retrying.`;
  }
  return normalized.message;
};
