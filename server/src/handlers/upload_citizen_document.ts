
import { db } from '../db';
import { citizenDocumentsTable, usersTable } from '../db/schema';
import { type CitizenDocument, type DocumentType } from '../schema';
import { eq } from 'drizzle-orm';

export async function uploadCitizenDocument(
    citizenId: string,
    documentType: DocumentType,
    file: { name: string; url: string; size: number }
): Promise<CitizenDocument> {
    try {
        // Verify citizen exists
        const existingCitizen = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, citizenId))
            .execute();

        if (existingCitizen.length === 0) {
            throw new Error(`Citizen with ID ${citizenId} not found`);
        }

        // Insert document record
        const result = await db.insert(citizenDocumentsTable)
            .values({
                citizen_id: citizenId,
                document_type: documentType,
                file_name: file.name,
                file_url: file.url,
                file_size: file.size
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Document upload failed:', error);
        throw error;
    }
}
