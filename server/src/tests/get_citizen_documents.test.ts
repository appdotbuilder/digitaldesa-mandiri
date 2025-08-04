
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, citizenDocumentsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getCitizenDocuments } from '../handlers/get_citizen_documents';

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

describe('getCitizenDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when citizen has no documents', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-citizen-id',
        ...testUser
      })
      .returning()
      .execute();

    const result = await getCitizenDocuments('test-citizen-id');

    expect(result).toEqual([]);
  });

  it('should return all documents for a citizen', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        id: 'test-citizen-id',
        ...testUser
      })
      .execute();

    // Create test documents
    const documentsData = [
      {
        citizen_id: 'test-citizen-id',
        document_type: 'ktp' as const,
        file_name: 'ktp.pdf',
        file_url: 'https://example.com/ktp.pdf',
        file_size: 1024
      },
      {
        citizen_id: 'test-citizen-id',
        document_type: 'kk' as const,
        file_name: 'kk.pdf',
        file_url: 'https://example.com/kk.pdf',
        file_size: 2048
      }
    ];

    await db.insert(citizenDocumentsTable)
      .values(documentsData)
      .execute();

    const result = await getCitizenDocuments('test-citizen-id');

    expect(result).toHaveLength(2);
    expect(result[0].citizen_id).toEqual('test-citizen-id');
    expect(result[0].document_type).toEqual('ktp');
    expect(result[0].file_name).toEqual('ktp.pdf');
    expect(result[0].file_url).toEqual('https://example.com/ktp.pdf');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].id).toBeDefined();
    expect(result[0].uploaded_at).toBeInstanceOf(Date);

    expect(result[1].citizen_id).toEqual('test-citizen-id');
    expect(result[1].document_type).toEqual('kk');
    expect(result[1].file_name).toEqual('kk.pdf');
    expect(result[1].file_url).toEqual('https://example.com/kk.pdf');
    expect(result[1].file_size).toEqual(2048);
    expect(result[1].id).toBeDefined();
    expect(result[1].uploaded_at).toBeInstanceOf(Date);
  });

  it('should only return documents for the specified citizen', async () => {
    // Create two users
    await db.insert(usersTable)
      .values([
        {
          id: 'citizen-1',
          ...testUser,
          email: 'citizen1@test.com'
        },
        {
          id: 'citizen-2',
          ...testUser,
          email: 'citizen2@test.com',
          name: 'Other Citizen'
        }
      ])
      .execute();

    // Create documents for both citizens
    await db.insert(citizenDocumentsTable)
      .values([
        {
          citizen_id: 'citizen-1',
          document_type: 'ktp' as const,
          file_name: 'citizen1-ktp.pdf',
          file_url: 'https://example.com/citizen1-ktp.pdf',
          file_size: 1024
        },
        {
          citizen_id: 'citizen-2',
          document_type: 'kk' as const,
          file_name: 'citizen2-kk.pdf',
          file_url: 'https://example.com/citizen2-kk.pdf',
          file_size: 2048
        }
      ])
      .execute();

    const result = await getCitizenDocuments('citizen-1');

    expect(result).toHaveLength(1);
    expect(result[0].citizen_id).toEqual('citizen-1');
    expect(result[0].file_name).toEqual('citizen1-ktp.pdf');
  });

  it('should return documents ordered by upload date', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        id: 'test-citizen-id',
        ...testUser
      })
      .execute();

    // Create documents with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour earlier

    await db.insert(citizenDocumentsTable)
      .values([
        {
          citizen_id: 'test-citizen-id',
          document_type: 'ktp' as const,
          file_name: 'newer.pdf',
          file_url: 'https://example.com/newer.pdf',
          file_size: 1024
        },
        {
          citizen_id: 'test-citizen-id',
          document_type: 'kk' as const,
          file_name: 'older.pdf',
          file_url: 'https://example.com/older.pdf',
          file_size: 2048
        }
      ])
      .execute();

    const result = await getCitizenDocuments('test-citizen-id');

    expect(result).toHaveLength(2);
    // Should return documents in the order they were inserted/uploaded
    result.forEach(doc => {
      expect(doc.uploaded_at).toBeInstanceOf(Date);
    });
  });
});
