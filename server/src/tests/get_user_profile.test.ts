
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUserProfile } from '../handlers/get_user_profile';

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create test user
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      phone: '08123456789',
      role: 'citizen' as const,
      rt: '001',
      rw: '002',
      address: 'Jl. Test No. 123',
      nik: '1234567890123456',
      is_active: true
    };

    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUserProfile('test-user-123');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('test-user-123');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.phone).toEqual('08123456789');
    expect(result!.role).toEqual('citizen');
    expect(result!.rt).toEqual('001');
    expect(result!.rw).toEqual('002');
    expect(result!.address).toEqual('Jl. Test No. 123');
    expect(result!.nik).toEqual('1234567890123456');
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUserProfile('non-existent-user');

    expect(result).toBeNull();
  });

  it('should handle user with null values', async () => {
    // Create test user with minimal required fields
    const testUser = {
      id: 'minimal-user-123',
      email: 'minimal@example.com',
      name: 'Minimal User',
      phone: null,
      role: 'village_staff' as const,
      rt: null,
      rw: null,
      address: null,
      nik: null,
      is_active: false
    };

    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getUserProfile('minimal-user-123');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('minimal-user-123');
    expect(result!.email).toEqual('minimal@example.com');
    expect(result!.name).toEqual('Minimal User');
    expect(result!.phone).toBeNull();
    expect(result!.role).toEqual('village_staff');
    expect(result!.rt).toBeNull();
    expect(result!.rw).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.nik).toBeNull();
    expect(result!.is_active).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different user roles correctly', async () => {
    const roles = ['citizen', 'rt_rw_head', 'village_staff', 'village_head'] as const;

    for (const role of roles) {
      const testUser = {
        id: `test-${role}-123`,
        email: `${role}@example.com`,
        name: `Test ${role}`,
        phone: '08123456789',
        role,
        rt: '001',
        rw: '002',
        address: 'Test Address',
        nik: '1234567890123456',
        is_active: true
      };

      await db.insert(usersTable)
        .values(testUser)
        .execute();

      const result = await getUserProfile(`test-${role}-123`);

      expect(result).not.toBeNull();
      expect(result!.role).toEqual(role);
      expect(result!.email).toEqual(`${role}@example.com`);
    }
  });
});
