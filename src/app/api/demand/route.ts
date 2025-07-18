import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendToSheet } from '../../lib/googleSheets';

const allowedOrigins = [
  'http://localhost:3000',
  'https://paramount-group-i6arxbja8-md-sahadul-haques-projects.vercel.app',
  'https://paramount-group-five.vercel.app',
  'https://paramount-group-git-main-md-sahadul-haques-projects.vercel.app',
];

const SPREADSHEET_ID = '1K1XDOjvG6qAPiwuQcG3C5E1245rXHeFXl8f-zn_kc2E';
const SHEETS = {
  RAW: 'Raw',
  CONCERN: 'Concern',
  ORDERS: 'Orders',
};

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
    const [concernValues, rawValues] = await Promise.all([
      readSheet(SPREADSHEET_ID, SHEETS.CONCERN, 'A2:A'),
      readSheet(SPREADSHEET_ID, SHEETS.RAW, 'A2:B'),
    ]);

    const concerns = concernValues.flat().filter(Boolean);
    const products = rawValues
      .filter(row => row[0])
      .map(row => ({ product: row[0], uom: row[1] || '' }));

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

    await appendToSheet(SPREADSHEET_ID, SHEETS.ORDERS, values);

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