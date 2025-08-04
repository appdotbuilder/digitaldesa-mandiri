
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, complaintsTable } from '../db/schema';
import { type CreateUserInput, type CreateComplaintInput } from '../schema';
import { getComplaints } from '../handlers/get_complaints';

// Test data
const citizenUser: CreateUserInput = {
  email: 'citizen@example.com',
  name: 'Test Citizen',
  phone: '081234567890',
  role: 'citizen',
  rt: '01',
  rw: '02',
  address: 'Test Address',
  nik: '1234567890123456'
};

const staffUser: CreateUserInput = {
  email: 'staff@example.com',
  name: 'Test Staff',
  phone: '081234567891',
  role: 'village_staff',
  rt: null,
  rw: null,
  address: 'Village Office',
  nik: '1234567890123457'
};

const rtRwHeadUser: CreateUserInput = {
  email: 'rtrwhead@example.com',
  name: 'RT/RW Head',
  phone: '081234567892',
  role: 'rt_rw_head',
  rt: '01',
  rw: '02',
  address: 'RT/RW Office',
  nik: '1234567890123458'
};

describe('getComplaints', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return citizen complaints for citizen role', async () => {
    // Create test users
    const [citizen] = await db.insert(usersTable)
      .values({ ...citizenUser, id: 'citizen-1' })
      .returning()
      .execute();

    const [otherCitizen] = await db.insert(usersTable)
      .values({ ...citizenUser, id: 'citizen-2', email: 'other@example.com' })
      .returning()
      .execute();

    // Create complaints
    const citizenComplaint: CreateComplaintInput = {
      citizen_id: citizen.id,
      title: 'Citizen Complaint',
      description: 'This is a complaint from citizen',
      location: 'Test Location',
      is_anonymous: false
    };

    const otherComplaint: CreateComplaintInput = {
      citizen_id: otherCitizen.id,
      title: 'Other Complaint',
      description: 'This is from another citizen',
      location: 'Other Location',
      is_anonymous: false
    };

    await db.insert(complaintsTable)
      .values([citizenComplaint, otherComplaint])
      .execute();

    const result = await getComplaints(citizen.id, 'citizen');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Citizen Complaint');
    expect(result[0].citizen_id).toEqual(citizen.id);
    expect(result[0].description).toEqual('This is a complaint from citizen');
    expect(result[0].location).toEqual('Test Location');
    expect(result[0].is_anonymous).toBe(false);
    expect(result[0].status).toEqual('received');
  });

  it('should return all complaints for village staff role', async () => {
    // Create test users
    const [citizen] = await db.insert(usersTable)
      .values({ ...citizenUser, id: 'citizen-1' })
      .returning()
      .execute();

    const [staff] = await db.insert(usersTable)
      .values({ ...staffUser, id: 'staff-1' })
      .returning()
      .execute();

    // Create multiple complaints
    const complaint1: CreateComplaintInput = {
      citizen_id: citizen.id,
      title: 'First Complaint',
      description: 'First complaint description',
      location: 'Location 1',
      is_anonymous: false
    };

    const complaint2: CreateComplaintInput = {
      citizen_id: citizen.id,
      title: 'Second Complaint',
      description: 'Second complaint description',
      location: null,
      is_anonymous: true
    };

    await db.insert(complaintsTable)
      .values([complaint1, complaint2])
      .execute();

    const result = await getComplaints(staff.id, 'village_staff');

    expect(result).toHaveLength(2);
    expect(result.map(c => c.title)).toContain('First Complaint');
    expect(result.map(c => c.title)).toContain('Second Complaint');
    
    // Check null handling
    const secondComplaint = result.find(c => c.title === 'Second Complaint');
    expect(secondComplaint?.location).toBeNull();
    expect(secondComplaint?.is_anonymous).toBe(true);
  });

  it('should return assigned and unassigned complaints for rt_rw_head role', async () => {
    // Create test users
    const [citizen] = await db.insert(usersTable)
      .values({ ...citizenUser, id: 'citizen-1' })
      .returning()
      .execute();

    const [rtRwHead] = await db.insert(usersTable)
      .values({ ...rtRwHeadUser, id: 'rtrw-1' })
      .returning()
      .execute();

    const [otherStaff] = await db.insert(usersTable)
      .values({ ...staffUser, id: 'staff-1' })
      .returning()
      .execute();

    // Create complaints with different assignment statuses
    const assignedComplaint = {
      citizen_id: citizen.id,
      title: 'Assigned Complaint',
      description: 'This is assigned to RT/RW head',
      location: 'Test Location',
      is_anonymous: false,
      assigned_staff_id: rtRwHead.id
    };

    const unassignedComplaint = {
      citizen_id: citizen.id,
      title: 'Unassigned Complaint',
      description: 'This is unassigned',
      location: 'Test Location',
      is_anonymous: false,
      assigned_staff_id: null
    };

    const otherAssignedComplaint = {
      citizen_id: citizen.id,
      title: 'Other Assigned Complaint',
      description: 'This is assigned to someone else',
      location: 'Test Location',
      is_anonymous: false,
      assigned_staff_id: otherStaff.id
    };

    await db.insert(complaintsTable)
      .values([assignedComplaint, unassignedComplaint, otherAssignedComplaint])
      .execute();

    const result = await getComplaints(rtRwHead.id, 'rt_rw_head');

    expect(result).toHaveLength(2);
    expect(result.map(c => c.title)).toContain('Assigned Complaint');
    expect(result.map(c => c.title)).toContain('Unassigned Complaint');
    expect(result.map(c => c.title)).not.toContain('Other Assigned Complaint');
  });

  it('should return empty array for citizen with no complaints', async () => {
    // Create test user
    const [citizen] = await db.insert(usersTable)
      .values({ ...citizenUser, id: 'citizen-1' })
      .returning()
      .execute();

    const result = await getComplaints(citizen.id, 'citizen');

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle anonymous complaints correctly', async () => {
    // Create test users
    const [staff] = await db.insert(usersTable)
      .values({ ...staffUser, id: 'staff-1' })
      .returning()
      .execute();

    // Create anonymous complaint
    const anonymousComplaint = {
      citizen_id: null,
      title: 'Anonymous Complaint',
      description: 'This is anonymous',
      location: 'Secret Location',
      is_anonymous: true
    };

    await db.insert(complaintsTable)
      .values([anonymousComplaint])
      .execute();

    const result = await getComplaints(staff.id, 'village_staff');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Anonymous Complaint');
    expect(result[0].citizen_id).toBeNull();
    expect(result[0].is_anonymous).toBe(true);
  });
});
