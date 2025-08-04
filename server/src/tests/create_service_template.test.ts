
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceTemplatesTable } from '../db/schema';
import { type CreateServiceTemplateInput } from '../schema';
import { createServiceTemplate } from '../handlers/create_service_template';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateServiceTemplateInput = {
  name: 'Domicile Letter Service',
  service_type: 'domicile_letter',
  description: 'Service to issue domicile letters for residents',
  required_documents: ['ktp', 'kk'],
  form_fields: {
    applicant_name: { type: 'text', required: true, label: 'Full Name' },
    purpose: { type: 'text', required: true, label: 'Purpose of Letter' },
    address: { type: 'textarea', required: true, label: 'Current Address' }
  },
  template_content: 'This is to certify that {applicant_name} resides at {address}...'
};

describe('createServiceTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service template', async () => {
    const result = await createServiceTemplate(testInput);

    // Basic field validation
    expect(result.name).toEqual('Domicile Letter Service');
    expect(result.service_type).toEqual('domicile_letter');
    expect(result.description).toEqual(testInput.description);
    expect(result.required_documents).toEqual(['ktp', 'kk']);
    expect(result.form_fields).toEqual(testInput.form_fields);
    expect(result.template_content).toEqual(testInput.template_content);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save service template to database', async () => {
    const result = await createServiceTemplate(testInput);

    // Query the database to verify record was saved
    const templates = await db.select()
      .from(serviceTemplatesTable)
      .where(eq(serviceTemplatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    const template = templates[0];
    expect(template.name).toEqual('Domicile Letter Service');
    expect(template.service_type).toEqual('domicile_letter');
    expect(template.description).toEqual(testInput.description);
    expect(template.required_documents).toEqual(['ktp', 'kk']);
    expect(template.form_fields).toEqual(testInput.form_fields);
    expect(template.template_content).toEqual(testInput.template_content);
    expect(template.is_active).toBe(true);
    expect(template.created_at).toBeInstanceOf(Date);
    expect(template.updated_at).toBeInstanceOf(Date);
  });

  it('should handle complex form fields configuration', async () => {
    const complexInput: CreateServiceTemplateInput = {
      name: 'Business Permit Service',
      service_type: 'business_letter',
      description: 'Service for business permit applications',
      required_documents: ['ktp', 'other'],
      form_fields: {
        business_name: { 
          type: 'text', 
          required: true, 
          label: 'Business Name',
          validation: { minLength: 3, maxLength: 100 }
        },
        business_type: { 
          type: 'select', 
          required: true, 
          label: 'Business Type',
          options: ['retail', 'food_service', 'manufacturing', 'other']
        },
        capital_amount: { 
          type: 'number', 
          required: true, 
          label: 'Initial Capital',
          validation: { min: 0 }
        },
        employees: { 
          type: 'number', 
          required: false, 
          label: 'Number of Employees',
          validation: { min: 0, max: 1000 }
        }
      },
      template_content: 'Business permit for {business_name} of type {business_type}...'
    };

    const result = await createServiceTemplate(complexInput);

    expect(result.form_fields).toEqual(complexInput.form_fields);
    expect(result.required_documents).toEqual(['ktp', 'other']);
    expect(result.service_type).toEqual('business_letter');
  });

  it('should handle empty required documents array', async () => {
    const inputWithEmptyDocs: CreateServiceTemplateInput = {
      name: 'Simple Information Service',
      service_type: 'other',
      description: 'A service that requires no documents',
      required_documents: [],
      form_fields: {
        inquiry_type: { type: 'text', required: true, label: 'Type of Inquiry' }
      },
      template_content: 'Information regarding {inquiry_type}...'
    };

    const result = await createServiceTemplate(inputWithEmptyDocs);

    expect(result.required_documents).toEqual([]);
    expect(result.name).toEqual('Simple Information Service');
    expect(result.service_type).toEqual('other');
  });
});
