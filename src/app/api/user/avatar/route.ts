import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAccessTokenFromServiceAccount } from "@/app/lib/google-auth";
import sharp from "sharp";

// Quota error patterns for Google Drive
const QUOTA_ERRORS = [
  "quotaExceeded",
  "userRateLimitExceeded",
  "rateLimitExceeded",
  "RESOURCE_EXHAUSTED",
  "429",
  "quota",
];

// Image processing constants
const MAX_SIZE = 1024; // Max dimension in pixels
const QUALITY = 80;    // JPEG quality percentage

/**
 * Securely processes and stores an image as Base64 data URL
 * - Converts all formats to JPEG
 * - Resizes images to prevent oversized payloads
 * - Strips EXIF metadata for privacy
 */
const storeImageAsBase64 = async (
  buffer: Buffer,
  originalType: string
): Promise<string> => {
  try {
    // Convert to safe JPEG format
    const processedImage = await sharp(buffer, { failOnError: true })
      .resize(MAX_SIZE, MAX_SIZE, {
        fit: "inside",
        withoutEnlargement: true
      })
      .rotate()  // Auto-orient based on EXIF
      .jpeg({ 
        quality: QUALITY,
        progressive: true,
        mozjpeg: true,
        force: true  // Force JPEG output regardless of input
      })
      .toBuffer();

    return `data:image/jpeg;base64,${processedImage.toString("base64")}`;
  } catch (error) {
    console.error("Image processing failed:", error);
    throw new Error("Image processing failed");
  }
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = formData.get("username") as string;
  const file = formData.get("file") as File;

  if (!file || !username) {
    return NextResponse.json(
      { error: "Missing file or username" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Google Drive upload attempt
    const accessToken = await getAccessTokenFromServiceAccount();

    // Helper: Create/Get Folder
    const getOrCreateFolder = async (name: string, parentId?: string): Promise<string> => {
      const safeName = name.replace(/'/g, "\\'"); // Escape single quotes
      const query = `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId || 'root'}' in parents`;

      const search = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q: query, fields: 'files(id, name)' },
      });

      if (search.data.files.length > 0) return search.data.files[0].id;

      const created = await axios.post(
        "https://www.googleapis.com/drive/v3/files",
        {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId || 'root'],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return created.data.id;
    };

    // Create folder structure
    const parentFolder = await getOrCreateFolder("Avatars");
    const userFolder = await getOrCreateFolder(username, parentFolder);

    // Upload the file using multipart
    const fileMeta = {
      name: file.name,
      parents: [userFolder],
    };

    const boundary = "upload_boundary";
    const multipartBody = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(fileMeta),
      `--${boundary}`,
      `Content-Type: ${file.type}`,
      "",
    ];

    const finalBuffer = Buffer.concat([
      Buffer.from(multipartBody.join("\r\n") + "\r\n"),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const upload = await axios.post(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      finalBuffer,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
      }
    );

    const fileId = upload.data.id;

    // Make file publicly accessible
    await axios.post(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      { role: "reader", type: "anyone" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const avatarUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    return NextResponse.json({ avatarUrl });

  } catch (error: any) {
    // Check for quota errors
    const isQuotaError = QUOTA_ERRORS.some(term => 
      error.message?.includes(term) ||
      error.response?.data?.error?.message?.includes(term)
    );

    if (isQuotaError) {
      try {
        // Fallback to secure local storage
        const avatarUrl = await storeImageAsBase64(buffer, file.type);
        
        return NextResponse.json({ 
          avatarUrl,
          warning: "Google quota exceeded - using secure fallback"
        });
      } catch (fallbackError) {
        console.error("Fallback storage failed:", fallbackError);
        return NextResponse.json(
          { error: "All storage methods failed" },
          { status: 500 }
        );
      }
    }

    // Handle other Google Drive errors
    console.error("Drive upload failed:", error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: "Drive upload failed", 
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}