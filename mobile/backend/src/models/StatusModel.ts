import db from "@/db/firebaseConfig";
import { FieldValue } from "firebase-admin/firestore";
import isEqual from "lodash/isEqual";
import { StatusData } from "@/types/types";
import * as admin from "firebase-admin";

export class StatusModel {

    private static pathRef(userId: string) {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error(`Invalid userId provided: ${userId}`);
        }
        
        return db
        .collection("status")
        .doc(userId.trim())
        .collection("statuses")
    }

    static async createOrUpdateStatus(
        userId: string,
        statusData: Omit<
            StatusData,
            | "parentId"
            | "versionId"
            | "statusType"
            | "createdAt"
            | "expiresAt"
            | "retentionUntil"
        > & { expirationDuration: 12 | 24 }
    ): Promise<StatusData | { parentId: string; versionId: string }> {
        try {
            // Validate userId parameter
            if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                throw new Error(`Invalid userId provided: ${userId}`);
            }

            // Check if user already has an active status
            const existingStatusQuery = await this.pathRef(userId)
                .where("statusType", "==", "current")
                .limit(1)
                .get();

            if (!existingStatusQuery.empty) {
            // Update existing status instead of creating new one
            const existingDoc = existingStatusQuery.docs[0];
            const existingData = existingDoc.data();
            return await StatusModel.updateStatus(userId, existingData.parentId, statusData);
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
            const statusRef = db
            .collection("status")
            .doc(userId)
            .collection("statuses")
            .doc(versionId);

            // Create the status document
            await statusRef.set({
            parentId: parentId,
            versionId: versionId,
            statusType: "current",
            ...statusData,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            retentionUntil: admin.firestore.Timestamp.fromDate(retentionUntil),
            createdAt: FieldValue.serverTimestamp(),
            });

            console.log(`✅ Status created with ID: ${parentId}`);
            return { parentId, versionId };
        } catch (error) {
            console.error("❌ Error creating status:", error);
            throw new Error("Failed to create status");
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
                .where("parentId", "==", parentId)
                .where("statusType", "==", "current")
                .limit(1)
                .get();

            if (currentQuery.empty) {
                throw new Error("Current status not found");
            }

            const currentDoc = currentQuery.docs[0];
            const currentData = currentDoc.data();

            const allVersionsQuery = await this.pathRef(userId)
                .where("parentId", "==", parentId)
                .get();

            const nextVersionNumber = allVersionsQuery.size + 1;
            const newVersionId = `${parentId}-v${nextVersionNumber}`;

            batch.update(currentDoc.ref, {
                statusType: "history",
            });

            const newVersionRef = await this.pathRef(userId)
                .doc(newVersionId);

            batch.set(newVersionRef, {
                ...currentData, // Keep all existing data
                ...updatedData, // Apply updates
                parentId: parentId, // Maintain lineage
                versionId: newVersionId,
                statusType: "current",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                // Update expiration based on new user choice, keep original retention
                expiresAt: admin.firestore.Timestamp.fromDate(
                    new Date(
                    Date.now() +
                        (updatedData.expirationDuration || currentData.expirationDuration) *
                        60 *
                        60 *
                        1000
                    )
                ),
                retentionUntil: currentData.retentionUntil,
            });

            await batch.commit();

            console.log(`✅ Status updated to version ${nextVersionNumber}`);
            return { parentId, versionId: newVersionId };
        } catch (error) {
            console.error("❌ Error updating status:", error);
            throw new Error("Failed to update status");
        }
    }


    static async getCurrentStatus(uid: string, parentId: string): Promise<StatusData | null> {
        try {
            const snapshot = await this.pathRef(uid)
                .where("parentId", "==", parentId)
                .where("statusType", "==", "current")
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            return snapshot.empty ? null : snapshot.docs[0].data() as StatusData;
        } catch (error) {
            console.error('Error fetching status:', error);
            throw new Error('Failed to fetch status');
        }
    }
} 