
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citizenDocumentsTable, usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { uploadCitizenDocument } from '../handlers/upload_citizen_document';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
    email: 'citizen@test.com',
    name: 'Test Citizen',
    phone: '081234567890',
    role: 'citizen',
    rt: '001',
    rw: '002',
    address: 'Jl. Test No. 123',
    nik: '1234567890123456'
};

// Test file data
const testFile = {
    name: 'ktp_document.pdf',
    url: 'https://storage.example.com/documents/ktp_document.pdf',
    size: 1024000
};

describe('uploadCitizenDocument', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let citizenId: string;

    beforeEach(async () => {
        // Create test citizen
        const result = await db.insert(usersTable)
            .values({
                id: 'citizen-123',
                ...testUser,
                is_active: true
            })
            .returning()
            .execute();

        citizenId = result[0].id;
    });

    it('should upload citizen document successfully', async () => {
        const result = await uploadCitizenDocument(citizenId, 'ktp', testFile);

        // Verify returned document
        expect(result.citizen_id).toEqual(citizenId);
        expect(result.document_type).toEqual('ktp');
        expect(result.file_name).toEqual('ktp_document.pdf');
        expect(result.file_url).toEqual('https://storage.example.com/documents/ktp_document.pdf');
        expect(result.file_size).toEqual(1024000);
        expect(result.id).toBeDefined();
        expect(result.uploaded_at).toBeInstanceOf(Date);
    });

    it('should save document to database', async () => {
        const result = await uploadCitizenDocument(citizenId, 'kk', testFile);

        // Query database to verify document was saved
        const documents = await db.select()
            .from(citizenDocumentsTable)
            .where(eq(citizenDocumentsTable.id, result.id))
            .execute();

        expect(documents).toHaveLength(1);
        expect(documents[0].citizen_id).toEqual(citizenId);
        expect(documents[0].document_type).toEqual('kk');
        expect(documents[0].file_name).toEqual('ktp_document.pdf');
        expect(documents[0].file_url).toEqual('https://storage.example.com/documents/ktp_document.pdf');
        expect(documents[0].file_size).toEqual(1024000);
        expect(documents[0].uploaded_at).toBeInstanceOf(Date);
    });

    it('should handle different document types', async () => {
        const documentTypes = ['ktp', 'kk', 'birth_certificate', 'marriage_certificate', 'other'] as const;

        for (const docType of documentTypes) {
            const result = await uploadCitizenDocument(citizenId, docType, {
                ...testFile,
                name: `${docType}_document.pdf`
            });

            expect(result.document_type).toEqual(docType);
            expect(result.file_name).toEqual(`${docType}_document.pdf`);
        }
    });

    it('should throw error when citizen does not exist', async () => {
        const nonExistentCitizenId = 'non-existent-citizen';

        await expect(
            uploadCitizenDocument(nonExistentCitizenId, 'ktp', testFile)
        ).rejects.toThrow(/citizen with id non-existent-citizen not found/i);
    });

    it('should allow multiple documents for same citizen', async () => {
        // Upload KTP document
        const ktpResult = await uploadCitizenDocument(citizenId, 'ktp', {
            ...testFile,
            name: 'ktp.pdf'
        });

        // Upload KK document
        const kkResult = await uploadCitizenDocument(citizenId, 'kk', {
            ...testFile,
            name: 'kk.pdf'
        });

        // Verify both documents exist in database
        const documents = await db.select()
            .from(citizenDocumentsTable)
            .where(eq(citizenDocumentsTable.citizen_id, citizenId))
            .execute();

        expect(documents).toHaveLength(2);
        expect(documents.some(doc => doc.id === ktpResult.id)).toBe(true);
        expect(documents.some(doc => doc.id === kkResult.id)).toBe(true);
        expect(documents.some(doc => doc.document_type === 'ktp')).toBe(true);
        expect(documents.some(doc => doc.document_type === 'kk')).toBe(true);
    });
});
