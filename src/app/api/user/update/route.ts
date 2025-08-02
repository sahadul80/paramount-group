// app/api/user/update/route.ts
import { readUsersFile, writeUsersFile, } from '@/app/lib/user-data';
import { User } from '@/types/users';
import bcrypt from 'bcryptjs';


export async function PUT(req: Request) {
  const body = await req.json();
  const { username, ...updateData } = body;

  if (!username) {
    return new Response(JSON.stringify({ message: "Username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updatedUser = await updateUser(username, updateData);
    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const status = error.message.includes("not found") ? 404 : 500;
    return new Response(JSON.stringify({ message: error.message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

type SafeUser = Omit<User, 'password'>;

type UpdateUserData = Partial<Omit<User, 'username' | 'createdAt' | 'status' | 'role'>>;

async function updateUser(
  username: string,
  updateData: UpdateUserData
): Promise<SafeUser> {
  try {
    const users = await readUsersFile();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // Handle password update
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update user fields while preserving existing values
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      // Preserve these fields from being updated
      username: users[userIndex].username,
      role: users[userIndex].role,
      status: users[userIndex].status,
      createdAt: users[userIndex].createdAt
    };

    users[userIndex] = updatedUser;
    await writeUsersFile(users);

    // Return updated user without password
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}