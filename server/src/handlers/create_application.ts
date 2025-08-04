
import { db } from '../db';
import { applicationsTable, usersTable, serviceTemplatesTable, citizenDocumentsTable } from '../db/schema';
import { type CreateApplicationInput, type Application } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createApplication = async (input: CreateApplicationInput): Promise<Application> => {
  try {
    // Verify citizen exists
    const citizen = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.citizen_id))
      .execute();

    if (citizen.length === 0) {
      throw new Error(`Citizen with ID ${input.citizen_id} not found`);
    }

    // Verify service template exists and is active
    const serviceTemplate = await db.select()
      .from(serviceTemplatesTable)
      .where(eq(serviceTemplatesTable.id, input.service_template_id))
      .execute();

    if (serviceTemplate.length === 0) {
      throw new Error(`Service template with ID ${input.service_template_id} not found`);
    }

    if (!serviceTemplate[0].is_active) {
      throw new Error(`Service template with ID ${input.service_template_id} is not active`);
    }

    // Verify submitted documents exist and belong to the citizen
    if (input.submitted_documents.length > 0) {
      const documents = await db.select()
        .from(citizenDocumentsTable)
        .where(inArray(citizenDocumentsTable.id, input.submitted_documents))
        .execute();

      if (documents.length !== input.submitted_documents.length) {
        throw new Error('One or more submitted documents not found');
      }

      // Check all documents belong to the citizen
      const invalidDocuments = documents.filter(doc => doc.citizen_id !== input.citizen_id);
      if (invalidDocuments.length > 0) {
        throw new Error('Some submitted documents do not belong to the citizen');
      }
    }

    // Insert application record
    const result = await db.insert(applicationsTable)
      .values({
        citizen_id: input.citizen_id,
        service_template_id: input.service_template_id,
        form_data: input.form_data,
        submitted_documents: input.submitted_documents,
        status: 'submitted'
      })
      .returning()
      .execute();

    // Convert the database result to match the Application type
    const application = result[0];
    return {
      ...application,
      form_data: application.form_data as Record<string, any>,
      submitted_documents: application.submitted_documents as number[]
    };
  } catch (error) {
    console.error('Application creation failed:', error);
    throw error;
  }
};
