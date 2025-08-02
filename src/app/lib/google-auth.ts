import { createSign } from "crypto";
import crypto from "crypto";
import axios from "axios";
import { User } from "@/types/users";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secretKey = process.env.NEXTAUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function createToken(username: string): Promise<string> {
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(encodedKey);
}

// Helper: Base64 URL encoding
function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAccessToken(): Promise<string> {
  if (!process.env.CREDIT) throw new Error("Missing CREDIT env variable");

  const credit = JSON.parse(process.env.CREDIT);

  const privateKey = credit.private_key;
  const clientEmail = credit.client_email;
  const tokenUri = credit.token_uri;

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;

  // Use crypto to sign the JWT
  const signer = createSign("RSA-SHA256");
  signer.update(toSign);
  const signature = signer.sign(privateKey);
  const jwt = `${toSign}.${base64url(signature)}`;

  // Exchange JWT for Access Token
  const { data } = await axios.post(
    tokenUri,
    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return data.access_token;
}


export async function getAccessTokenFromRefreshToken(): Promise<string> {
    const CLIENT_ID = process.env.CLIENT_ID!;
    const CLIENT_SECRET = process.env.CLIENT_SECRET!;
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN!;
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token',
        },
    });

  return response.data.access_token;
}


export async function getOrCreateFolder(accessToken: string, name: string, parentId='1ow4eYyEAemazygDV28s_bMVJTtXeprnW'): Promise<string> {
    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId || 'root'}' in parents`;

    const search = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: query, fields: 'files(id, name)' },
    });

    if (search.data.files.length > 0) return search.data.files[0].id;

    const created = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
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

const LOG_FILE_NAME = 'users.json';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

type SafeUser = Omit<User, "password">;

export async function authenticateUserdata(
    accessToken: string,
    username: string,
    password: string
  ): Promise<{ user: SafeUser; token: string }> {
    try {
      const userDataFolderId = await getOrCreateFolder(accessToken, "user-data");
  
      const query = `name='${LOG_FILE_NAME}' and trashed=false and '${userDataFolderId}' in parents`;
  
      const searchResponse = await axios.get(
        "https://www.googleapis.com/drive/v3/files",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            fields: "files(id, name)",
          },
        }
      );
  
      const fileId = searchResponse.data.files?.[0]?.id;
      if (!fileId) {
        console.error("File not found. Search result:", searchResponse.data.files);
        throw new Error("User database not found");
      }
  
      const downloadResponse = await axios.get(
        `${GOOGLE_DRIVE_API_URL}/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      const users: any[] = Array.isArray(downloadResponse.data)
        ? downloadResponse.data
        : [downloadResponse.data];
  
      const user = users.find((user) => user.username === username);
      if (!user) throw new Error("User not found");
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error("Invalid password");
  
      const token = await createToken(username);
      const { password: _, ...safeUser } = user;
  
      return {
        user: safeUser,
        token,
      };
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
}  

export async function getAccessTokenFromServiceAccount() {
    const now = Math.floor(Date.now() / 1000);
  
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  
    if (!privateKey || !clientEmail) {
      throw new Error("Missing Google service account credentials");
    }
  
    const header = {
      alg: "RS256",
      typ: "JWT",
    };
  
    const payload = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
  
    const base64url = (input: string) =>
      Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
  
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const toSign = `${encodedHeader}.${encodedPayload}`;
  
    const signOptions = {
      key: privateKey,
    };
  
    const signature = crypto
      .sign("RSA-SHA256", Buffer.from(toSign), signOptions)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  
    const jwt = `${toSign}.${signature}`;
  
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    });
  
    return response.data.access_token as string;
  }