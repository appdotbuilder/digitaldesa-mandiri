
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceTemplatesTable } from '../db/schema';
import { type CreateServiceTemplateInput } from '../schema';
import { getServiceTemplates } from '../handlers/get_service_templates';

// Test data for service templates
const testTemplate1: CreateServiceTemplateInput = {
  name: 'Domicile Letter',
  service_type: 'domicile_letter',
  description: 'Official letter stating residence address',
  required_documents: ['ktp', 'kk'],
  form_fields: {
    full_name: { type: 'text', required: true, label: 'Full Name' },
    purpose: { type: 'text', required: true, label: 'Purpose of Letter' }
  },
  template_content: 'This is to certify that {{full_name}} resides at {{address}} for the purpose of {{purpose}}.'
};

const testTemplate2: CreateServiceTemplateInput = {
  name: 'Business License Letter',
  service_type: 'business_letter',
  description: 'Letter for business license application',
  required_documents: ['ktp', 'other'],
  form_fields: {
    business_name: { type: 'text', required: true, label: 'Business Name' },
    business_type: { type: 'select', required: true, label: 'Business Type', options: ['retail', 'service', 'food'] }
  },
  template_content: 'Business license letter template for {{business_name}} of type {{business_type}}.'
};

describe('getServiceTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no service templates exist', async () => {
    const result = await getServiceTemplates();
    expect(result).toEqual([]);
  });

  it('should return all active service templates', async () => {
    // Create test service templates
    await db.insert(serviceTemplatesTable)
      .values([
        {
          ...testTemplate1,
          required_documents: JSON.stringify(testTemplate1.required_documents),
          form_fields: JSON.stringify(testTemplate1.form_fields)
        },
        {
          ...testTemplate2,
          required_documents: JSON.stringify(testTemplate2.required_documents),
          form_fields: JSON.stringify(testTemplate2.form_fields)
        }
      ])
      .execute();

    const result = await getServiceTemplates();

    expect(result).toHaveLength(2);
    
    // Verify first template
    const domicileTemplate = result.find(t => t.name === 'Domicile Letter');
    expect(domicileTemplate).toBeDefined();
    expect(domicileTemplate!.service_type).toBe('domicile_letter');
    expect(domicileTemplate!.description).toBe('Official letter stating residence address');
    expect(domicileTemplate!.is_active).toBe(true);
    expect(domicileTemplate!.created_at).toBeInstanceOf(Date);
    expect(domicileTemplate!.updated_at).toBeInstanceOf(Date);

    // Verify second template
    const businessTemplate = result.find(t => t.name === 'Business License Letter');
    expect(businessTemplate).toBeDefined();
    expect(businessTemplate!.service_type).toBe('business_letter');
    expect(businessTemplate!.description).toBe('Letter for business license application');
    expect(businessTemplate!.is_active).toBe(true);
  });

  it('should not return inactive service templates', async () => {
    // Create one active and one inactive template
    await db.insert(serviceTemplatesTable)
      .values([
        {
          ...testTemplate1,
          required_documents: JSON.stringify(testTemplate1.required_documents),
          form_fields: JSON.stringify(testTemplate1.form_fields),
          is_active: true
        },
        {
          ...testTemplate2,
          required_documents: JSON.stringify(testTemplate2.required_documents),
          form_fields: JSON.stringify(testTemplate2.form_fields),
          is_active: false
        }
      ])
      .execute();

    const result = await getServiceTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Domicile Letter');
    expect(result[0].is_active).toBe(true);
  });

  it('should return templates with correct JSON field structure', async () => {
    await db.insert(serviceTemplatesTable)
      .values({
        ...testTemplate1,
        required_documents: JSON.stringify(testTemplate1.required_documents),
        form_fields: JSON.stringify(testTemplate1.form_fields)
      })
      .execute();

    const result = await getServiceTemplates();

    expect(result).toHaveLength(1);
    const template = result[0];
    
    // Verify JSON fields are properly structured
    expect(Array.isArray(template.required_documents)).toBe(true);
    expect(template.required_documents).toContain('ktp');
    expect(template.required_documents).toContain('kk');
    
    expect(typeof template.form_fields).toBe('object');
    expect(template.form_fields['full_name']).toBeDefined();
    expect(template.form_fields['purpose']).toBeDefined();
  });
});
