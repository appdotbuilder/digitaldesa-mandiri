
import { db } from '../db';
import { serviceTemplatesTable } from '../db/schema';
import { type CreateServiceTemplateInput, type ServiceTemplate } from '../schema';

export const createServiceTemplate = async (input: CreateServiceTemplateInput): Promise<ServiceTemplate> => {
  try {
    // Insert service template record
    const result = await db.insert(serviceTemplatesTable)
      .values({
        name: input.name,
        service_type: input.service_type,
        description: input.description,
        required_documents: input.required_documents, // JSON array stored directly
        form_fields: input.form_fields, // JSON object stored directly
        template_content: input.template_content
      })
      .returning()
      .execute();

    const serviceTemplate = result[0];
    return {
      ...serviceTemplate,
      // JSON fields are returned as objects, no conversion needed
      required_documents: serviceTemplate.required_documents as any,
      form_fields: serviceTemplate.form_fields as any
    };
  } catch (error) {
    console.error('Service template creation failed:', error);
    throw error;
  }
};
