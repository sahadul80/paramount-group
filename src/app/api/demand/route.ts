import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const allowedOrigins = [
  'http://localhost:3000',
  'https://paramount-group-i6arxbja8-md-sahadul-haques-projects.vercel.app/',
];

const SPREADSHEET_ID = '1K1XDOjvG6qAPiwuQcG3C5E1245rXHeFXl8f-zn_kc2E';
const SHEETS = {
  RAW: 'Raw',
  CONCERN: 'Concern',
  ORDERS: 'Orders',
};

const credentials = process.env.CREDIT;

if (!credentials) {
  console.error('Missing GOOGLE credentials.');
  process.exit(1);
}

let parsedCredentials: any;
try {
  parsedCredentials = JSON.parse(credentials);
} catch (error) {
  console.error('Invalid GOOGLE credentials format.');
  process.exit(1);
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
  

async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();
  const res = await axios.post('https://oauth2.googleapis.com/token', null, {
    params: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    },
  });
  return res.data.access_token;
}

function corsCheck(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin || allowedOrigins.includes(origin)) return origin;
  return null;
}

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function GET(req: NextRequest) {
  const origin = corsCheck(req);
  if (!origin && req.headers.get('origin')) {
    return NextResponse.json({ error: 'CORS policy does not allow this origin.' }, { status: 403 });
  }

  try {
    const token = await getAccessToken();

    const [concernRes, rawRes] = await Promise.all([
      axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEETS.CONCERN}!A2:A`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEETS.RAW}!A2:A`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    const concerns = concernRes.data.values?.flat().filter(Boolean) || [];
    const products = rawRes.data.values?.flat().filter(Boolean) || [];

    return new NextResponse(JSON.stringify({ concerns, products }), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Error retrieving data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const origin = corsCheck(req);
  if (!origin && req.headers.get('origin')) {
    return NextResponse.json({ error: 'CORS policy does not allow this origin.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rows = Array.isArray(body) ? body : [];

    const values = rows
      .filter(row => row.quantity > 0)
      .map(row => [row.concern, row.product, row.quantity, new Date().toISOString()]);

    const token = await getAccessToken();

    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEETS.ORDERS}!A1:append`,
      {
        values,
      },
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

    return new NextResponse(JSON.stringify({ message: 'Order submitted successfully' }), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = corsCheck(req);
  if (!origin && req.headers.get('origin')) {
    return NextResponse.json({ error: 'CORS policy does not allow this origin.' }, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
