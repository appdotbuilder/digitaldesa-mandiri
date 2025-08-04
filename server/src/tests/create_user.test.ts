
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for citizen user
const testCitizenInput: CreateUserInput = {
  email: 'john.doe@example.com',
  name: 'John Doe',
  phone: '081234567890',
  role: 'citizen',
  rt: '001',
  rw: '005',
  address: 'Jl. Merdeka No. 123',
  nik: '3201234567890123'
};

// Test input for RT/RW head
const testRtRwHeadInput: CreateUserInput = {
  email: 'rtrw.head@village.id',
  name: 'Ahmad Suryanto',
  phone: '081987654321',
  role: 'rt_rw_head',
  rt: '002',
  rw: '003',
  address: 'Jl. Perjuangan No. 45',
  nik: '3201987654321098'
};

// Test input with nullable fields
const testMinimalInput: CreateUserInput = {
  email: 'minimal@example.com',
  name: 'Minimal User',
  phone: null,
  role: 'village_staff',
  rt: null,
  rw: null,
  address: null,
  nik: null
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a citizen user with all fields', async () => {
    const result = await createUser(testCitizenInput);

    // Basic field validation
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('081234567890');
    expect(result.role).toEqual('citizen');
    expect(result.rt).toEqual('001');
    expect(result.rw).toEqual('005');
    expect(result.address).toEqual('Jl. Merdeka No. 123');
    expect(result.nik).toEqual('3201234567890123');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an RT/RW head user', async () => {
    const result = await createUser(testRtRwHeadInput);

    expect(result.email).toEqual('rtrw.head@village.id');
    expect(result.name).toEqual('Ahmad Suryanto');
    expect(result.role).toEqual('rt_rw_head');
    expect(result.rt).toEqual('002');
    expect(result.rw).toEqual('003');
    expect(result.is_active).toBe(true);
  });

  it('should create user with nullable fields set to null', async () => {
    const result = await createUser(testMinimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.name).toEqual('Minimal User');
    expect(result.phone).toBeNull();
    expect(result.role).toEqual('village_staff');
    expect(result.rt).toBeNull();
    expect(result.rw).toBeNull();
    expect(result.address).toBeNull();
    expect(result.nik).toBeNull();
    expect(result.is_active).toBe(true);
  });

  it('should save user to database', async () => {
    const result = await createUser(testCitizenInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].role).toEqual('citizen');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique user IDs', async () => {
    const result1 = await createUser(testCitizenInput);
    
    // Create second user with different email
    const secondInput = {
      ...testRtRwHeadInput,
      email: 'different@example.com'
    };
    const result2 = await createUser(secondInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(typeof result1.id).toBe('string');
    expect(typeof result2.id).toBe('string');
  });

  it('should reject duplicate email addresses', async () => {
    await createUser(testCitizenInput);

    // Try to create another user with same email
    const duplicateInput = {
      ...testRtRwHeadInput,
      email: 'john.doe@example.com' // Same email as first user
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should create users with different roles', async () => {
    const citizenResult = await createUser({
      ...testCitizenInput,
      email: 'citizen@example.com'
    });

    const staffResult = await createUser({
      ...testMinimalInput,
      email: 'staff@example.com',
      role: 'village_staff'
    });

    const headResult = await createUser({
      ...testRtRwHeadInput,
      email: 'head@example.com',
      role: 'village_head'
    });

    expect(citizenResult.role).toEqual('citizen');
    expect(staffResult.role).toEqual('village_staff');
    expect(headResult.role).toEqual('village_head');

    // All should be active by default
    expect(citizenResult.is_active).toBe(true);
    expect(staffResult.is_active).toBe(true);
    expect(headResult.is_active).toBe(true);
  });
});
