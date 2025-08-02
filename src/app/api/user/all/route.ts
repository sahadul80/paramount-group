import { readUsersFile } from "@/app/lib/user-data";
import { User } from "@/types/users";

type SafeUser = Omit<User, 'password'>;

export async function getUsers(): Promise<SafeUser[]> {
  try {
    const users = await readUsersFile();
    return users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function GET() {
  try {
    const users = await getUsers();
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const status = error.message.includes("Failed to fetch") ? 503 : 500;
    return new Response(JSON.stringify({ message: error.message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}