
import { db } from '../db';
import { complaintsTable } from '../db/schema';
import { type CreateComplaintInput, type Complaint } from '../schema';

export const createComplaint = async (input: CreateComplaintInput): Promise<Complaint> => {
  try {
    // Insert complaint record
    const result = await db.insert(complaintsTable)
      .values({
        citizen_id: input.citizen_id,
        title: input.title,
        description: input.description,
        location: input.location,
        is_anonymous: input.is_anonymous
      })
      .returning()
      .execute();

    const complaint = result[0];
    return complaint;
  } catch (error) {
    console.error('Complaint creation failed:', error);
    throw error;
  }
};
