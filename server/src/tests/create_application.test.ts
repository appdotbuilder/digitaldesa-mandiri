
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, serviceTemplatesTable, citizenDocumentsTable, applicationsTable } from '../db/schema';
import { type CreateApplicationInput } from '../schema';
import { createApplication } from '../handlers/create_application';
import { eq } from 'drizzle-orm';

describe('createApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCitizenId: string;
  let testServiceTemplateId: number;
  let testDocumentId: number;

  beforeEach(async () => {
    // Create test citizen
    const citizen = await db.insert(usersTable)
      .values({
        id: 'test-citizen-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        role: 'citizen',
        is_active: true
      })
      .returning()
      .execute();
    testCitizenId = citizen[0].id;

    // Create test service template
    const serviceTemplate = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Domicile Letter',
        service_type: 'domicile_letter',
        description: 'Letter of domicile',
        required_documents: ['ktp', 'kk'],
        form_fields: { name: 'text', address: 'text' },
        template_content: 'Template content',
        is_active: true
      })
      .returning()
      .execute();
    testServiceTemplateId = serviceTemplate[0].id;

    // Create test document
    const document = await db.insert(citizenDocumentsTable)
      .values({
        citizen_id: testCitizenId,
        document_type: 'ktp',
        file_name: 'ktp.pdf',
        file_url: 'https://example.com/ktp.pdf',
        file_size: 1024
      })
      .returning()
      .execute();
    testDocumentId = document[0].id;
  });

  const testInput: CreateApplicationInput = {
    citizen_id: '',
    service_template_id: 0,
    form_data: { name: 'John Doe', address: '123 Main St' },
    submitted_documents: []
  };

  it('should create an application', async () => {
    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: testServiceTemplateId,
      submitted_documents: [testDocumentId]
    };

    const result = await createApplication(input);

    expect(result.citizen_id).toEqual(testCitizenId);
    expect(result.service_template_id).toEqual(testServiceTemplateId);
    expect(result.status).toEqual('submitted');
    expect(result.form_data).toEqual(input.form_data);
    expect(result.submitted_documents).toEqual([testDocumentId]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save application to database', async () => {
    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: testServiceTemplateId,
      submitted_documents: [testDocumentId]
    };

    const result = await createApplication(input);

    const applications = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].citizen_id).toEqual(testCitizenId);
    expect(applications[0].service_template_id).toEqual(testServiceTemplateId);
    expect(applications[0].status).toEqual('submitted');
    expect(applications[0].form_data).toEqual(input.form_data);
    expect(applications[0].submitted_documents).toEqual([testDocumentId]);
  });

  it('should create application with no submitted documents', async () => {
    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: testServiceTemplateId,
      submitted_documents: []
    };

    const result = await createApplication(input);

    expect(result.citizen_id).toEqual(testCitizenId);
    expect(result.submitted_documents).toEqual([]);
    expect(result.status).toEqual('submitted');
  });

  it('should throw error when citizen does not exist', async () => {
    const input = {
      ...testInput,
      citizen_id: 'non-existent-citizen',
      service_template_id: testServiceTemplateId,
      submitted_documents: []
    };

    await expect(createApplication(input)).rejects.toThrow(/citizen.*not found/i);
  });

  it('should throw error when service template does not exist', async () => {
    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: 99999,
      submitted_documents: []
    };

    await expect(createApplication(input)).rejects.toThrow(/service template.*not found/i);
  });

  it('should throw error when service template is not active', async () => {
    // Create inactive service template
    const inactiveTemplate = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Inactive Service',
        service_type: 'other',
        description: 'Inactive service',
        required_documents: ['ktp'],
        form_fields: { field: 'text' },
        template_content: 'Template',
        is_active: false
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: inactiveTemplate[0].id,
      submitted_documents: []
    };

    await expect(createApplication(input)).rejects.toThrow(/service template.*not active/i);
  });

  it('should throw error when submitted document does not exist', async () => {
    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: testServiceTemplateId,
      submitted_documents: [99999]
    };

    await expect(createApplication(input)).rejects.toThrow(/submitted documents not found/i);
  });

  it('should throw error when submitted document belongs to different citizen', async () => {
    // Create another citizen and their document
    const otherCitizen = await db.insert(usersTable)
      .values({
        id: 'other-citizen',
        email: 'other@test.com',
        name: 'Other Citizen',
        role: 'citizen',
        is_active: true
      })
      .returning()
      .execute();

    const otherDocument = await db.insert(citizenDocumentsTable)
      .values({
        citizen_id: otherCitizen[0].id,
        document_type: 'kk',
        file_name: 'kk.pdf',
        file_url: 'https://example.com/kk.pdf',
        file_size: 2048
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      citizen_id: testCitizenId,
      service_template_id: testServiceTemplateId,
      submitted_documents: [otherDocument[0].id]
    };

    await expect(createApplication(input)).rejects.toThrow(/documents do not belong to the citizen/i);
  });
});
