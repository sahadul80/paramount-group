import { readUsersFile, writeUsersFile } from '@/app/lib/user-data';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { username, usernames } = body;

    // Validate input
    if (!username && !usernames) {
      return NextResponse.json(
        { message: "Username or list of usernames is required" },
        { status: 400 }
      );
    }

    // Handle both single and multiple deletion
    const usersToDelete = username ? [username] : usernames;
    
    if (!Array.isArray(usersToDelete)) {
      return NextResponse.json(
        { message: "Invalid input format for usernames" },
        { status: 400 }
      );
    }

    if (usersToDelete.length === 0) {
      return NextResponse.json(
        { message: "No users specified for deletion" },
        { status: 400 }
      );
    }

    // Perform deletion
    const result = await deleteUsers(usersToDelete);
    
    return NextResponse.json(
      { 
        message: `Successfully deleted ${result.deletedCount} user(s)`,
        deletedUsers: result.deletedUsers
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user(s):", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteUsers(usernames: string[]): Promise<{ 
  deletedCount: number; 
  deletedUsers: string[] 
}> {
  try {
    const users = await readUsersFile();
    const initialCount = users.length;
    
    // Filter out users to delete
    const filteredUsers = users.filter(user => !usernames.includes(user.username));
    
    // Get list of actually deleted users
    const deletedUsers = users
      .filter(user => usernames.includes(user.username))
      .map(user => user.username);
    
    const deletedCount = initialCount - filteredUsers.length;
    
    // Check if any users were found to delete
    if (deletedCount === 0) {
      throw new Error("No matching users found for deletion");
    }
    
    // Save updated user list
    await writeUsersFile(filteredUsers);
    
    return {
      deletedCount,
      deletedUsers
    };
  } catch (error) {
    console.error("Error in deleteUsers:", error);
    throw new Error("Failed to delete users");
  }
}