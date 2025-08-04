
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { complaintsTable, usersTable } from '../db/schema';
import { type UpdateComplaintStatusInput, type CreateUserInput, type CreateComplaintInput } from '../schema';
import { updateComplaintStatus } from '../handlers/update_complaint_status';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'citizen@test.com',
  name: 'Test Citizen',
  phone: '08123456789',
  role: 'citizen',
  rt: '001',
  rw: '001',
  address: 'Test Address',
  nik: '1234567890123456'
};

const testStaff: CreateUserInput = {
  email: 'staff@test.com',
  name: 'Test Staff',
  phone: '08123456790',
  role: 'village_staff',
  rt: null,
  rw: null,
  address: 'Village Office',
  nik: '1234567890123457'
};

const testComplaint: CreateComplaintInput = {
  citizen_id: null, // Will be set after user creation
  title: 'Test Complaint',
  description: 'This is a test complaint',
  location: 'Test Location',
  is_anonymous: false
};

describe('updateComplaintStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update complaint status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        ...testUser
      })
      .returning()
      .execute();

    // Create test staff
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'test-staff-id',
        ...testStaff
      })
      .returning()
      .execute();

    // Create test complaint
    const complaintResult = await db.insert(complaintsTable)
      .values({
        ...testComplaint,
        citizen_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateComplaintStatusInput = {
      id: complaintResult[0].id,
      status: 'under_review',
      assigned_staff_id: staffResult[0].id,
      resolution_notes: 'Complaint is being reviewed'
    };

    const result = await updateComplaintStatus(updateInput);

    // Verify basic fields
    expect(result.id).toEqual(complaintResult[0].id);
    expect(result.status).toEqual('under_review');
    expect(result.assigned_staff_id).toEqual(staffResult[0].id);
    expect(result.resolution_notes).toEqual('Complaint is being reviewed');
    expect(result.resolved_at).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set resolved_at when status is resolved', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        ...testUser
      })
      .returning()
      .execute();

    // Create test complaint
    const complaintResult = await db.insert(complaintsTable)
      .values({
        ...testComplaint,
        citizen_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateComplaintStatusInput = {
      id: complaintResult[0].id,
      status: 'resolved',
      assigned_staff_id: null,
      resolution_notes: 'Complaint has been resolved'
    };

    const result = await updateComplaintStatus(updateInput);

    expect(result.status).toEqual('resolved');
    expect(result.resolution_notes).toEqual('Complaint has been resolved');
    expect(result.resolved_at).toBeInstanceOf(Date);
    expect(result.resolved_at).not.toBeNull();
  });

  it('should update complaint in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        ...testUser
      })
      .returning()
      .execute();

    // Create test staff
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'test-staff-id',
        ...testStaff
      })
      .returning()
      .execute();

    // Create test complaint
    const complaintResult = await db.insert(complaintsTable)
      .values({
        ...testComplaint,
        citizen_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateComplaintStatusInput = {
      id: complaintResult[0].id,
      status: 'under_review',
      assigned_staff_id: staffResult[0].id,
      resolution_notes: 'Complaint is being reviewed'
    };

    await updateComplaintStatus(updateInput);

    // Verify database was updated
    const complaints = await db.select()
      .from(complaintsTable)
      .where(eq(complaintsTable.id, complaintResult[0].id))
      .execute();

    expect(complaints).toHaveLength(1);
    expect(complaints[0].status).toEqual('under_review');
    expect(complaints[0].assigned_staff_id).toEqual(staffResult[0].id);
    expect(complaints[0].resolution_notes).toEqual('Complaint is being reviewed');
    expect(complaints[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when complaint not found', async () => {
    const updateInput: UpdateComplaintStatusInput = {
      id: 999999,
      status: 'under_review',
      assigned_staff_id: null,
      resolution_notes: 'Test notes'
    };

    await expect(updateComplaintStatus(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle anonymous complaints', async () => {
    // Create anonymous complaint
    const complaintResult = await db.insert(complaintsTable)
      .values({
        ...testComplaint,
        citizen_id: null,
        is_anonymous: true
      })
      .returning()
      .execute();

    // Create test staff
    const staffResult = await db.insert(usersTable)
      .values({
        id: 'test-staff-id',
        ...testStaff
      })
      .returning()
      .execute();

    const updateInput: UpdateComplaintStatusInput = {
      id: complaintResult[0].id,
      status: 'closed',
      assigned_staff_id: staffResult[0].id,
      resolution_notes: 'Anonymous complaint closed'
    };

    const result = await updateComplaintStatus(updateInput);

    expect(result.citizen_id).toBeNull();
    expect(result.is_anonymous).toBe(true);
    expect(result.status).toEqual('closed');
    expect(result.assigned_staff_id).toEqual(staffResult[0].id);
  });
});
