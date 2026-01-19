import { readAttendanceFile } from '@/app/lib/attendance-data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const attendanceRecords = await readAttendanceFile();

    let filteredRecords = attendanceRecords;

    // Filter by username if provided
    if (username) {
      filteredRecords = filteredRecords.filter(record => record.userName === username);
    }

    // Filter by single date
    if (date) {
      filteredRecords = filteredRecords.filter(record => record.date === date);
    }

    // Filter by date range
    if (startDate && endDate) {
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
      });
    }

    // Sort by date descending, then by username
    filteredRecords.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare === 0) {
        return a.userName.localeCompare(b.userName);
      }
      return dateCompare;
    });

    return NextResponse.json(filteredRecords);
  } catch (error) {
    console.error('Attendance get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}