
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, announcementsTable } from '../db/schema';
import { type CreateUserInput, type CreateAnnouncementInput } from '../schema';
import { getAnnouncements } from '../handlers/get_announcements';

// Test users
const citizenUser: CreateUserInput = {
  email: 'citizen@test.com',
  name: 'Test Citizen',
  phone: null,
  role: 'citizen',
  rt: '01',
  rw: '02',
  address: 'Test Address',
  nik: '1234567890123456'
};

const villageStaffUser: CreateUserInput = {
  email: 'staff@test.com',
  name: 'Village Staff',
  phone: null,
  role: 'village_staff',
  rt: null,
  rw: null,
  address: null,
  nik: null
};

// Test announcements
const generalAnnouncement: CreateAnnouncementInput = {
  title: 'General Announcement',
  content: 'This is for everyone',
  category: 'general',
  author_id: '', // Will be set in tests
  target_rt: null,
  target_rw: null,
  is_priority: false,
  event_date: null
};

const specificRtRwAnnouncement: CreateAnnouncementInput = {
  title: 'RT/RW Specific',
  content: 'For RT 01 RW 02',
  category: 'news',
  author_id: '', // Will be set in tests
  target_rt: '01',
  target_rw: '02',
  is_priority: true,
  event_date: null
};

const differentRtRwAnnouncement: CreateAnnouncementInput = {
  title: 'Different RT/RW',
  content: 'For RT 03 RW 04',
  category: 'news',
  author_id: '', // Will be set in tests
  target_rt: '03',
  target_rw: '04',
  is_priority: false,
  event_date: null
};

const rwOnlyAnnouncement: CreateAnnouncementInput = {
  title: 'RW Only',
  content: 'For RW 02 only',
  category: 'event',
  author_id: '', // Will be set in tests
  target_rt: null,
  target_rw: '02',
  is_priority: false,
  event_date: new Date()
};

describe('getAnnouncements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user not found', async () => {
    await expect(getAnnouncements('nonexistent-user')).rejects.toThrow(/user not found/i);
  });

  it('should return general announcements for citizens', async () => {
    // Create test user
    const citizenResult = await db.insert(usersTable)
      .values({
        id: 'citizen-1',
        ...citizenUser
      })
      .returning()
      .execute();

    const citizenId = citizenResult[0].id;

    // Create staff user for authoring
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'staff-1',
        ...villageStaffUser
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create published general announcement
    await db.insert(announcementsTable)
      .values({
        ...generalAnnouncement,
        author_id: staffId,
        published_at: new Date()
      })
      .execute();

    // Create unpublished announcement (should not be returned)
    await db.insert(announcementsTable)
      .values({
        title: 'Unpublished',
        content: 'Should not appear',
        category: 'general',
        author_id: staffId,
        target_rt: null,
        target_rw: null,
        is_priority: false,
        event_date: null,
        published_at: null
      })
      .execute();

    const results = await getAnnouncements(citizenId);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('General Announcement');
    expect(results[0].target_rt).toBeNull();
    expect(results[0].target_rw).toBeNull();
  });

  it('should return RT/RW specific announcements for citizens', async () => {
    // Create test user
    const citizenResult = await db.insert(usersTable)
      .values({
        id: 'citizen-2',
        ...citizenUser
      })
      .returning()
      .execute();

    const citizenId = citizenResult[0].id;

    // Create staff user for authoring
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'staff-2',
        ...villageStaffUser
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create announcements
    await db.insert(announcementsTable)
      .values([
        {
          ...generalAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...specificRtRwAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...differentRtRwAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...rwOnlyAnnouncement,
          author_id: staffId,
          published_at: new Date()
        }
      ])
      .execute();

    const results = await getAnnouncements(citizenId);

    expect(results).toHaveLength(3); // General, specific RT/RW, and RW-only
    
    const titles = results.map(r => r.title);
    expect(titles).toContain('General Announcement');
    expect(titles).toContain('RT/RW Specific');
    expect(titles).toContain('RW Only');
    expect(titles).not.toContain('Different RT/RW');
  });

  it('should order announcements by priority then by created date', async () => {
    // Create test user
    const citizenResult = await db.insert(usersTable)
      .values({
        id: 'citizen-3',
        ...citizenUser
      })
      .returning()
      .execute();

    const citizenId = citizenResult[0].id;

    // Create staff user for authoring
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'staff-3',
        ...villageStaffUser
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create announcements with different priorities and dates
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour earlier

    await db.insert(announcementsTable)
      .values([
        {
          title: 'Normal Priority Old',
          content: 'Content',
          category: 'general',
          author_id: staffId,
          target_rt: null,
          target_rw: null,
          is_priority: false,
          event_date: null,
          published_at: earlier,
          created_at: earlier
        },
        {
          title: 'High Priority',
          content: 'Content',
          category: 'emergency',
          author_id: staffId,
          target_rt: null,
          target_rw: null,
          is_priority: true,
          event_date: null,
          published_at: now,
          created_at: now
        },
        {
          title: 'Normal Priority New',
          content: 'Content',
          category: 'news',
          author_id: staffId,
          target_rt: null,
          target_rw: null,
          is_priority: false,
          event_date: null,
          published_at: now,
          created_at: now
        }
      ])
      .execute();

    const results = await getAnnouncements(citizenId);

    expect(results).toHaveLength(3);
    
    // Priority announcements should come first
    expect(results[0].title).toEqual('High Priority');
    expect(results[0].is_priority).toBe(true);
    
    // Among normal priority, newer should come first
    expect(results[1].title).toEqual('Normal Priority New');
    expect(results[2].title).toEqual('Normal Priority Old');
  });

  it('should return all announcements for staff users', async () => {
    // Create staff user
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'staff-4',
        ...villageStaffUser
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create announcements with different targets
    await db.insert(announcementsTable)
      .values([
        {
          ...generalAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...specificRtRwAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...differentRtRwAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          title: 'Unpublished Staff',
          content: 'Not published yet',
          category: 'general',
          author_id: staffId,
          target_rt: null,
          target_rw: null,
          is_priority: false,
          event_date: null,
          published_at: null
        }
      ])
      .execute();

    const results = await getAnnouncements(staffId);

    // Staff should see all announcements, including unpublished ones
    expect(results).toHaveLength(4);
    
    const titles = results.map(r => r.title);
    expect(titles).toContain('General Announcement');
    expect(titles).toContain('RT/RW Specific');
    expect(titles).toContain('Different RT/RW');
    expect(titles).toContain('Unpublished Staff');
  });

  it('should handle citizen without RT/RW assignment', async () => {
    // Create citizen without RT/RW
    const citizenResult = await db.insert(usersTable)
      .values({
        id: 'citizen-no-rt-rw',
        email: 'citizen-no-rt@test.com',
        name: 'Citizen No RT/RW',
        phone: null,
        role: 'citizen',
        rt: null,
        rw: null,
        address: null,
        nik: null
      })
      .returning()
      .execute();

    const citizenId = citizenResult[0].id;

    // Create staff user for authoring
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'staff-5',
        ...villageStaffUser
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create various announcements
    await db.insert(announcementsTable)
      .values([
        {
          ...generalAnnouncement,
          author_id: staffId,
          published_at: new Date()
        },
        {
          ...specificRtRwAnnouncement,
          author_id: staffId,
          published_at: new Date()
        }
      ])
      .execute();

    const results = await getAnnouncements(citizenId);

    // Should only see general announcements (no RT/RW targeting)
    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('General Announcement');
  });
});
