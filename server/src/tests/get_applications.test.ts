
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicationsTable, serviceTemplatesTable } from '../db/schema';
import { getApplications } from '../handlers/get_applications';

describe('getApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return citizen\'s own applications', async () => {
    // Create test users
    const [citizen1, citizen2] = await db.insert(usersTable)
      .values([
        {
          id: 'citizen1',
          email: 'citizen1@test.com',
          name: 'Citizen One',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        },
        {
          id: 'citizen2', 
          email: 'citizen2@test.com',
          name: 'Citizen Two',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create service template
    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create applications for both citizens
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen1.id,
          service_template_id: template.id,
          status: 'submitted',
          form_data: { test: 'data1' },
          submitted_documents: [1]
        },
        {
          citizen_id: citizen2.id,
          service_template_id: template.id,
          status: 'submitted', 
          form_data: { test: 'data2' },
          submitted_documents: [2]
        }
      ])
      .execute();

    // Citizen should only see their own applications
    const applications = await getApplications(citizen1.id, 'citizen');

    expect(applications).toHaveLength(1);
    expect(applications[0].citizen_id).toEqual(citizen1.id);
    expect(applications[0].form_data).toEqual({ test: 'data1' });
    expect(applications[0].submitted_documents).toEqual([1]);
    expect(applications[0].status).toEqual('submitted');
    expect(applications[0].created_at).toBeInstanceOf(Date);
    expect(typeof applications[0].form_data).toBe('object');
    expect(Array.isArray(applications[0].submitted_documents)).toBe(true);
  });

  it('should return applications for RT/RW head\'s area', async () => {
    // Create RT/RW head and citizens
    const [rtRwHead, citizen1, citizen2] = await db.insert(usersTable)
      .values([
        {
          id: 'rtrw1',
          email: 'rtrw@test.com',
          name: 'RT RW Head',
          role: 'rt_rw_head',
          rt: '001',
          rw: '002',
          is_active: true
        },
        {
          id: 'citizen1',
          email: 'citizen1@test.com', 
          name: 'Citizen One',
          role: 'citizen',
          rt: '001', // Same RT as head
          rw: '002', // Same RW as head
          is_active: true
        },
        {
          id: 'citizen2',
          email: 'citizen2@test.com',
          name: 'Citizen Two', 
          role: 'citizen',
          rt: '003', // Different RT
          rw: '004', // Different RW
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create service template
    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create applications
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen1.id, // In RT/RW head's area
          service_template_id: template.id,
          status: 'submitted',
          form_data: { test: 'data1' },
          submitted_documents: [1]
        },
        {
          citizen_id: citizen2.id, // Not in RT/RW head's area
          service_template_id: template.id,
          status: 'submitted',
          form_data: { test: 'data2' },
          submitted_documents: [2]
        }
      ])
      .execute();

    // RT/RW head should only see applications from their area
    const applications = await getApplications(rtRwHead.id, 'rt_rw_head');

    expect(applications).toHaveLength(1);
    expect(applications[0].citizen_id).toEqual(citizen1.id);
    expect(applications[0].status).toEqual('submitted');
    expect(applications[0].form_data).toEqual({ test: 'data1' });
  });

  it('should return applications for village staff to process', async () => {
    // Create users and service template
    const [citizen, staff] = await db.insert(usersTable)
      .values([
        {
          id: 'citizen1',
          email: 'citizen@test.com',
          name: 'Citizen',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        },
        {
          id: 'staff1',
          email: 'staff@test.com',
          name: 'Village Staff',
          role: 'village_staff',
          is_active: true
        }
      ])
      .returning()
      .execute();

    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create applications with different statuses
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'submitted', // Should not be visible
          form_data: { test: 'data1' },
          submitted_documents: [1]
        },
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'rt_rw_approved', // Should be visible
          form_data: { test: 'data2' },
          submitted_documents: [2]
        },
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'village_processing', // Should be visible
          form_data: { test: 'data3' },
          submitted_documents: [3]
        }
      ])
      .execute();

    // Village staff should see applications that need processing
    const applications = await getApplications(staff.id, 'village_staff');

    expect(applications).toHaveLength(2);
    expect(applications.map(app => app.status)).toEqual(
      expect.arrayContaining(['rt_rw_approved', 'village_processing'])
    );
    
    // Verify type conversions
    applications.forEach(app => {
      expect(typeof app.form_data).toBe('object');
      expect(Array.isArray(app.submitted_documents)).toBe(true);
    });
  });

  it('should return applications for village head review', async () => {
    // Create users and service template
    const [citizen, head] = await db.insert(usersTable)
      .values([
        {
          id: 'citizen1',
          email: 'citizen@test.com',
          name: 'Citizen',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        },
        {
          id: 'head1',
          email: 'head@test.com',
          name: 'Village Head',
          role: 'village_head',
          is_active: true
        }
      ])
      .returning()
      .execute();

    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create applications with different statuses
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'village_processing', // Should not be visible
          form_data: { test: 'data1' },
          submitted_documents: [1]
        },
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'village_head_review', // Should be visible
          form_data: { test: 'data2' },
          submitted_documents: [2]
        }
      ])
      .execute();

    // Village head should only see applications needing their review
    const applications = await getApplications(head.id, 'village_head');

    expect(applications).toHaveLength(1);
    expect(applications[0].status).toEqual('village_head_review');
    expect(applications[0].form_data).toEqual({ test: 'data2' });
    expect(applications[0].submitted_documents).toEqual([2]);
  });

  it('should return empty array for unknown role', async () => {
    // Create test user with unknown role
    const applications = await getApplications('unknown-user', 'unknown_role');

    expect(applications).toHaveLength(0);
  });

  it('should handle RT/RW head with no area defined', async () => {
    // Create RT/RW head without RT/RW values
    const [rtRwHead] = await db.insert(usersTable)
      .values([
        {
          id: 'rtrw1',
          email: 'rtrw@test.com',
          name: 'RT RW Head',
          role: 'rt_rw_head',
          rt: null,
          rw: null,
          is_active: true
        }
      ])
      .returning()
      .execute();

    const applications = await getApplications(rtRwHead.id, 'rt_rw_head');

    expect(applications).toHaveLength(0);
  });

  it('should include applications reviewed by RT/RW head', async () => {
    // Create RT/RW head and citizen
    const [rtRwHead, citizen] = await db.insert(usersTable)
      .values([
        {
          id: 'rtrw1',
          email: 'rtrw@test.com',
          name: 'RT RW Head',
          role: 'rt_rw_head',
          rt: '001',
          rw: '002',
          is_active: true
        },
        {
          id: 'citizen1',
          email: 'citizen1@test.com',
          name: 'Citizen One',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create service template
    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create application that was already reviewed by this RT/RW head
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'rt_rw_approved',
          form_data: { test: 'data1' },
          submitted_documents: [1],
          rt_rw_reviewer_id: rtRwHead.id // Reviewed by this RT/RW head
        }
      ])
      .execute();

    // RT/RW head should see applications they reviewed
    const applications = await getApplications(rtRwHead.id, 'rt_rw_head');

    expect(applications).toHaveLength(1);
    expect(applications[0].rt_rw_reviewer_id).toEqual(rtRwHead.id);
    expect(applications[0].status).toEqual('rt_rw_approved');
    expect(applications[0].form_data).toEqual({ test: 'data1' });
  });

  it('should handle date conversions correctly', async () => {
    // Create test users
    const [citizen] = await db.insert(usersTable)
      .values([
        {
          id: 'citizen1',
          email: 'citizen1@test.com',
          name: 'Citizen One',
          role: 'citizen',
          rt: '001',
          rw: '002',
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create service template
    const [template] = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Test Service',
        service_type: 'domicile_letter',
        description: 'Test service description',
        required_documents: ['ktp'],
        form_fields: {},
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();

    // Create application
    await db.insert(applicationsTable)
      .values([
        {
          citizen_id: citizen.id,
          service_template_id: template.id,
          status: 'submitted',
          form_data: { test: 'data1' },
          submitted_documents: [1]
        }
      ])
      .execute();

    const applications = await getApplications(citizen.id, 'citizen');

    expect(applications).toHaveLength(1);
    expect(applications[0].created_at).toBeInstanceOf(Date);
    expect(applications[0].updated_at).toBeInstanceOf(Date);
    expect(applications[0].rt_rw_reviewed_at).toBeNull();
    expect(applications[0].village_processed_at).toBeNull();
    expect(applications[0].village_head_reviewed_at).toBeNull();
  });
});
