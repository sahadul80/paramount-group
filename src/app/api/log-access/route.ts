// app/api/log-access/route.ts
import { NextRequest } from 'next/server';
import { writeLogFile, readLogFile } from '@/app/lib/log-data';

interface LogEntry {
  ip: string;
  userAgent: string;
  referer: string;
  acceptLanguage: string;
  deviceType: string;
  page: string;
  timestamp: string;
  method: string;
  host: string;
  path: string;
  query: Record<string, string>;
  protocol: string;
}

export async function GET(request: NextRequest) {
  const headers = request.headers;
  const url = new URL(request.url);

  const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';
  const referer = headers.get('referer') || 'unknown';
  const acceptLanguage = headers.get('accept-language') || 'unknown';
  const page = url.searchParams.get('page') || 'unknown';

  const deviceType = /mobile/i.test(userAgent) ? 'Mobile' :
    /tablet/i.test(userAgent) ? 'Tablet' :
    /watch/i.test(userAgent) ? 'Watch' :
    /tv/i.test(userAgent) ? 'TV' : 'Desktop';

  const timestamp = new Date().toISOString();

  const logEntry: LogEntry = {
    ip,
    userAgent,
    referer,
    acceptLanguage,
    deviceType,
    page,
    timestamp,
    method: request.method,
    host: url.hostname,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    protocol: url.protocol.replace(':', ''),
  };

  try {
    await updateLog(logEntry);

    return new Response(JSON.stringify({
      message: 'Access logged successfully',
      loggedData: logEntry,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Logging error:', error);
    return new Response(JSON.stringify({
      error: 'Logging operation failed',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function updateLog(logEntry: LogEntry): Promise<void> {
  try {
    // Read existing logs
    let logs: LogEntry[] = [];
    try {
      logs = await readLogFile();
    } catch (error: any) {
      // File doesn't exist yet - start with empty array
      if (error.code !== 'ENOENT') throw error;
    }

    // Prepend new log entry
    const updatedLogs = [logEntry, ...logs];
    
    // Write updated logs to file
    await writeLogFile(updatedLogs);
  } catch (error) {
    console.error('Error updating log:', error);
    throw new Error('Failed to update access log');
  }
}