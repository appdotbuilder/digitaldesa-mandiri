
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, serviceTemplatesTable, applicationsTable } from '../db/schema';
import { generateApplicationDocument } from '../handlers/generate_application_document';
import { eq } from 'drizzle-orm';

describe('generateApplicationDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate document for approved application', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        phone: '081234567890',
        role: 'citizen',
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      })
      .returning()
      .execute();

    // Create service template
    const templateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Domicile Letter',
        service_type: 'domicile_letter',
        description: 'Letter of domicile',
        required_documents: ['ktp', 'kk'],
        form_fields: { purpose: 'string', duration: 'string' },
        template_content: 'This is to certify that {name} is a resident...',
        is_active: true
      })
      .returning()
      .execute();

    // Create application
    const applicationResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: templateResult[0].id,
        status: 'rt_rw_approved',
        form_data: { purpose: 'Bank account opening', duration: '6 months' },
        submitted_documents: [1, 2]
      })
      .returning()
      .execute();

    const result = await generateApplicationDocument(applicationResult[0].id);

    expect(result.id).toEqual(applicationResult[0].id);
    expect(result.status).toEqual('completed');
    expect(result.document_number).toBeDefined();
    expect(result.document_number).toMatch(/001\/SKD\/\d{4}/);
    expect(result.generated_document_url).toBeDefined();
    expect(result.generated_document_url).toContain('documents');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique document numbers for different service types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        phone: '081234567890',
        role: 'citizen',
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      })
      .returning()
      .execute();

    // Create business letter template
    const businessTemplateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Business Letter',
        service_type: 'business_letter',
        description: 'Business permit letter',
        required_documents: ['ktp', 'kk'],
        form_fields: { business_type: 'string', location: 'string' },
        template_content: 'This is to certify business...',
        is_active: true
      })
      .returning()
      .execute();

    // Create poor certificate template
    const poorTemplateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Poor Certificate',
        service_type: 'poor_certificate',
        description: 'Certificate of poverty',
        required_documents: ['ktp', 'kk'],
        form_fields: { reason: 'string' },
        template_content: 'This is to certify poverty status...',
        is_active: true
      })
      .returning()
      .execute();

    // Create applications
    const businessAppResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: businessTemplateResult[0].id,
        status: 'village_processing',
        form_data: { business_type: 'Food stall', location: 'Main street' },
        submitted_documents: [1, 2]
      })
      .returning()
      .execute();

    const poorAppResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: poorTemplateResult[0].id,
        status: 'village_head_review',
        form_data: { reason: 'Medical expenses' },
        submitted_documents: [1, 2]
      })
      .returning()
      .execute();

    const businessResult = await generateApplicationDocument(businessAppResult[0].id);
    const poorResult = await generateApplicationDocument(poorAppResult[0].id);

    expect(businessResult.document_number).toMatch(/001\/SKU\/\d{4}/);
    expect(poorResult.document_number).toMatch(/001\/SKTM\/\d{4}/);
    expect(businessResult.document_number).not.toEqual(poorResult.document_number);
  });

  it('should throw error for non-existent application', async () => {
    await expect(generateApplicationDocument(999)).rejects.toThrow(/Application with ID 999 not found/i);
  });

  it('should throw error for application with invalid status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        phone: '081234567890',
        role: 'citizen',
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      })
      .returning()
      .execute();

    // Create service template
    const templateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Domicile Letter',
        service_type: 'domicile_letter',
        description: 'Letter of domicile',
        required_documents: ['ktp', 'kk'],
        form_fields: { purpose: 'string', duration: 'string' },
        template_content: 'This is to certify that {name} is a resident...',
        is_active: true
      })
      .returning()
      .execute();

    // Create application with 'submitted' status
    const applicationResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: templateResult[0].id,
        status: 'submitted',
        form_data: { purpose: 'Bank account opening', duration: '6 months' },
        submitted_documents: [1, 2]
      })
      .returning()
      .execute();

    await expect(generateApplicationDocument(applicationResult[0].id))
      .rejects.toThrow(/Cannot generate document for application with status: submitted/i);
  });

  it('should preserve existing document number if already generated', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        phone: '081234567890',
        role: 'citizen',
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      })
      .returning()
      .execute();

    // Create service template
    const templateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Domicile Letter',
        service_type: 'domicile_letter',
        description: 'Letter of domicile',
        required_documents: ['ktp', 'kk'],
        form_fields: { purpose: 'string', duration: 'string' },
        template_content: 'This is to certify that {name} is a resident...',
        is_active: true
      })
      .returning()
      .execute();

    // Create application with existing document number
    const existingDocNumber = '999/SKD/2024';
    const applicationResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: templateResult[0].id,
        status: 'village_processing',
        form_data: { purpose: 'Bank account opening', duration: '6 months' },
        submitted_documents: [1, 2],
        document_number: existingDocNumber
      })
      .returning()
      .execute();

    const result = await generateApplicationDocument(applicationResult[0].id);

    expect(result.document_number).toEqual(existingDocNumber);
    expect(result.status).toEqual('completed');
  });

  it('should update application in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'citizen@test.com',
        name: 'Test Citizen',
        phone: '081234567890',
        role: 'citizen',
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      })
      .returning()
      .execute();

    // Create service template
    const templateResult = await db.insert(serviceTemplatesTable)
      .values({
        name: 'Domicile Letter',
        service_type: 'domicile_letter',
        description: 'Letter of domicile',
        required_documents: ['ktp', 'kk'],
        form_fields: { purpose: 'string', duration: 'string' },
        template_content: 'This is to certify that {name} is a resident...',
        is_active: true
      })
      .returning()
      .execute();

    // Create application
    const applicationResult = await db.insert(applicationsTable)
      .values({
        citizen_id: userResult[0].id,
        service_template_id: templateResult[0].id,
        status: 'rt_rw_approved',
        form_data: { purpose: 'Bank account opening', duration: '6 months' },
        submitted_documents: [1, 2]
      })
      .returning()
      .execute();

    await generateApplicationDocument(applicationResult[0].id);

    // Verify database was updated
    const updatedApplication = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationResult[0].id))
      .execute();

    expect(updatedApplication).toHaveLength(1);
    expect(updatedApplication[0].status).toEqual('completed');
    expect(updatedApplication[0].document_number).toBeDefined();
    expect(updatedApplication[0].generated_document_url).toBeDefined();
    expect(updatedApplication[0].updated_at).toBeInstanceOf(Date);
  });
});
