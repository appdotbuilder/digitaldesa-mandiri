
import { serial, text, pgTable, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['citizen', 'rt_rw_head', 'village_staff', 'village_head']);
export const documentTypeEnum = pgEnum('document_type', ['ktp', 'kk', 'birth_certificate', 'marriage_certificate', 'other']);
export const serviceTypeEnum = pgEnum('service_type', ['domicile_letter', 'business_letter', 'poor_certificate', 'birth_certificate', 'other']);
export const applicationStatusEnum = pgEnum('application_status', ['submitted', 'rt_rw_review', 'rt_rw_approved', 'rt_rw_rejected', 'village_processing', 'village_head_review', 'completed', 'rejected']);
export const announcementCategoryEnum = pgEnum('announcement_category', ['news', 'event', 'posyandu', 'community_work', 'emergency', 'general']);
export const complaintStatusEnum = pgEnum('complaint_status', ['received', 'under_review', 'resolved', 'closed']);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(), // Using text for Supabase UUID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull(),
  rt: text('rt'),
  rw: text('rw'),
  address: text('address'),
  nik: text('nik'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Citizen documents table
export const citizenDocumentsTable = pgTable('citizen_documents', {
  id: serial('id').primaryKey(),
  citizen_id: text('citizen_id').notNull().references(() => usersTable.id),
  document_type: documentTypeEnum('document_type').notNull(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull()
});

// Service templates table
export const serviceTemplatesTable = pgTable('service_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  service_type: serviceTypeEnum('service_type').notNull(),
  description: text('description').notNull(),
  required_documents: jsonb('required_documents').notNull(), // Array of document types
  form_fields: jsonb('form_fields').notNull(), // Dynamic form configuration
  template_content: text('template_content').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Applications table
export const applicationsTable = pgTable('applications', {
  id: serial('id').primaryKey(),
  citizen_id: text('citizen_id').notNull().references(() => usersTable.id),
  service_template_id: integer('service_template_id').notNull().references(() => serviceTemplatesTable.id),
  status: applicationStatusEnum('status').notNull().default('submitted'),
  form_data: jsonb('form_data').notNull(),
  submitted_documents: jsonb('submitted_documents').notNull(), // Array of document IDs
  rt_rw_reviewer_id: text('rt_rw_reviewer_id').references(() => usersTable.id),
  rt_rw_review_notes: text('rt_rw_review_notes'),
  rt_rw_reviewed_at: timestamp('rt_rw_reviewed_at'),
  village_staff_id: text('village_staff_id').references(() => usersTable.id),
  village_processing_notes: text('village_processing_notes'),
  village_processed_at: timestamp('village_processed_at'),
  village_head_id: text('village_head_id').references(() => usersTable.id),
  village_head_notes: text('village_head_notes'),
  village_head_reviewed_at: timestamp('village_head_reviewed_at'),
  document_number: text('document_number'),
  generated_document_url: text('generated_document_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Announcements table
export const announcementsTable = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: announcementCategoryEnum('category').notNull(),
  author_id: text('author_id').notNull().references(() => usersTable.id),
  target_rt: text('target_rt'),
  target_rw: text('target_rw'),
  is_priority: boolean('is_priority').notNull().default(false),
  published_at: timestamp('published_at'),
  event_date: timestamp('event_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Complaints table
export const complaintsTable = pgTable('complaints', {
  id: serial('id').primaryKey(),
  citizen_id: text('citizen_id').references(() => usersTable.id), // Nullable for anonymous complaints
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location'),
  is_anonymous: boolean('is_anonymous').notNull().default(false),
  status: complaintStatusEnum('status').notNull().default('received'),
  assigned_staff_id: text('assigned_staff_id').references(() => usersTable.id),
  resolution_notes: text('resolution_notes'),
  resolved_at: timestamp('resolved_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Complaint attachments table
export const complaintAttachmentsTable = pgTable('complaint_attachments', {
  id: serial('id').primaryKey(),
  complaint_id: integer('complaint_id').notNull().references(() => complaintsTable.id),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  file_type: text('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  documents: many(citizenDocumentsTable),
  applications: many(applicationsTable),
  announcements: many(announcementsTable),
  complaints: many(complaintsTable),
  assignedComplaints: many(complaintsTable)
}));

export const citizenDocumentsRelations = relations(citizenDocumentsTable, ({ one }) => ({
  citizen: one(usersTable, {
    fields: [citizenDocumentsTable.citizen_id],
    references: [usersTable.id]
  })
}));

export const serviceTemplatesRelations = relations(serviceTemplatesTable, ({ many }) => ({
  applications: many(applicationsTable)
}));

export const applicationsRelations = relations(applicationsTable, ({ one }) => ({
  citizen: one(usersTable, {
    fields: [applicationsTable.citizen_id],
    references: [usersTable.id]
  }),
  serviceTemplate: one(serviceTemplatesTable, {
    fields: [applicationsTable.service_template_id],
    references: [serviceTemplatesTable.id]
  }),
  rtRwReviewer: one(usersTable, {
    fields: [applicationsTable.rt_rw_reviewer_id],
    references: [usersTable.id]
  }),
  villageStaff: one(usersTable, {
    fields: [applicationsTable.village_staff_id],
    references: [usersTable.id]
  }),
  villageHead: one(usersTable, {
    fields: [applicationsTable.village_head_id],
    references: [usersTable.id]
  })
}));

export const announcementsRelations = relations(announcementsTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [announcementsTable.author_id],
    references: [usersTable.id]
  })
}));

export const complaintsRelations = relations(complaintsTable, ({ one, many }) => ({
  citizen: one(usersTable, {
    fields: [complaintsTable.citizen_id],
    references: [usersTable.id]
  }),
  assignedStaff: one(usersTable, {
    fields: [complaintsTable.assigned_staff_id],
    references: [usersTable.id]
  }),
  attachments: many(complaintAttachmentsTable)
}));

export const complaintAttachmentsRelations = relations(complaintAttachmentsTable, ({ one }) => ({
  complaint: one(complaintsTable, {
    fields: [complaintAttachmentsTable.complaint_id],
    references: [complaintsTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  citizenDocuments: citizenDocumentsTable,
  serviceTemplates: serviceTemplatesTable,
  applications: applicationsTable,
  announcements: announcementsTable,
  complaints: complaintsTable,
  complaintAttachments: complaintAttachmentsTable
};
