import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const allowedOrigins = [
    'http://localhost:3000',
    'https://paramount-group-d7a1ud21b-md-sahadul-haques-projects.vercel.app/',
];

const SPREADSHEET_ID = '1K1XDOjvG6qAPiwuQcG3C5E1245rXHeFXl8f-zn_kc2E';
const SHEETS = {
    RAW: 'Raw',
    CONCERN: 'Concern',
    ORDERS: 'Orders',
};

const credentials = process.env.CREDIT;
if (!credentials) {
    console.error('Service account credentials are missing');
    process.exit(1);
}

let parsedCredentials;
try {
    parsedCredentials = JSON.parse(credentials);
} catch (error) {
    console.error('Error parsing credentials:', error);
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    credentials: parsedCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

function corsCheck(req: NextRequest): string | null {
    const origin = req.headers.get('origin');
    // Allow if no origin (internal fetch), or origin is in the list
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
        const [concernRes, rawRes] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEETS.CONCERN}!A2:A` }),
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEETS.RAW}!A2:A` }),
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

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.ORDERS}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values },
        });

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
