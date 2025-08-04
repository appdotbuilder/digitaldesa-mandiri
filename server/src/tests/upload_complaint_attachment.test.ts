
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { complaintsTable, complaintAttachmentsTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { uploadComplaintAttachment } from '../handlers/upload_complaint_attachment';

// Test data
const testUser = {
    id: 'test-user-123',
    email: 'citizen@test.com',
    name: 'Test Citizen',
    phone: '081234567890',
    role: 'citizen' as const,
    rt: '001',
    rw: '002',
    address: 'Test Address',
    nik: '1234567890123456',
    is_active: true
};

const testComplaint = {
    citizen_id: testUser.id,
    title: 'Test Complaint',
    description: 'This is a test complaint',
    location: 'Test Location',
    is_anonymous: false,
    status: 'received' as const
};

const testFile = {
    name: 'complaint_photo.jpg',
    url: 'https://storage.example.com/complaints/complaint_photo.jpg',
    type: 'image/jpeg',
    size: 1024000
};

describe('uploadComplaintAttachment', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should upload attachment for existing complaint', async () => {
        // Create prerequisite user
        await db.insert(usersTable).values(testUser).execute();

        // Create complaint
        const complaintResult = await db.insert(complaintsTable)
            .values(testComplaint)
            .returning()
            .execute();
        const complaint = complaintResult[0];

        // Upload attachment
        const result = await uploadComplaintAttachment(complaint.id, testFile);

        // Verify basic fields
        expect(result.complaint_id).toEqual(complaint.id);
        expect(result.file_name).toEqual('complaint_photo.jpg');
        expect(result.file_url).toEqual('https://storage.example.com/complaints/complaint_photo.jpg');
        expect(result.file_type).toEqual('image/jpeg');
        expect(result.file_size).toEqual(1024000);
        expect(result.id).toBeDefined();
        expect(result.uploaded_at).toBeInstanceOf(Date);
    });

    it('should save attachment to database', async () => {
        // Create prerequisite user
        await db.insert(usersTable).values(testUser).execute();

        // Create complaint
        const complaintResult = await db.insert(complaintsTable)
            .values(testComplaint)
            .returning()
            .execute();
        const complaint = complaintResult[0];

        // Upload attachment
        const result = await uploadComplaintAttachment(complaint.id, testFile);

        // Query database to verify attachment was saved
        const attachments = await db.select()
            .from(complaintAttachmentsTable)
            .where(eq(complaintAttachmentsTable.id, result.id))
            .execute();

        expect(attachments).toHaveLength(1);
        expect(attachments[0].complaint_id).toEqual(complaint.id);
        expect(attachments[0].file_name).toEqual('complaint_photo.jpg');
        expect(attachments[0].file_url).toEqual('https://storage.example.com/complaints/complaint_photo.jpg');
        expect(attachments[0].file_type).toEqual('image/jpeg');
        expect(attachments[0].file_size).toEqual(1024000);
        expect(attachments[0].uploaded_at).toBeInstanceOf(Date);
    });

    it('should handle multiple attachments for same complaint', async () => {
        // Create prerequisite user
        await db.insert(usersTable).values(testUser).execute();

        // Create complaint
        const complaintResult = await db.insert(complaintsTable)
            .values(testComplaint)
            .returning()
            .execute();
        const complaint = complaintResult[0];

        // Upload first attachment
        const file1 = { ...testFile, name: 'photo1.jpg', url: 'https://storage.example.com/photo1.jpg' };
        const result1 = await uploadComplaintAttachment(complaint.id, file1);

        // Upload second attachment
        const file2 = { ...testFile, name: 'photo2.jpg', url: 'https://storage.example.com/photo2.jpg', type: 'image/png' };
        const result2 = await uploadComplaintAttachment(complaint.id, file2);

        // Verify both attachments exist
        const attachments = await db.select()
            .from(complaintAttachmentsTable)
            .where(eq(complaintAttachmentsTable.complaint_id, complaint.id))
            .execute();

        expect(attachments).toHaveLength(2);
        expect(attachments.map(a => a.file_name)).toEqual(expect.arrayContaining(['photo1.jpg', 'photo2.jpg']));
        expect(attachments.map(a => a.id)).toEqual(expect.arrayContaining([result1.id, result2.id]));
    });

    it('should reject upload for non-existent complaint', async () => {
        const nonExistentComplaintId = 999999;

        await expect(uploadComplaintAttachment(nonExistentComplaintId, testFile))
            .rejects.toThrow(/complaint with id 999999 not found/i);
    });

    it('should handle different file types', async () => {
        // Create prerequisite user
        await db.insert(usersTable).values(testUser).execute();

        // Create complaint
        const complaintResult = await db.insert(complaintsTable)
            .values(testComplaint)
            .returning()
            .execute();
        const complaint = complaintResult[0];

        // Test video file
        const videoFile = {
            name: 'complaint_video.mp4',
            url: 'https://storage.example.com/complaints/complaint_video.mp4',
            type: 'video/mp4',
            size: 5242880 // 5MB
        };

        const result = await uploadComplaintAttachment(complaint.id, videoFile);

        expect(result.file_name).toEqual('complaint_video.mp4');
        expect(result.file_type).toEqual('video/mp4');
        expect(result.file_size).toEqual(5242880);
        expect(result.complaint_id).toEqual(complaint.id);
    });
});
