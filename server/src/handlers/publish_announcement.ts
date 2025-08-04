
import { db } from '../db';
import { announcementsTable } from '../db/schema';
import { type Announcement } from '../schema';
import { eq } from 'drizzle-orm';

export const publishAnnouncement = async (announcementId: number): Promise<Announcement> => {
  try {
    // Update the announcement to set published_at to current timestamp
    const result = await db.update(announcementsTable)
      .set({
        published_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(announcementsTable.id, announcementId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Announcement with id ${announcementId} not found`);
    }

    const announcement = result[0];
    
    // Return the published announcement
    return {
      ...announcement,
      // Convert date fields to proper Date objects
      published_at: announcement.published_at ? new Date(announcement.published_at) : null,
      event_date: announcement.event_date ? new Date(announcement.event_date) : null,
      created_at: new Date(announcement.created_at),
      updated_at: new Date(announcement.updated_at)
    };
  } catch (error) {
    console.error('Announcement publishing failed:', error);
    throw error;
  }
};
