import { NextRequest } from "next/server";
import axios from "axios";
import { getAccessTokenFromServiceAccount } from "@/app/lib/google-auth";

export async function GET(req: NextRequest) {
  const fileUrl = req.nextUrl.searchParams.get("url");

  if (!fileUrl || !fileUrl.startsWith("https://www.googleapis.com/drive/v3/files/")) {
    return new Response("Invalid or missing Google Drive file URL", { status: 400 });
  }

  try {
    const accessToken = await getAccessTokenFromServiceAccount();

    console.log("Access token acquired:", accessToken.slice(0, 20) + "...");

    const imageResponse = await axios.get(fileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "arraybuffer",
    });

    console.log("Fetched image content-type:", imageResponse.headers["content-type"]);

    return new Response(imageResponse.data, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Proxy error:", error?.response?.data || error.message);
    return new Response("Failed to fetch Google Drive image", { status: 500 });
  }
}
