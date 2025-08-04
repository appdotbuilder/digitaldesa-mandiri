
import { db } from '../db';
import { serviceTemplatesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ServiceTemplate } from '../schema';

export const getServiceTemplates = async (): Promise<ServiceTemplate[]> => {
  try {
    // Fetch all active service templates
    const results = await db.select()
      .from(serviceTemplatesTable)
      .where(eq(serviceTemplatesTable.is_active, true))
      .execute();

    // Transform results to match ServiceTemplate type (JSON fields need type casting)
    return results.map(result => ({
      ...result,
      required_documents: result.required_documents as ServiceTemplate['required_documents'],
      form_fields: result.form_fields as ServiceTemplate['form_fields']
    }));
  } catch (error) {
    console.error('Failed to fetch service templates:', error);
    throw error;
  }
};
