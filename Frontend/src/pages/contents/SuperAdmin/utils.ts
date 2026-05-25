import { auth } from '@/lib/firebaseConfig';
import type { ClientCoverageBarangay } from './types';

export const getToken = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
};

export const statusColor = (status: string) => {
  if (status === 'active' || status === 'approved' || status === 'healthy') return 'success';
  if (status === 'pending' || status === 'draft') return 'warning';
  if (status === 'inactive' || status === 'rejected' || status === 'degraded') return 'danger';
  return 'default';
};

export const barangayKey = (barangay: ClientCoverageBarangay) =>
  barangay.barangayCode || barangay.value || barangay.barangayLabel;

export const formatDateTime = (value: unknown) => {
  if (!value) return 'Not recorded';

  const timestamp = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : typeof timestamp._seconds === 'number'
        ? new Date(timestamp._seconds * 1000)
        : typeof timestamp.seconds === 'number'
          ? new Date(timestamp.seconds * 1000)
          : typeof value === 'string'
            ? new Date(value)
            : null;

  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Not recorded';
};
