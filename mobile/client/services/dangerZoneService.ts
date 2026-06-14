import { API_ROUTES } from '@/config/endpoints';
import { DangerZoneRecord, DangerZoneReportForm } from '@/types/dangerZone';
import axios from 'axios';

const appendImage = (formData: FormData, imageUri?: string | null) => {
  if (!imageUri) return;

  const lowerUri = imageUri.toLowerCase();
  const filenameFromUri = imageUri.split('/').pop();
  const type = lowerUri.endsWith('.png') ? 'image/png' : lowerUri.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const filename =
    filenameFromUri && filenameFromUri.includes('.')
      ? filenameFromUri
      : `danger-zone-evidence-${Date.now()}.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`;

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);
};

export const createDangerZoneReport = async (
  payload: DangerZoneReportForm,
  token: string
): Promise<DangerZoneRecord> => {
  const formData = new FormData();
  formData.append('type', payload.type);
  formData.append('severity', payload.severity);
  formData.append('description', payload.description);
  formData.append('geometryType', payload.geometryType);
  formData.append('center', JSON.stringify(payload.center));
  formData.append('lat', String(payload.center.lat));
  formData.append('lng', String(payload.center.lng));

  if (payload.geometryType === 'circle' && payload.radiusMeters) {
    formData.append('radiusMeters', String(payload.radiusMeters));
  }

  appendImage(formData, payload.imageUri);

  const response = await axios.post<{ data: DangerZoneRecord }>(API_ROUTES.DANGER_ZONES.CREATE_REPORT, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    timeout: 180000,
  });

  return response.data.data;
};

export const fetchPublicDangerZones = async (
  clientId?: string | null,
  options: { bbox?: [number, number, number, number]; limit?: number } = {}
): Promise<DangerZoneRecord[]> => {
  const response = await axios.get<{ zones: DangerZoneRecord[] }>(API_ROUTES.DANGER_ZONES.PUBLIC, {
    params: clientId
      ? {
          clientId,
          ...(options.bbox ? { bbox: options.bbox.join(',') } : {}),
          ...(options.limit ? { limit: options.limit } : {}),
        }
      : undefined,
  });
  return response.data.zones;
};
