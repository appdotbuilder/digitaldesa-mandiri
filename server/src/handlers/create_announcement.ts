
import { db } from '../db';
import { announcementsTable } from '../db/schema';
import { type CreateAnnouncementInput, type Announcement } from '../schema';

export const createAnnouncement = async (input: CreateAnnouncementInput): Promise<Announcement> => {
  try {
    // Insert announcement record
    const result = await db.insert(announcementsTable)
      .values({
        title: input.title,
        content: input.content,
        category: input.category,
        author_id: input.author_id,
        target_rt: input.target_rt,
        target_rw: input.target_rw,
        is_priority: input.is_priority,
        event_date: input.event_date,
        published_at: new Date() // Auto-publish on creation
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Announcement creation failed:', error);
    throw error;
  }
};
