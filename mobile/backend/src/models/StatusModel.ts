import db from '@/db/firebaseConfig';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import { StatusData } from '@/types/types';

export class StatusModel {
  private static pathRef(userId: string) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(`Invalid userId provided: ${userId}`);
    }

    return db.collection('status').doc(userId.trim()).collection('statuses');
  }

  static async createOrUpdateStatus(
    userId: string,
    statusData: Omit<
      StatusData,
      'parentId' | 'versionId' | 'statusType' | 'createdAt' | 'expiresAt' | 'retentionUntil'
    > & { expirationDuration: 12 | 24 }
  ): Promise<
    StatusData | { updated: boolean; reason?: string } | StatusData | { parentId: string; versionId: string }
  > {
    try {
      // Validate userId parameter
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error(`Invalid userId provided: ${userId}`);
      }

      // Check if user already has an active status
      const existingStatusQuery = await this.pathRef(userId).where('statusType', '==', 'current').limit(1).get();

      if (!existingStatusQuery.empty) {
        // Update existing status instead of creating new one
        const existingDoc = existingStatusQuery.docs[0];
        const existingData = existingDoc.data();
        return await StatusModel.conditionalUpdateStatus(userId, existingData.parentId, statusData);
      }

      // Generate IDs for new status
      const parentId = `status-${Date.now()}`;
      const versionId = `${parentId}-v1`;

      // Set user-chosen expiration (12 or 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + statusData.expirationDuration);

      // Set history retention (30 days from creation)
      const retentionUntil = new Date();
      retentionUntil.setDate(retentionUntil.getDate() + 30);

      // Create document reference
      const statusRef = db.collection('status').doc(userId).collection('statuses').doc(versionId);

      // Create the status document
      await statusRef.set({
        parentId: parentId,
        versionId: versionId,
        statusType: 'current',
        ...statusData,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        retentionUntil: admin.firestore.Timestamp.fromDate(retentionUntil),
        createdAt: FieldValue.serverTimestamp(),
      });

      return { parentId, versionId };
    } catch (error) {
      console.error('❌ Error creating status:', error);
      throw new Error('Failed to create status');
    }
  }

  static async conditionalUpdateStatus(
    userId: string,
    parentId: string,
    newData: Partial<StatusData>
  ): Promise<{ updated: boolean; reason?: string } | StatusData | { parentId: string; versionId: string }> {
    try {
      // Get current status
      const currentQuery = await this.pathRef(userId)
        .where('parentId', '==', parentId)
        .where('statusType', '==', 'current')
        .limit(1)
        .get();

      if (currentQuery.empty) {
        throw new Error('Current status not found');
      }

      const currentData = currentQuery.docs[0].data();

      // Define system-managed fields that should NOT be compared
      const systemFields = [
        'parentId',
        'versionId',
        'statusType',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'expiresAt',
        'retentionUntil',
        'statusData',
      ];

      // Filter out system fields from newData for comparison
      const filteredNewData: any = {};
      Object.keys(newData).forEach(key => {
        if (!systemFields.includes(key)) {
          filteredNewData[key] = newData[key as keyof StatusData];
        }
      });

      // Compare only user-editable fields
      const currentFieldsToCompare = pick(currentData, Object.keys(filteredNewData));

      const isSame = isEqual(currentFieldsToCompare, filteredNewData);

      if (isSame) {
        console.log('⏸️ No changes detected, skipping update');
        return { updated: false, reason: 'No changes detected' };
      }

      // Proceed with update if changes detected
      const result = await this.updateStatus(userId, parentId, newData);
      return { updated: true, ...result };
    } catch (error) {
      console.error('❌ Error in conditional update:', error);
      throw new Error('Failed to conditionally update status');
    }
  }

  private static async updateStatus(
    userId: string,
    parentId: string,
    updatedData: Partial<StatusData>
  ): Promise<StatusData | { parentId: string; versionId: string }> {
    try {
      // Validate userId parameter
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error(`Invalid userId provided: ${userId}`);
      }

      const batch = db.batch();

      const currentQuery = await this.pathRef(userId)
        .where('parentId', '==', parentId)
        .where('statusType', '==', 'current')
        .limit(1)
        .get();

      if (currentQuery.empty) {
        throw new Error('Current status not found');
      }

      const currentDoc = currentQuery.docs[0];
      const currentData = currentDoc.data();

      const allVersionsQuery = await this.pathRef(userId).where('parentId', '==', parentId).get();

      const nextVersionNumber = allVersionsQuery.size + 1;
      const newVersionId = `${parentId}-v${nextVersionNumber}`;

      batch.update(currentDoc.ref, {
        statusType: 'history',
      });

      const newVersionRef = this.pathRef(userId).doc(newVersionId);

      batch.set(newVersionRef, {
        ...currentData, // Keep all existing data
        ...updatedData, // Apply updates
        parentId: parentId, // Maintain lineage
        versionId: newVersionId,
        statusType: 'current',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        // Update expiration based on new user choice, keep original retention
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + (updatedData.expirationDuration || currentData.expirationDuration) * 60 * 60 * 1000)
        ),
        retentionUntil: currentData.retentionUntil,
      });

      await batch.commit();

      return { parentId, versionId: newVersionId };
    } catch (error) {
      console.error('❌ Error updating status:', error);
      throw new Error('Failed to update status');
    }
  }

  static async getActiveStatus(uid: string): Promise<StatusData | null> {
    try {
      const snapshot = await this.pathRef(uid).where('statusType', '==', 'current').limit(1).get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as StatusData;
    } catch (error) {
      console.error('Error fetching status:', error);
      throw new Error('Failed to fetch status');
    }
  }
}
