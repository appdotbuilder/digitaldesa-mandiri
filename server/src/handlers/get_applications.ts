
import { db } from '../db';
import { applicationsTable, usersTable } from '../db/schema';
import { type Application } from '../schema';
import { eq, and, or, inArray } from 'drizzle-orm';

export async function getApplications(userId: string, role: string): Promise<Application[]> {
  try {
    // Helper function to transform database result to Application type
    const transformApplication = (app: any): Application => ({
      ...app,
      form_data: app.form_data as Record<string, any>,
      submitted_documents: app.submitted_documents as number[],
      created_at: new Date(app.created_at),
      updated_at: new Date(app.updated_at),
      rt_rw_reviewed_at: app.rt_rw_reviewed_at ? new Date(app.rt_rw_reviewed_at) : null,
      village_processed_at: app.village_processed_at ? new Date(app.village_processed_at) : null,
      village_head_reviewed_at: app.village_head_reviewed_at ? new Date(app.village_head_reviewed_at) : null
    });

    // Handle each role separately to avoid complex conditional query building
    if (role === 'citizen') {
      // Citizens see only their own applications
      const results = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.citizen_id, userId))
        .execute();

      return results.map(transformApplication);
    }

    if (role === 'rt_rw_head') {
      // RT/RW heads see applications from their area that need their review
      // First get the RT/RW head's area info
      const rtRwHead = await db.select({ rt: usersTable.rt, rw: usersTable.rw })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .execute();

      if (rtRwHead.length === 0 || (!rtRwHead[0].rt && !rtRwHead[0].rw)) {
        return [];
      }

      const { rt, rw } = rtRwHead[0];

      // Join with users table to filter by citizen's RT/RW area
      const results = await db.select({
        id: applicationsTable.id,
        citizen_id: applicationsTable.citizen_id,
        service_template_id: applicationsTable.service_template_id,
        status: applicationsTable.status,
        form_data: applicationsTable.form_data,
        submitted_documents: applicationsTable.submitted_documents,
        rt_rw_reviewer_id: applicationsTable.rt_rw_reviewer_id,
        rt_rw_review_notes: applicationsTable.rt_rw_review_notes,
        rt_rw_reviewed_at: applicationsTable.rt_rw_reviewed_at,
        village_staff_id: applicationsTable.village_staff_id,
        village_processing_notes: applicationsTable.village_processing_notes,
        village_processed_at: applicationsTable.village_processed_at,
        village_head_id: applicationsTable.village_head_id,
        village_head_notes: applicationsTable.village_head_notes,
        village_head_reviewed_at: applicationsTable.village_head_reviewed_at,
        document_number: applicationsTable.document_number,
        generated_document_url: applicationsTable.generated_document_url,
        created_at: applicationsTable.created_at,
        updated_at: applicationsTable.updated_at
      })
        .from(applicationsTable)
        .innerJoin(usersTable, eq(applicationsTable.citizen_id, usersTable.id))
        .where(
          and(
            rt ? eq(usersTable.rt, rt) : undefined,
            rw ? eq(usersTable.rw, rw) : undefined,
            or(
              eq(applicationsTable.status, 'submitted'),
              eq(applicationsTable.status, 'rt_rw_review'),
              eq(applicationsTable.rt_rw_reviewer_id, userId)
            )
          )
        )
        .execute();

      return results.map(transformApplication);
    }

    if (role === 'village_staff') {
      // Village staff see applications that are approved by RT/RW and need processing
      const results = await db.select()
        .from(applicationsTable)
        .where(
          inArray(applicationsTable.status, [
            'rt_rw_approved',
            'village_processing'
          ])
        )
        .execute();

      return results.map(transformApplication);
    }

    if (role === 'village_head') {
      // Village heads see applications that need their final review
      const results = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.status, 'village_head_review'))
        .execute();

      return results.map(transformApplication);
    }

    // Unknown role - return empty array
    return [];
  } catch (error) {
    console.error('Get applications failed:', error);
    throw error;
  }
}
