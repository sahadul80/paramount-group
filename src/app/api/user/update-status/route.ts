import { readUsersFile, writeUsersFile } from '@/app/lib/user-data';
import { User } from '@/types/users';

type SafeUser = Omit<User, 'password'>;

export async function PUT(req: Request) {
  const body = await req.json();
  const { username, status } = body;

  if (!username || status === undefined) {
    return new Response(
      JSON.stringify({ message: "Username and status are required" }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate status value
  if (![0, 1, 2, 3, 4, 5].includes(status)) {
    return new Response(
      JSON.stringify({ 
        message: "Invalid status value. Must be 0 (inactive), 1 (pending), 2 (active), 3 (away), 4. (offline), or 5 (online)" 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const updatedUser = await updateUserStatus(username, status);
    return new Response(
      JSON.stringify(updatedUser),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return new Response(
      JSON.stringify({ message: error.message }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function updateUserStatus(
  username: string,
  status: number
): Promise<SafeUser> {
  try {
    const users = await readUsersFile();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // Update only the status field
    const updatedUser = {
      ...users[userIndex],
      status
    };

    users[userIndex] = updatedUser;
    await writeUsersFile(users);

    // Return updated user without password
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}