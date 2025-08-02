import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getAccessTokenFromRefreshToken, getAccessTokenFromServiceAccount } from "@/app/lib/google-auth";

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

  try {
    const accessToken = await getAccessTokenFromServiceAccount();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Helper: Create/Get Folder
    const getOrCreateFolder = async (name: string, parentId?: string): Promise<string> => {
      const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId || 'root'}' in parents`;

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
    console.error("Avatar upload failed:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Avatar upload failed", details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
