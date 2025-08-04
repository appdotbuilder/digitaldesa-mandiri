
import { db } from '../db';
import { citizenDocumentsTable } from '../db/schema';
import { type CitizenDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const getCitizenDocuments = async (citizenId: string): Promise<CitizenDocument[]> => {
  try {
    const results = await db.select()
      .from(citizenDocumentsTable)
      .where(eq(citizenDocumentsTable.citizen_id, citizenId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch citizen documents:', error);
    throw error;
  }
};
