import { getAccessTokenFromRefreshToken, getAccessTokenFromServiceAccount, getOrCreateFolder } from '@/app/lib/google-auth';
import axios from 'axios';
import bcrypt from 'bcryptjs';

const LOG_FILE_NAME = 'users.json';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

export async function POST(req: Request) {
  const body = await req.json();
  const { username, email, role, password, status } = body;

  try {

    const accessToken = await getAccessTokenFromServiceAccount();

    const userDataFolderId = await getOrCreateFolder(accessToken, "user-data");

    const searchResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}?q=name='${LOG_FILE_NAME}' and '${userDataFolderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    let fileId = searchResponse.data.files?.[0]?.id;
    let users: any[] = [];

    if (fileId) {
      const downloadResponse = await axios.get(
        `${GOOGLE_DRIVE_API_URL}/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (Array.isArray(downloadResponse.data)) {
        users = downloadResponse.data;
      } else if (typeof downloadResponse.data === 'object') {
        users = [downloadResponse.data];
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      role,
      password: hashedPassword,
      status,
      createdAt: new Date().toISOString(),
    };

    const updatedLogs = [newUser, ...users];
    const jsonData = JSON.stringify(updatedLogs, null, 2);

    if (fileId) {
      await axios.patch(
        `${GOOGLE_DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`,
        jsonData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      const boundary = 'boundary_string';
      const multipartBody = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({
          name: LOG_FILE_NAME,
          parents: [userDataFolderId],
          mimeType: 'application/json',
        }),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        jsonData,
        `--${boundary}--`,
      ].join('\r\n');

      await axios.post(
        `${GOOGLE_DRIVE_UPLOAD_URL}?uploadType=multipart`,
        multipartBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Logged to Google Drive successfully',
        loggedData: newUser,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Google Drive error:', error.response?.data || error.message);
    return new Response(
      JSON.stringify({
        error: 'Google Drive operation failed',
        details: error.response?.data || error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
