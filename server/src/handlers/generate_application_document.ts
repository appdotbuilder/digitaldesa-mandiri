
import { db } from '../db';
import { applicationsTable, serviceTemplatesTable, usersTable } from '../db/schema';
import { type Application } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function generateApplicationDocument(applicationId: number): Promise<Application> {
  try {
    // First, get the application with its service template
    const applicationResult = await db.select()
      .from(applicationsTable)
      .innerJoin(serviceTemplatesTable, eq(applicationsTable.service_template_id, serviceTemplatesTable.id))
      .innerJoin(usersTable, eq(applicationsTable.citizen_id, usersTable.id))
      .where(eq(applicationsTable.id, applicationId))
      .execute();

    if (applicationResult.length === 0) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    const result = applicationResult[0];
    const application = result.applications;
    const serviceTemplate = result.service_templates;
    const citizen = result.users;

    // Check if application is in a status that allows document generation
    if (!['rt_rw_approved', 'village_processing', 'village_head_review', 'completed'].includes(application.status)) {
      throw new Error(`Cannot generate document for application with status: ${application.status}`);
    }

    // Generate unique document number if not already exists
    let documentNumber = application.document_number;
    if (!documentNumber) {
      const currentYear = new Date().getFullYear();
      const serviceTypeCode = getServiceTypeCode(serviceTemplate.service_type);
      
      // Get count of applications for this service type this year to generate sequential number
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear + 1, 0, 1);
      
      const countResult = await db.select()
        .from(applicationsTable)
        .innerJoin(serviceTemplatesTable, eq(applicationsTable.service_template_id, serviceTemplatesTable.id))
        .where(and(
          eq(serviceTemplatesTable.service_type, serviceTemplate.service_type),
          eq(applicationsTable.status, 'completed')
        ))
        .execute();

      const sequenceNumber = (countResult.length + 1).toString().padStart(3, '0');
      documentNumber = `${sequenceNumber}/${serviceTypeCode}/${currentYear}`;
    }

    // Generate document URL (in real implementation, this would create actual PDF)
    const generatedDocumentUrl = `https://storage.example.com/documents/${applicationId}/${documentNumber}.pdf`;

    // Update application with document details
    const updatedResult = await db.update(applicationsTable)
      .set({
        document_number: documentNumber,
        generated_document_url: generatedDocumentUrl,
        status: 'completed',
        updated_at: new Date()
      })
      .where(eq(applicationsTable.id, applicationId))
      .returning()
      .execute();

    const updatedApplication = updatedResult[0];

    return {
      ...updatedApplication,
      submitted_documents: Array.isArray(updatedApplication.submitted_documents) 
        ? updatedApplication.submitted_documents 
        : [],
      form_data: updatedApplication.form_data as Record<string, any> || {}
    };
  } catch (error) {
    console.error('Document generation failed:', error);
    throw error;
  }
}

function getServiceTypeCode(serviceType: string): string {
  const codes: Record<string, string> = {
    'domicile_letter': 'SKD',
    'business_letter': 'SKU',
    'poor_certificate': 'SKTM',
    'birth_certificate': 'SAL',
    'other': 'LAIN'
  };
  return codes[serviceType] || 'LAIN';
}
