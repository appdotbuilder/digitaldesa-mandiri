
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build update object with only defined fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.rt !== undefined) {
      updateData.rt = input.rt;
    }
    if (input.rw !== undefined) {
      updateData.rw = input.rw;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.nik !== undefined) {
      updateData.nik = input.nik;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    // Update user profile
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};
