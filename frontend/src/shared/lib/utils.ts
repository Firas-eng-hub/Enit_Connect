import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

type FileValidationOptions = {
  maxSizeMB: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  label?: string;
};

// Validate files before upload to improve UX
export function validateFile(file: File, options: FileValidationOptions): string | null {
  const {
    maxSizeMB,
    allowedMimeTypes = [],
    allowedExtensions = [],
    label = 'file',
  } = options;

  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return `${label} is too large. Max size is ${maxSizeMB}MB.`;
  }

  if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && allowedExtensions.includes(ext)) {
      return null;
    }
    const allowedLabel = allowedExtensions.length ? allowedExtensions.join(', ') : 'allowed types';
    return `Unsupported ${label} type. Allowed: ${allowedLabel}.`;
  }

  return null;
}

// Map API errors to friendly messages
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const message = (err.response?.data as { message?: string } | undefined)?.message;

    if (status === 413) return 'File too large. Please upload a smaller file.';
    if (status === 415) return 'Unsupported file type. Please upload a valid file.';
    if (status === 401 || status === 403) return 'Your session expired. Please sign in again.';
    if (status && status >= 500) return 'Server error. Please try again shortly.';

    return message || fallback;
  }

  return fallback;
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
