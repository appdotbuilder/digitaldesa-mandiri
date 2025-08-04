
import { z } from 'zod';

// User and Authentication schemas
export const userRoleSchema = z.enum(['citizen', 'rt_rw_head', 'village_staff', 'village_head']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  rt: z.string().nullable(),
  rw: z.string().nullable(),
  address: z.string().nullable(),
  nik: z.string().nullable(), // NIK (Nomor Induk Kependudukan)
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Citizen Profile and Document schemas
export const documentTypeSchema = z.enum(['ktp', 'kk', 'birth_certificate', 'marriage_certificate', 'other']);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const citizenDocumentSchema = z.object({
  id: z.number(),
  citizen_id: z.string(),
  document_type: documentTypeSchema,
  file_name: z.string(),
  file_url: z.string(),
  file_size: z.number(),
  uploaded_at: z.coerce.date()
});

export type CitizenDocument = z.infer<typeof citizenDocumentSchema>;

// Service and Application schemas
export const serviceTypeSchema = z.enum(['domicile_letter', 'business_letter', 'poor_certificate', 'birth_certificate', 'other']);
export type ServiceType = z.infer<typeof serviceTypeSchema>;

export const applicationStatusSchema = z.enum(['submitted', 'rt_rw_review', 'rt_rw_approved', 'rt_rw_rejected', 'village_processing', 'village_head_review', 'completed', 'rejected']);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const serviceTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  service_type: serviceTypeSchema,
  description: z.string(),
  required_documents: z.array(documentTypeSchema),
  form_fields: z.record(z.any()), // JSON object for dynamic form configuration
  template_content: z.string(), // Template for document generation
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ServiceTemplate = z.infer<typeof serviceTemplateSchema>;

export const applicationSchema = z.object({
  id: z.number(),
  citizen_id: z.string(),
  service_template_id: z.number(),
  status: applicationStatusSchema,
  form_data: z.record(z.any()), // JSON object for submitted form data
  submitted_documents: z.array(z.number()), // Array of document IDs
  rt_rw_reviewer_id: z.string().nullable(),
  rt_rw_review_notes: z.string().nullable(),
  rt_rw_reviewed_at: z.coerce.date().nullable(),
  village_staff_id: z.string().nullable(),
  village_processing_notes: z.string().nullable(),
  village_processed_at: z.coerce.date().nullable(),
  village_head_id: z.string().nullable(),
  village_head_notes: z.string().nullable(),
  village_head_reviewed_at: z.coerce.date().nullable(),
  document_number: z.string().nullable(),
  generated_document_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Application = z.infer<typeof applicationSchema>;

// Information and Announcement schemas
export const announcementCategorySchema = z.enum(['news', 'event', 'posyandu', 'community_work', 'emergency', 'general']);
export type AnnouncementCategory = z.infer<typeof announcementCategorySchema>;

export const announcementSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  category: announcementCategorySchema,
  author_id: z.string(),
  target_rt: z.string().nullable(), // If null, targets all citizens
  target_rw: z.string().nullable(), // If null, targets all citizens
  is_priority: z.boolean(),
  published_at: z.coerce.date().nullable(),
  event_date: z.coerce.date().nullable(), // For events
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Announcement = z.infer<typeof announcementSchema>;

// Complaint schemas
export const complaintStatusSchema = z.enum(['received', 'under_review', 'resolved', 'closed']);
export type ComplaintStatus = z.infer<typeof complaintStatusSchema>;

export const complaintSchema = z.object({
  id: z.number(),
  citizen_id: z.string().nullable(), // Nullable for anonymous complaints
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  is_anonymous: z.boolean(),
  status: complaintStatusSchema,
  assigned_staff_id: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  resolved_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Complaint = z.infer<typeof complaintSchema>;

export const complaintAttachmentSchema = z.object({
  id: z.number(),
  complaint_id: z.number(),
  file_name: z.string(),
  file_url: z.string(),
  file_type: z.string(),
  file_size: z.number(),
  uploaded_at: z.coerce.date()
});

export type ComplaintAttachment = z.infer<typeof complaintAttachmentSchema>;

// Input schemas for creating/updating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  rt: z.string().nullable(),
  rw: z.string().nullable(),
  address: z.string().nullable(),
  nik: z.string().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone: z.string().nullable().optional(),
  rt: z.string().nullable().optional(),
  rw: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  nik: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const createServiceTemplateInputSchema = z.object({
  name: z.string(),
  service_type: serviceTypeSchema,
  description: z.string(),
  required_documents: z.array(documentTypeSchema),
  form_fields: z.record(z.any()),
  template_content: z.string()
});

export type CreateServiceTemplateInput = z.infer<typeof createServiceTemplateInputSchema>;

export const createApplicationInputSchema = z.object({
  citizen_id: z.string(),
  service_template_id: z.number(),
  form_data: z.record(z.any()),
  submitted_documents: z.array(z.number())
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

export const updateApplicationStatusInputSchema = z.object({
  id: z.number(),
  status: applicationStatusSchema,
  reviewer_id: z.string(),
  notes: z.string().optional()
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusInputSchema>;

export const createAnnouncementInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: announcementCategorySchema,
  author_id: z.string(),
  target_rt: z.string().nullable(),
  target_rw: z.string().nullable(),
  is_priority: z.boolean(),
  event_date: z.coerce.date().nullable()
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementInputSchema>;

export const createComplaintInputSchema = z.object({
  citizen_id: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  is_anonymous: z.boolean()
});

export type CreateComplaintInput = z.infer<typeof createComplaintInputSchema>;

export const updateComplaintStatusInputSchema = z.object({
  id: z.number(),
  status: complaintStatusSchema,
  assigned_staff_id: z.string().nullable(),
  resolution_notes: z.string().nullable()
});

export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusInputSchema>;
