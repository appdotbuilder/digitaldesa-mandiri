
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<string> => {
  const testUser: CreateUserInput = {
    email: 'test@example.com',
    name: 'Test User',
    phone: '081234567890',
    role: 'citizen',
    rt: '001',
    rw: '002',
    address: 'Test Address',
    nik: '1234567890123456'
  };

  const result = await db.insert(usersTable)
    .values({
      id: 'test-user-id',
      ...testUser,
      is_active: true
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user profile with all fields', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name',
      phone: '087654321098',
      rt: '003',
      rw: '004',
      address: 'Updated Address',
      nik: '9876543210987654'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('Updated Name');
    expect(result.phone).toEqual('087654321098');
    expect(result.rt).toEqual('003');
    expect(result.rw).toEqual('004');
    expect(result.address).toEqual('Updated Address');
    expect(result.nik).toEqual('9876543210987654');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('citizen'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user profile with partial fields', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Partially Updated Name',
      address: 'Partially Updated Address'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.address).toEqual('Partially Updated Address');
    expect(result.phone).toEqual('081234567890'); // Should remain unchanged
    expect(result.rt).toEqual('001'); // Should remain unchanged
    expect(result.rw).toEqual('002'); // Should remain unchanged
    expect(result.nik).toEqual('1234567890123456'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      phone: null,
      address: null,
      nik: null
    };

    const result = await updateUserProfile(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.nik).toBeNull();
    expect(result.name).toEqual('Test User'); // Should remain unchanged
    expect(result.rt).toEqual('001'); // Should remain unchanged
    expect(result.rw).toEqual('002'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Database Updated Name',
      phone: '081999888777'
    };

    await updateUserProfile(updateInput);

    // Verify changes are persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Database Updated Name');
    expect(users[0].phone).toEqual('081999888777');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 'non-existent-id',
      name: 'New Name'
    };

    await expect(updateUserProfile(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const userId = await createTestUser();
    
    // Get initial timestamp
    const initialUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    const initialTimestamp = initialUser[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Timestamp Test'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialTimestamp.getTime());
  });
});
