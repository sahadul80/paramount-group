import { authenticateUserdata, getAccessTokenFromServiceAccount } from "@/app/lib/google-auth";

export async function POST(req: Request) {
    const body = await req.json();

    try {
        const accessToken = await getAccessTokenFromServiceAccount();
        // Authenticate user and get token
        const { user, token } = await authenticateUserdata(accessToken, body.username, body.password);
        
        return new Response(
            JSON.stringify({ 
                message: "Login successful", 
                username: user.username,
                role: user.role,
                status: user.status,
                token
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        let status = 401;
        let message = "Invalid username or password";
        
        // Handle specific error cases
        if (error.message === "User not found" || error.message === "Invalid password") {
            status = 401;
            message = error.message;
        } else {
            status = 500;
            message = "An unexpected error occurred";
            console.error("Login error:", error);
        }
        
        return new Response(
            JSON.stringify({ message }),
            { status, headers: { "Content-Type": "application/json" } }
        );
    }
}