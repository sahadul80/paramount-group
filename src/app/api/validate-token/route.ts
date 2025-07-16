// app/api/validate-token/route.ts
import { jwtVerify } from "jose";

export async function POST(req: Request) {
  const { user } = await req.json();
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ valid: false }), { status: 401 });
  }
  
  const token = authHeader.split(" ")[1];
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return new Response(JSON.stringify({ 
      valid: payload.username === user 
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ valid: false }), { status: 401 });
  }
}