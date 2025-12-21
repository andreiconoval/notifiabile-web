import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateFromISO(iso?: string) {
  if (!iso) return '';
  return format(new Date(iso), 'MMM dd, yyyy');
}
export function formatTimeFromISO(iso?: string) {
  if (!iso) return '';
  return format(new Date(iso), 'h:mm a');
}
