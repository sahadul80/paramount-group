import { createUser } from "@/app/lib/session";

export async function POST(req: Request) {
    const body = await req.json();
    const { username, email, role, password, confirmPassword } = body;

    // Basic validation
    if (!username || !email || !role || !password || !confirmPassword) {
        return new Response(
            JSON.stringify({ message: "All fields are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    if (password !== confirmPassword) {
        return new Response(
            JSON.stringify({ message: "Passwords do not match" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    try {
        // Create the user
        await createUser({
            username,
            email,
            role,
            password,
            status: 2
        });

        return new Response(JSON.stringify({ message: "User created successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({ message: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
