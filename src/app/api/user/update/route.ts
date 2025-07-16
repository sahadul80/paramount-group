// app/api/user/update/route.ts
import { updateUser } from "@/app/lib/session";

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
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}