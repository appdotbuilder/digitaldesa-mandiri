
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { announcementsTable, usersTable } from '../db/schema';
import { type CreateAnnouncementInput } from '../schema';
import { createAnnouncement } from '../handlers/create_announcement';
import { eq } from 'drizzle-orm';

describe('createAnnouncement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test user before each test
  let testAuthorId: string;

  beforeEach(async () => {
    // Create test author user
    const authorResult = await db.insert(usersTable)
      .values({
        id: 'test-author-id',
        email: 'author@village.com',
        name: 'Test Author',
        role: 'village_staff',
        is_active: true
      })
      .returning()
      .execute();
    
    testAuthorId = authorResult[0].id;
  });

  const testInput: CreateAnnouncementInput = {
    title: 'Community Meeting',
    content: 'Important community meeting this Friday at 7 PM',
    category: 'event',
    author_id: 'test-author-id',
    target_rt: '01',
    target_rw: '02',
    is_priority: true,
    event_date: new Date('2024-12-25T19:00:00Z')
  };

  it('should create an announcement', async () => {
    const result = await createAnnouncement(testInput);

    // Basic field validation
    expect(result.title).toEqual('Community Meeting');
    expect(result.content).toEqual(testInput.content);
    expect(result.category).toEqual('event');
    expect(result.author_id).toEqual(testAuthorId);
    expect(result.target_rt).toEqual('01');
    expect(result.target_rw).toEqual('02');
    expect(result.is_priority).toEqual(true);
    expect(result.event_date).toEqual(testInput.event_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should save announcement to database', async () => {
    const result = await createAnnouncement(testInput);

    // Query database to verify save
    const announcements = await db.select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, result.id))
      .execute();

    expect(announcements).toHaveLength(1);
    expect(announcements[0].title).toEqual('Community Meeting');
    expect(announcements[0].content).toEqual(testInput.content);
    expect(announcements[0].category).toEqual('event');
    expect(announcements[0].author_id).toEqual(testAuthorId);
    expect(announcements[0].is_priority).toEqual(true);
    expect(announcements[0].published_at).toBeInstanceOf(Date);
  });

  it('should create announcement with null target areas', async () => {
    const generalInput: CreateAnnouncementInput = {
      title: 'Village-wide News',
      content: 'This affects everyone in the village',
      category: 'news',
      author_id: testAuthorId,
      target_rt: null,
      target_rw: null,
      is_priority: false,
      event_date: null
    };

    const result = await createAnnouncement(generalInput);

    expect(result.title).toEqual('Village-wide News');
    expect(result.target_rt).toBeNull();
    expect(result.target_rw).toBeNull();
    expect(result.is_priority).toEqual(false);
    expect(result.event_date).toBeNull();
  });

  it('should create emergency announcement', async () => {
    const emergencyInput: CreateAnnouncementInput = {
      title: 'Emergency Alert',
      content: 'Flood warning - please evacuate immediately',
      category: 'emergency',
      author_id: testAuthorId,
      target_rt: null,
      target_rw: null,
      is_priority: true,
      event_date: null
    };

    const result = await createAnnouncement(emergencyInput);

    expect(result.title).toEqual('Emergency Alert');
    expect(result.category).toEqual('emergency');
    expect(result.is_priority).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint violation', async () => {
    const invalidInput: CreateAnnouncementInput = {
      title: 'Test Announcement',
      content: 'Test content',
      category: 'news',
      author_id: 'non-existent-user',
      target_rt: null,
      target_rw: null,
      is_priority: false,
      event_date: null
    };

    await expect(createAnnouncement(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
