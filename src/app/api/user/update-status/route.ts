// app/api/user/update-status/route.ts
import { updateUserStatus } from "@/app/lib/session";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { username, status } = body;

    if (!username || status === undefined) {
      return NextResponse.json(
        { message: "Username and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (![0, 1, 2].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value. Must be 0 (active), 1 (pending), or 2 (inactive)" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserStatus(username, status);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}