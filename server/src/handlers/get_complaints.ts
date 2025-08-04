
import { db } from '../db';
import { complaintsTable } from '../db/schema';
import { type Complaint } from '../schema';
import { eq, or, isNull } from 'drizzle-orm';

export async function getComplaints(userId: string, role: string): Promise<Complaint[]> {
  try {
    // Build query based on user role
    if (role === 'citizen') {
      // Citizens only see their own complaints
      const results = await db.select()
        .from(complaintsTable)
        .where(eq(complaintsTable.citizen_id, userId))
        .execute();
      
      return results;
    } else if (role === 'village_staff' || role === 'village_head') {
      // Staff and village head see all complaints
      const results = await db.select()
        .from(complaintsTable)
        .execute();
      
      return results;
    } else if (role === 'rt_rw_head') {
      // RT/RW heads see complaints assigned to them or unassigned complaints
      const results = await db.select()
        .from(complaintsTable)
        .where(
          or(
            eq(complaintsTable.assigned_staff_id, userId),
            isNull(complaintsTable.assigned_staff_id)
          )
        )
        .execute();
      
      return results;
    }

    // Default: return empty array for unknown roles
    return [];
  } catch (error) {
    console.error('Failed to fetch complaints:', error);
    throw error;
  }
}
