
import { db } from '../db';
import { applicationsTable, usersTable } from '../db/schema';
import { type UpdateApplicationStatusInput, type Application } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateApplicationStatus(input: UpdateApplicationStatusInput): Promise<Application> {
  try {
    // Verify application exists
    const existingApplication = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.id))
      .execute();

    if (existingApplication.length === 0) {
      throw new Error('Application not found');
    }

    // Verify reviewer exists
    const reviewer = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.reviewer_id))
      .execute();

    if (reviewer.length === 0) {
      throw new Error('Reviewer not found');
    }

    // Prepare update data based on status
    const now = new Date();
    let updateData: any = {
      status: input.status,
      updated_at: now
    };

    // Add status-specific fields based on workflow stage
    switch (input.status) {
      case 'rt_rw_approved':
      case 'rt_rw_rejected':
        updateData.rt_rw_reviewer_id = input.reviewer_id;
        updateData.rt_rw_review_notes = input.notes || null;
        updateData.rt_rw_reviewed_at = now;
        break;
      
      case 'village_processing':
        updateData.village_staff_id = input.reviewer_id;
        updateData.village_processing_notes = input.notes || null;
        updateData.village_processed_at = now;
        break;
      
      case 'completed':
      case 'rejected':
        updateData.village_head_id = input.reviewer_id;
        updateData.village_head_notes = input.notes || null;
        updateData.village_head_reviewed_at = now;
        break;
    }

    // Update application
    const result = await db.update(applicationsTable)
      .set(updateData)
      .where(eq(applicationsTable.id, input.id))
      .returning()
      .execute();

    // Convert database result to Application type
    const dbApplication = result[0];
    return {
      ...dbApplication,
      form_data: dbApplication.form_data as Record<string, any>,
      submitted_documents: dbApplication.submitted_documents as number[]
    };
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
}
