import { getAccessTokenFromServiceAccount, getOrCreateFolder } from '@/app/lib/google-auth';
import { AttendanceRecord } from '@/types/users';
import axios from 'axios';

const ATTENDANCE_FILE_NAME = 'attendance.json';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

let accessToken: string;
let attendanceFolderId: string;

async function initialize() {
  if (!accessToken) {
    accessToken = await getAccessTokenFromServiceAccount();
    attendanceFolderId = await getOrCreateFolder(accessToken, "attendance");
  }
}

export async function readAttendanceFile(): Promise<AttendanceRecord[]> {
  await initialize();

  try {
    const searchResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}?q=name='${ATTENDANCE_FILE_NAME}' and '${attendanceFolderId}' in parents and trashed=false`,
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
    console.error("Failed to read attendance file:", error);
    throw new Error("Could not retrieve attendance data");
  }
}

export async function writeAttendanceFile(attendance: AttendanceRecord[]): Promise<void> {
  await initialize();

  try {
    const jsonData = JSON.stringify(attendance, null, 2);

    // Search for existing file
    const searchResponse = await axios.get(
      `${GOOGLE_DRIVE_API_URL}?q=name='${ATTENDANCE_FILE_NAME}' and '${attendanceFolderId}' in parents and trashed=false`,
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
          name: ATTENDANCE_FILE_NAME,
          parents: [attendanceFolderId],
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
    console.error("Failed to write attendance file:", error);
    throw new Error("Could not update attendance data");
  }
}