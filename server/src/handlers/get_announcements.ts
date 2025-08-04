
import { db } from '../db';
import { announcementsTable, usersTable } from '../db/schema';
import { type Announcement } from '../schema';
import { eq, or, isNull, isNotNull, desc, and } from 'drizzle-orm';

export async function getAnnouncements(userId: string, rt?: string, rw?: string): Promise<Announcement[]> {
  try {
    // Get user role to determine access level
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userRole = user[0].role;
    const userRt = user[0].rt;
    const userRw = user[0].rw;

    // For staff roles: see all announcements
    if (userRole !== 'citizen') {
      const results = await db.select()
        .from(announcementsTable)
        .orderBy(
          desc(announcementsTable.is_priority),
          desc(announcementsTable.created_at)
        )
        .execute();

      return results;
    }

    // For citizens: only see published announcements that target them or are general
    // Build target conditions for citizens
    const targetConditions = [
      // General announcements (both target_rt and target_rw are null)
      and(
        isNull(announcementsTable.target_rt),
        isNull(announcementsTable.target_rw)
      )
    ];

    // If user has RT/RW, include announcements targeting their area
    if (userRt && userRw) {
      // Announcements targeting their specific RT/RW
      targetConditions.push(
        and(
          eq(announcementsTable.target_rt, userRt),
          eq(announcementsTable.target_rw, userRw)
        )
      );
    }
    
    // Announcements targeting their RW only (RT is null)
    if (userRw) {
      targetConditions.push(
        and(
          isNull(announcementsTable.target_rt),
          eq(announcementsTable.target_rw, userRw)
        )
      );
    }

    const results = await db.select()
      .from(announcementsTable)
      .where(
        and(
          isNotNull(announcementsTable.published_at), // Must be published
          or(...targetConditions) // Target filtering
        )
      )
      .orderBy(
        desc(announcementsTable.is_priority),
        desc(announcementsTable.created_at)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get announcements:', error);
    throw error;
  }
}
