
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, serviceTemplatesTable, applicationsTable } from '../db/schema';
import { type UpdateApplicationStatusInput } from '../schema';
import { updateApplicationStatus } from '../handlers/update_application_status';
import { eq } from 'drizzle-orm';

// Test data
const testCitizen = {
  id: 'citizen-123',
  email: 'citizen@test.com',
  name: 'Test Citizen',
  phone: '081234567890',
  role: 'citizen' as const,
  rt: '001',
  rw: '002',
  address: 'Test Address',
  nik: '1234567890123456'
};

const testReviewer = {
  id: 'reviewer-123',
  email: 'reviewer@test.com',
  name: 'Test Reviewer',
  phone: '081234567891',
  role: 'rt_rw_head' as const,
  rt: '001',
  rw: '002',
  address: 'Reviewer Address',
  nik: '1234567890123457'
};

const testServiceTemplate = {
  name: 'Domicile Letter',
  service_type: 'domicile_letter' as const,
  description: 'Letter of domicile',
  required_documents: ['ktp', 'kk'],
  form_fields: { name: 'text', address: 'textarea' },
  template_content: 'Template content'
};

const testApplication = {
  citizen_id: 'citizen-123',
  service_template_id: 1,
  form_data: { name: 'Test Name', address: 'Test Address' },
  submitted_documents: [1, 2]
};

describe('updateApplicationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update application status to rt_rw_approved', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([testCitizen, testReviewer]).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'rt_rw_approved',
      reviewer_id: 'reviewer-123',
      notes: 'Application approved by RT/RW'
    };

    const result = await updateApplicationStatus(input);

    expect(result.id).toEqual(applicationResult[0].id);
    expect(result.status).toEqual('rt_rw_approved');
    expect(result.rt_rw_reviewer_id).toEqual('reviewer-123');
    expect(result.rt_rw_review_notes).toEqual('Application approved by RT/RW');
    expect(result.rt_rw_reviewed_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.form_data).toBe('object');
    expect(Array.isArray(result.submitted_documents)).toBe(true);
  });

  it('should update application status to village_processing', async () => {
    // Create prerequisite data
    const villageStaff = {
      ...testReviewer,
      id: 'staff-123',
      email: 'staff@test.com',
      role: 'village_staff' as const
    };

    await db.insert(usersTable).values([testCitizen, villageStaff]).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'village_processing',
      reviewer_id: 'staff-123',
      notes: 'Processing by village staff'
    };

    const result = await updateApplicationStatus(input);

    expect(result.status).toEqual('village_processing');
    expect(result.village_staff_id).toEqual('staff-123');
    expect(result.village_processing_notes).toEqual('Processing by village staff');
    expect(result.village_processed_at).toBeInstanceOf(Date);
  });

  it('should update application status to completed', async () => {
    // Create prerequisite data
    const villageHead = {
      ...testReviewer,
      id: 'head-123',
      email: 'head@test.com',
      role: 'village_head' as const
    };

    await db.insert(usersTable).values([testCitizen, villageHead]).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'completed',
      reviewer_id: 'head-123',
      notes: 'Application completed'
    };

    const result = await updateApplicationStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.village_head_id).toEqual('head-123');
    expect(result.village_head_notes).toEqual('Application completed');
    expect(result.village_head_reviewed_at).toBeInstanceOf(Date);
  });

  it('should save status update to database', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([testCitizen, testReviewer]).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'rt_rw_rejected',
      reviewer_id: 'reviewer-123',
      notes: 'Application rejected'
    };

    await updateApplicationStatus(input);

    // Verify database update
    const applications = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationResult[0].id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].status).toEqual('rt_rw_rejected');
    expect(applications[0].rt_rw_reviewer_id).toEqual('reviewer-123');
    expect(applications[0].rt_rw_review_notes).toEqual('Application rejected');
    expect(applications[0].rt_rw_reviewed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent application', async () => {
    await db.insert(usersTable).values(testReviewer).execute();

    const input: UpdateApplicationStatusInput = {
      id: 999,
      status: 'rt_rw_approved',
      reviewer_id: 'reviewer-123'
    };

    expect(updateApplicationStatus(input)).rejects.toThrow(/application not found/i);
  });

  it('should throw error for non-existent reviewer', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testCitizen).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'rt_rw_approved',
      reviewer_id: 'non-existent-reviewer'
    };

    expect(updateApplicationStatus(input)).rejects.toThrow(/reviewer not found/i);
  });

  it('should handle status update without notes', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([testCitizen, testReviewer]).execute();
    await db.insert(serviceTemplatesTable).values(testServiceTemplate).execute();
    
    const applicationResult = await db.insert(applicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    const input: UpdateApplicationStatusInput = {
      id: applicationResult[0].id,
      status: 'rt_rw_approved',
      reviewer_id: 'reviewer-123'
    };

    const result = await updateApplicationStatus(input);

    expect(result.status).toEqual('rt_rw_approved');
    expect(result.rt_rw_reviewer_id).toEqual('reviewer-123');
    expect(result.rt_rw_review_notes).toBeNull();
    expect(result.rt_rw_reviewed_at).toBeInstanceOf(Date);
  });
});
