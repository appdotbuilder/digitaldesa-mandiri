
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, announcementsTable } from '../db/schema';
import { publishAnnouncement } from '../handlers/publish_announcement';
import { eq } from 'drizzle-orm';

describe('publishAnnouncement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should publish an announcement', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'village_staff'
      })
      .returning()
      .execute();

    // Create an unpublished announcement
    const announcementResult = await db.insert(announcementsTable)
      .values({
        title: 'Test Announcement',
        content: 'This is a test announcement',
        category: 'news',
        author_id: userResult[0].id,
        target_rt: null,
        target_rw: null,
        is_priority: false,
        published_at: null,
        event_date: null
      })
      .returning()
      .execute();

    const announcementId = announcementResult[0].id;

    // Publish the announcement
    const result = await publishAnnouncement(announcementId);

    // Verify the result
    expect(result.id).toEqual(announcementId);
    expect(result.title).toEqual('Test Announcement');
    expect(result.content).toEqual('This is a test announcement');
    expect(result.category).toEqual('news');
    expect(result.author_id).toEqual(userResult[0].id);
    expect(result.is_priority).toEqual(false);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save published status to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'village_head'
      })
      .returning()
      .execute();

    // Create an unpublished announcement
    const announcementResult = await db.insert(announcementsTable)
      .values({
        title: 'Another Test Announcement',
        content: 'This is another test announcement',
        category: 'event',
        author_id: userResult[0].id,
        target_rt: 'RT01',
        target_rw: 'RW02',
        is_priority: true,
        published_at: null,
        event_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const announcementId = announcementResult[0].id;

    // Publish the announcement
    await publishAnnouncement(announcementId);

    // Query the database to verify the announcement was published
    const announcements = await db.select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, announcementId))
      .execute();

    expect(announcements).toHaveLength(1);
    const announcement = announcements[0];
    expect(announcement.published_at).toBeInstanceOf(Date);
    expect(announcement.updated_at).toBeInstanceOf(Date);
    expect(announcement.title).toEqual('Another Test Announcement');
    expect(announcement.target_rt).toEqual('RT01');
    expect(announcement.target_rw).toEqual('RW02');
    expect(announcement.is_priority).toEqual(true);
  });

  it('should throw error for non-existent announcement', async () => {
    const nonExistentId = 99999;

    expect(publishAnnouncement(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should update already published announcement', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id-3',
        email: 'test3@example.com',
        name: 'Test User 3',
        role: 'village_staff'
      })
      .returning()
      .execute();

    // Create an already published announcement
    const originalPublishedAt = new Date('2024-01-01T10:00:00Z');
    const announcementResult = await db.insert(announcementsTable)
      .values({
        title: 'Published Announcement',
        content: 'This announcement was already published',
        category: 'general',
        author_id: userResult[0].id,
        target_rt: null,
        target_rw: null,
        is_priority: false,
        published_at: originalPublishedAt,
        event_date: null
      })
      .returning()
      .execute();

    const announcementId = announcementResult[0].id;

    // Re-publish the announcement
    const result = await publishAnnouncement(announcementId);

    // Verify the published_at was updated to a new timestamp
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at?.getTime()).toBeGreaterThan(originalPublishedAt.getTime());
    expect(result.title).toEqual('Published Announcement');
  });
});
