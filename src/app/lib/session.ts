"use server";

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { User } from "@/types/users";

const secretKey = process.env.NEXTAUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

// Path to users.json file
const usersFilePath = path.resolve("public/users/users.json");

type SafeUser = Omit<User, "password">;

type UpdateUserData = {
  avatar?: string;
  dob?: string;
  address?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  nationality?: string;
  salary?: string;
  password?: string;
};

// Helper function to read users file
async function readUsersFile(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersFilePath, "utf8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

// Helper function to write users to file
async function writeUsersFile(users: User[]): Promise<void> {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
}

// Create a JWT token for a user
export async function createToken(username: string): Promise<string> {
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(encodedKey);
}

// Create a new user with extended fields
type NewUser = {
  username: string;
  email: string;
  role: string;
  password: string;
  status: number;
};

export async function createUser({
  username,
  email,
  role,
  password,
  status = 1
}: NewUser): Promise<void> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const users = await readUsersFile();

    // Check if username or email already exists
    const existingUser = users.find(
      (user) => user.username === username || user.email === email
    );
    if (existingUser) {
      throw new Error("Username or email already exists");
    }

    // Add new user with extended fields
    users.push({
      username,
      email,
      role,
      password: hashedPassword,
      status,
      createdAt: new Date().toISOString()
    });

    await writeUsersFile(users);
    console.log("User created successfully");
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Update user information
export async function updateUser(
  username: string,
  updateData: UpdateUserData
): Promise<SafeUser> {
  try {
    const users = await readUsersFile();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // Update user fields
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      // Preserve password and other fields not being updated
      password: users[userIndex].password,
      username: users[userIndex].username,
      role: users[userIndex].role,
      status: users[userIndex].status,
      createdAt: users[userIndex].createdAt
    };

    await writeUsersFile(users);
    console.log("User updated successfully");

    // Return updated user without password
    const { password, ...safeUser } = users[userIndex];
    return safeUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Update only user status
export async function updateUserStatus(
  username: string,
  newStatus: number
): Promise<SafeUser> {
  try {
    const users = await readUsersFile();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // Update only the status
    users[userIndex].status = newStatus;

    await writeUsersFile(users);
    console.log("User status updated successfully");

    // Return updated user without password
    const { password, ...safeUser } = users[userIndex];
    return safeUser;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

// Delete a user
export async function deleteUser(username: string): Promise<void> {
  try {
    let users = await readUsersFile();
    const initialLength = users.length;
    
    // Filter out the user to delete
    users = users.filter(user => user.username !== username);
    
    if (users.length === initialLength) {
      throw new Error("User not found");
    }

    await writeUsersFile(users);
    console.log("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Authenticate a user and return token if valid and approved
export async function authenticateUser(
  username: string,
  password: string
): Promise<{ user: SafeUser; token: string }> {
  try {
    const users = await readUsersFile();
    const user = users.find(user => user.username === username);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (user.status === 1) {
      throw new Error("Waiting for approval, you can log in once you are accepted");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = await createToken(username);
    
    // Return user data without password
    const { password: _, ...safeUser } = user;
    return { 
      user: safeUser, 
      token 
    };
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
}

// Get all users (without sensitive data)
export async function getUsers(): Promise<SafeUser[]> {
  try {
    const users = await readUsersFile();
    // Return users without password field and with all extended fields
    return users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

// Get a single user by username (without sensitive data)
export async function getUser(username: string): Promise<SafeUser | null> {
  try {
    const users = await readUsersFile();
    const user = users.find(u => u.username === username);
    
    if (!user) return null;
    
    // Return user without password field
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export async function logOut(username: string): Promise<void> {
  try {
    const users = await readUsersFile();
    updateUserStatus(username, 4);
  } catch (error) {
    console.error("Error Logging Out!", error);
    throw error;
  }
}