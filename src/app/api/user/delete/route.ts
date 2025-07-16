// app/api/user/delete/route.ts
import { deleteUser } from "@/app/lib/session";

export async function DELETE(req: Request) {
  const body = await req.json();
  const { username } = body;

  if (!username) {
    return new Response(JSON.stringify({ message: "Username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await deleteUser(username);
    return new Response(JSON.stringify({ message: "User deleted successfully" }), {
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
