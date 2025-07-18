// lib/googleSheets.ts
import axios from 'axios';

const credentials = process.env.CREDIT;
if (!credentials) {
  throw new Error('Missing GOOGLE credentials.');
}

let parsedCredentials: any;
try {
  parsedCredentials = JSON.parse(credentials);
} catch (error) {
  throw new Error('Invalid GOOGLE credentials format.');
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const jwtHeader = {
  alg: 'RS256',
  typ: 'JWT',
};

async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: parsedCredentials.client_email,
    scope: SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jose = await import('jose');
  const privateKey = await jose.importPKCS8(parsedCredentials.private_key, 'RS256');

  return await new jose.SignJWT(payload)
    .setProtectedHeader(jwtHeader)
    .sign(privateKey);
}

export async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();
  const res = await axios.post('https://oauth2.googleapis.com/token', null, {
    params: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    },
  });
  return res.data.access_token;
}

export async function readSheet(
  spreadsheetId: string,
  sheetName: string,
  range: string
): Promise<any[][]> {
  const token = await getAccessToken();
  const res = await axios.get(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.values || [];
}

export async function appendToSheet(
  spreadsheetId: string,
  sheetName: string,
  values: any[][]
): Promise<void> {
  const token = await getAccessToken();
  await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:append`,
    { values },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: { valueInputOption: 'RAW' },
    }
  );
}