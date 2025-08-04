
import { db } from '../db';
import { complaintsTable } from '../db/schema';
import { type UpdateComplaintStatusInput, type Complaint } from '../schema';
import { eq } from 'drizzle-orm';

export const updateComplaintStatus = async (input: UpdateComplaintStatusInput): Promise<Complaint> => {
  try {
    // Update complaint status
    const result = await db.update(complaintsTable)
      .set({
        status: input.status,
        assigned_staff_id: input.assigned_staff_id,
        resolution_notes: input.resolution_notes,
        resolved_at: input.status === 'resolved' ? new Date() : null,
        updated_at: new Date()
      })
      .where(eq(complaintsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Complaint with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Complaint status update failed:', error);
    throw error;
  }
};
