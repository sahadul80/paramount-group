// lib/googleSheets.ts
import axios from 'axios';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getCredentials() {
  const raw = process.env.CREDIT;

  if (!raw) {
    throw new Error('Missing GOOGLE credentials.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error('Invalid GOOGLE credentials format.');
  }

  // 🔥 FIX: newline issue
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

async function createJWT(): Promise<string> {
  const credentials = getCredentials();

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: credentials.client_email,
    scope: SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jose = await import('jose');

  const privateKey = await jose.importPKCS8(
    credentials.private_key,
    'RS256'
  );

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
}

export async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();

  const res = await axios.post(
    'https://oauth2.googleapis.com/token',
    null,
    {
      params: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      },
    }
  );

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
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
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
      params: {
        valueInputOption: 'RAW',
      },
    }
  );
}