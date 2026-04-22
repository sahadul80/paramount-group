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

    // Safely extract content-type as a string
    let contentType = "image/jpeg"; // fallback
    const rawContentType = imageResponse.headers["content-type"];
    if (typeof rawContentType === "string") {
      contentType = rawContentType;
    } else if (Array.isArray(rawContentType) && rawContentType.length > 0) {
      contentType = rawContentType[0];
    } else if (rawContentType && typeof rawContentType === "object") {
      // In case it's an AxiosHeaders object with a get method
      const maybeString = (rawContentType as any).get?.("content-type") || (rawContentType as any).toString?.();
      if (typeof maybeString === "string") contentType = maybeString;
    }

    return new Response(imageResponse.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Proxy error:", error?.response?.data || error.message);
    return new Response("Failed to fetch Google Drive image", { status: 500 });
  }
}