import { getAccessTokenFromServiceAccount, getOrCreateFolder } from '@/app/lib/google-auth';
import axios from 'axios';

const LOG_FILE_NAME = 'users.json';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

const accessToken = await getAccessTokenFromServiceAccount();
const userDataFolderId = await getOrCreateFolder(accessToken, "user-data");

export interface User {
  username: string;
  email: string;
  role: string;
  password: string;
  status: number;
  createdAt: string;
  // Additional fields
  avatar?: string;
  dob?: string;
  address?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  nationality?: string;
  salary?: string;
  bloodGroup?: string;
}

export async function readUsersFile(): Promise<User[]> {
  try {

    const searchResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}?q=name='${LOG_FILE_NAME}' and '${userDataFolderId}' in parents and trashed=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const fileId = searchResponse.data.files?.[0]?.id;
    if (!fileId) return [];

    const downloadResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return Array.isArray(downloadResponse.data) 
      ? downloadResponse.data 
      : [downloadResponse.data];
  } catch (error) {
    console.error("Failed to read users file:", error);
    throw new Error("Could not retrieve user data");
  }
}

export async function writeUsersFile(users: User[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(users, null, 2);

    // Search for existing file
    const searchResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}?q=name='${LOG_FILE_NAME}' and '${userDataFolderId}' in parents and trashed=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const fileId = searchResponse.data.files?.[0]?.id;

    if (fileId) {
      // Update existing file
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
      // Create new file
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
  } catch (error) {
    console.error("Failed to write users file:", error);
    throw new Error("Could not update user data");
  }
}