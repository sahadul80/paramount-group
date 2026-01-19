import { NextRequest, NextResponse } from 'next/server';
import { readAttendanceFile, writeAttendanceFile } from '@/app/lib/attendance-data';
import { AttendanceRecord } from '@/types/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, type, location } = body;

    if (!username || !type || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const attendanceRecords = await readAttendanceFile();
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM

    let record = attendanceRecords.find(record => 
      record.userName === username && record.date === today
    );

    if (type === 'check-in') {
      if (record) {
        return NextResponse.json(
          { error: 'Already checked in today' },
          { status: 400 }
        );
      }

      // Determine status based on check-in time (example: if check-in after 9:30, mark as late)
      const checkInHour = parseInt(currentTime.split(':')[0]);
      const checkInMinute = parseInt(currentTime.split(':')[1]);
      let status: AttendanceRecord['status'] = 'present';
      if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
        status = 'late';
      }

      const newRecord: AttendanceRecord = {
        id: `${Date.now()}_${username}`,
        userName: username,
        date: today,
        checkIn: currentTime,
        checkInLocation: location,
        status,
      };

      attendanceRecords.push(newRecord);
    } else if (type === 'check-out') {
      if (!record) {
        return NextResponse.json(
          { error: 'No check-in found for today' },
          { status: 400 }
        );
      }

      if (record.checkOut) {
        return NextResponse.json(
          { error: 'Already checked out today' },
          { status: 400 }
        );
      }

      record.checkOut = currentTime;
      record.checkOutLocation = location;

      // Calculate total hours
      if (record.checkIn) {
        const [inHour, inMinute] = record.checkIn.split(':').map(Number);
        const [outHour, outMinute] = currentTime.split(':').map(Number);
        
        const checkInMinutes = inHour * 60 + inMinute;
        const checkOutMinutes = outHour * 60 + outMinute;
        const totalMinutes = checkOutMinutes - checkInMinutes;
        const totalHours = totalMinutes / 60;
        
        record.totalHours = parseFloat(totalHours.toFixed(2));
        
        // Calculate overtime (assuming 8-hour workday)
        if (totalHours > 8) {
          record.overtimeHours = parseFloat((totalHours - 8).toFixed(2));
        }

        // Update status if half-day (less than 4 hours)
        if (totalHours < 4) {
          record.status = 'half-day';
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "check-in" or "check-out"' },
        { status: 400 }
      );
    }

    await writeAttendanceFile(attendanceRecords);

    return NextResponse.json(
      { message: `Successfully ${type}`, record },
      { status: 200 }
    );
  } catch (error) {
    console.error('Attendance check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}