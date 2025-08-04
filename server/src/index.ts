
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createServiceTemplateInputSchema,
  createApplicationInputSchema,
  updateApplicationStatusInputSchema,
  createAnnouncementInputSchema,
  createComplaintInputSchema,
  updateComplaintStatusInputSchema,
  documentTypeSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { uploadCitizenDocument } from './handlers/upload_citizen_document';
import { getCitizenDocuments } from './handlers/get_citizen_documents';
import { createServiceTemplate } from './handlers/create_service_template';
import { getServiceTemplates } from './handlers/get_service_templates';
import { createApplication } from './handlers/create_application';
import { getApplications } from './handlers/get_applications';
import { updateApplicationStatus } from './handlers/update_application_status';
import { generateApplicationDocument } from './handlers/generate_application_document';
import { createAnnouncement } from './handlers/create_announcement';
import { getAnnouncements } from './handlers/get_announcements';
import { publishAnnouncement } from './handlers/publish_announcement';
import { createComplaint } from './handlers/create_complaint';
import { getComplaints } from './handlers/get_complaints';
import { updateComplaintStatus } from './handlers/update_complaint_status';
import { uploadComplaintAttachment } from './handlers/upload_complaint_attachment';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUserProfile: publicProcedure
    .input(z.string())
    .query(({ input }) => getUserProfile(input)),
  
  updateUserProfile: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),

  // Document management
  uploadCitizenDocument: publicProcedure
    .input(z.object({
      citizenId: z.string(),
      documentType: documentTypeSchema,
      file: z.object({
        name: z.string(),
        url: z.string(),
        size: z.number()
      })
    }))
    .mutation(({ input }) => uploadCitizenDocument(input.citizenId, input.documentType, input.file)),
  
  getCitizenDocuments: publicProcedure
    .input(z.string())
    .query(({ input }) => getCitizenDocuments(input)),

  // Service templates
  createServiceTemplate: publicProcedure
    .input(createServiceTemplateInputSchema)
    .mutation(({ input }) => createServiceTemplate(input)),
  
  getServiceTemplates: publicProcedure
    .query(() => getServiceTemplates()),

  // Applications
  createApplication: publicProcedure
    .input(createApplicationInputSchema)
    .mutation(({ input }) => createApplication(input)),
  
  getApplications: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.string()
    }))
    .query(({ input }) => getApplications(input.userId, input.role)),
  
  updateApplicationStatus: publicProcedure
    .input(updateApplicationStatusInputSchema)
    .mutation(({ input }) => updateApplicationStatus(input)),
  
  generateApplicationDocument: publicProcedure
    .input(z.number())
    .mutation(({ input }) => generateApplicationDocument(input)),

  // Announcements
  createAnnouncement: publicProcedure
    .input(createAnnouncementInputSchema)
    .mutation(({ input }) => createAnnouncement(input)),
  
  getAnnouncements: publicProcedure
    .input(z.object({
      userId: z.string(),
      rt: z.string().optional(),
      rw: z.string().optional()
    }))
    .query(({ input }) => getAnnouncements(input.userId, input.rt, input.rw)),
  
  publishAnnouncement: publicProcedure
    .input(z.number())
    .mutation(({ input }) => publishAnnouncement(input)),

  // Complaints
  createComplaint: publicProcedure
    .input(createComplaintInputSchema)
    .mutation(({ input }) => createComplaint(input)),
  
  getComplaints: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.string()
    }))
    .query(({ input }) => getComplaints(input.userId, input.role)),
  
  updateComplaintStatus: publicProcedure
    .input(updateComplaintStatusInputSchema)
    .mutation(({ input }) => updateComplaintStatus(input)),
  
  uploadComplaintAttachment: publicProcedure
    .input(z.object({
      complaintId: z.number(),
      file: z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number()
      })
    }))
    .mutation(({ input }) => uploadComplaintAttachment(input.complaintId, input.file))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`DigitalDesa Mandiri TRPC server listening at port: ${port}`);
}

start();
