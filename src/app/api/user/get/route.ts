import { readUsersFile } from "@/app/lib/user-data";
import { User } from "@/types/users";

type SafeUser = Omit<User, 'password'>;

export async function getUser(username: string): Promise<SafeUser | null> {
  try {
    const users = await readUsersFile();
    const user = users.find(u => u.username === username);
    
    if (!user) return null;
    
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error("Error getting user:", error);
    throw new Error("Failed to fetch user");
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { username } = body;

  if (!username) {
    return new Response(JSON.stringify({ message: "Username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const user = await getUser(username);
    
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify(user), {
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