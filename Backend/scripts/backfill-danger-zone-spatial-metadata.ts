import { db } from '@/db/firestoreConfig';
import { DangerZoneFirestoreGeometryService } from '@/services/DangerZoneFirestoreGeometryService';
import { DangerZoneSpatialService } from '@/services/DangerZoneSpatialService';
import { DangerZoneCreateInput } from '@/types/dangerZone';
import { FieldValue } from 'firebase-admin/firestore';

const BATCH_SIZE = 400;

const buildInput = (data: FirebaseFirestore.DocumentData): DangerZoneCreateInput => ({
  type: String(data.type || ''),
  severity: data.severity || 'medium',
  description: String(data.description || ''),
  geometryType: data.geometryType,
  center: data.center ?? null,
  radiusMeters: data.radiusMeters ?? null,
  geojson: DangerZoneFirestoreGeometryService.fromFirestoreGeoJson(data.geojson),
  affectedWidthMeters: data.affectedWidthMeters ?? null,
  avoidGeojson: null,
});

const main = async () => {
  const snapshot = await db.collection('dangerZones').get();
  let batch = db.batch();
  let pending = 0;
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const spatial = DangerZoneSpatialService.buildSpatialMetadata(buildInput(data));
    batch.update(doc.ref, {
      bbox: spatial.bbox ?? null,
      centroid: spatial.centroid ?? null,
      confidence: data.confidence ?? (data.source === 'lgu_official' ? 'high' : 'low'),
      verificationNotes: data.verificationNotes ?? null,
      affectedBarangays: Array.isArray(data.affectedBarangays)
        ? data.affectedBarangays
        : data.barangayLabel
        ? [data.barangayLabel]
        : [],
      updatedAt: FieldValue.serverTimestamp(),
    });
    pending += 1;
    updated += 1;

    if (pending >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  console.log(`Backfilled ${updated} danger-zone records.`);
};

main().catch(error => {
  console.error('Danger-zone spatial backfill failed:', error);
  process.exitCode = 1;
});
