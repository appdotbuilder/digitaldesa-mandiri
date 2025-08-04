
import { db } from '../db';
import { complaintAttachmentsTable, complaintsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ComplaintAttachment } from '../schema';

export async function uploadComplaintAttachment(
    complaintId: number,
    file: { name: string; url: string; type: string; size: number }
): Promise<ComplaintAttachment> {
    try {
        // Verify that the complaint exists
        const existingComplaint = await db.select()
            .from(complaintsTable)
            .where(eq(complaintsTable.id, complaintId))
            .execute();

        if (existingComplaint.length === 0) {
            throw new Error(`Complaint with id ${complaintId} not found`);
        }

        // Insert the attachment record
        const result = await db.insert(complaintAttachmentsTable)
            .values({
                complaint_id: complaintId,
                file_name: file.name,
                file_url: file.url,
                file_type: file.type,
                file_size: file.size
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Complaint attachment upload failed:', error);
        throw error;
    }
}
