
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { complaintsTable, usersTable } from '../db/schema';
import { type CreateComplaintInput } from '../schema';
import { createComplaint } from '../handlers/create_complaint';
import { eq } from 'drizzle-orm';

// Test user for non-anonymous complaints
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: null,
  role: 'citizen' as const,
  rt: '001',
  rw: '002',
  address: 'Test Address',
  nik: '1234567890123456'
};

// Anonymous complaint input
const anonymousComplaintInput: CreateComplaintInput = {
  citizen_id: null,
  title: 'Anonymous Complaint',
  description: 'This is an anonymous complaint about road conditions',
  location: 'Jalan Raya No. 123',
  is_anonymous: true
};

// Identified complaint input
const identifiedComplaintInput: CreateComplaintInput = {
  citizen_id: 'test-user-123',
  title: 'Identified Complaint',
  description: 'This is a complaint from an identified citizen',
  location: 'Jalan Sudirman No. 456',
  is_anonymous: false
};

describe('createComplaint', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an anonymous complaint', async () => {
    const result = await createComplaint(anonymousComplaintInput);

    // Basic field validation
    expect(result.citizen_id).toBeNull();
    expect(result.title).toEqual('Anonymous Complaint');
    expect(result.description).toEqual(anonymousComplaintInput.description);
    expect(result.location).toEqual('Jalan Raya No. 123');
    expect(result.is_anonymous).toBe(true);
    expect(result.status).toEqual('received');
    expect(result.assigned_staff_id).toBeNull();
    expect(result.resolution_notes).toBeNull();
    expect(result.resolved_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an identified complaint', async () => {
    // Create prerequisite user first
    await db.insert(usersTable).values(testUser).execute();

    const result = await createComplaint(identifiedComplaintInput);

    // Basic field validation
    expect(result.citizen_id).toEqual('test-user-123');
    expect(result.title).toEqual('Identified Complaint');
    expect(result.description).toEqual(identifiedComplaintInput.description);
    expect(result.location).toEqual('Jalan Sudirman No. 456');
    expect(result.is_anonymous).toBe(false);
    expect(result.status).toEqual('received');
    expect(result.assigned_staff_id).toBeNull();
    expect(result.resolution_notes).toBeNull();
    expect(result.resolved_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save complaint to database', async () => {
    const result = await createComplaint(anonymousComplaintInput);

    // Query using proper drizzle syntax
    const complaints = await db.select()
      .from(complaintsTable)
      .where(eq(complaintsTable.id, result.id))
      .execute();

    expect(complaints).toHaveLength(1);
    expect(complaints[0].title).toEqual('Anonymous Complaint');
    expect(complaints[0].description).toEqual(anonymousComplaintInput.description);
    expect(complaints[0].location).toEqual('Jalan Raya No. 123');
    expect(complaints[0].is_anonymous).toBe(true);
    expect(complaints[0].status).toEqual('received');
    expect(complaints[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle complaint with null location', async () => {
    const inputWithoutLocation: CreateComplaintInput = {
      citizen_id: null,
      title: 'Complaint Without Location',
      description: 'A complaint without specific location',
      location: null,
      is_anonymous: true
    };

    const result = await createComplaint(inputWithoutLocation);

    expect(result.title).toEqual('Complaint Without Location');
    expect(result.location).toBeNull();
    expect(result.is_anonymous).toBe(true);
  });

  it('should fail when referencing non-existent citizen', async () => {
    const invalidComplaintInput: CreateComplaintInput = {
      citizen_id: 'non-existent-user',
      title: 'Invalid Complaint',
      description: 'This should fail due to foreign key constraint',
      location: 'Test Location',
      is_anonymous: false
    };

    await expect(createComplaint(invalidComplaintInput))
      .rejects.toThrow(/violates foreign key constraint/i);
  });
});
