import { NextRequest, NextResponse } from 'next/server';
import { readAttendanceFile, writeAttendanceFile } from '@/app/lib/attendance-data';
import { AttendanceRecord } from '@/types/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username, 
      type, 
      location,
      time,        // Client sends formatted time
      date,        // Client sends formatted date
      timestamp,   // UTC+6 timestamp for Dhaka
      timezone,    // Timezone info
      status: clientStatus // Optional status from client
    } = body;

    if (!username || !type || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use client-provided date and time, or fallback to server date
    const today = date || new Date().toISOString().split('T')[0];
    const currentTime = time || new Date().toTimeString().slice(0, 5);

    const attendanceRecords = await readAttendanceFile();
    
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

      // Use client-provided status or calculate based on time
      let status: AttendanceRecord['status'] = clientStatus || 'present';
      
      if (!clientStatus) {
        // Calculate status based on check-in time (Dhaka timezone)
        const checkInHour = parseInt(currentTime.split(':')[0]);
        const checkInMinute = parseInt(currentTime.split(':')[1]);
        
        // Determine if late (after 9:30 AM)
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
          status = 'late';
        }
        
        // Determine if half-day (after 11:00 AM)
        if (checkInHour > 11 || (checkInHour === 11 && checkInMinute > 0)) {
          status = 'half-day';
        }
      }

      const newRecord: AttendanceRecord = {
        id: `${Date.now()}_${username}`,
        userName: username,
        date: today,
        checkIn: currentTime,
        checkInLocation: location,
        timestamp: timestamp || new Date().toISOString(), // Store original timestamp
        timezone: timezone || 'Asia/Dhaka',
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

      // Update record with check-out details
      record.checkOut = currentTime;
      record.checkOutLocation = location;
      
      // Store additional metadata
      if (timestamp) {
        record.checkOut = timestamp;
      }

      // Calculate total hours if check-in exists
      if (record.checkIn) {
        try {
          const [inHour, inMinute] = record.checkIn.split(':').map(Number);
          const [outHour, outMinute] = currentTime.split(':').map(Number);
          
          // Handle cases where check-out might be after midnight (next day)
          let totalHours = 0;
          const checkInMinutes = inHour * 60 + inMinute;
          const checkOutMinutes = outHour * 60 + outMinute;
          
          // If check-out is earlier than check-in, assume next day
          if (checkOutMinutes < checkInMinutes) {
            totalHours = ((1440 - checkInMinutes) + checkOutMinutes) / 60;
          } else {
            totalHours = (checkOutMinutes - checkInMinutes) / 60;
          }
          
          record.totalHours = parseFloat(totalHours.toFixed(2));
          
          // Calculate overtime (assuming 8-hour workday)
          if (totalHours > 8) {
            record.overtimeHours = parseFloat((totalHours - 8).toFixed(2));
          }

          // Update status based on total hours
          if (totalHours < 4 && record.status !== 'half-day') {
            record.status = 'half-day';
          } else if (totalHours >= 4 && totalHours < 8 && record.status === 'half-day') {
            record.status = 'present'; // Upgrade from half-day if worked enough
          }
        } catch (error) {
          console.error('Error calculating hours:', error);
          // Don't fail the request if calculation fails
          record.totalHours = 0;
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
      { 
        message: `Successfully ${type}`,
        record,
        serverTime: new Date().toISOString(),
        timezone: 'UTC' // Server is in UTC
      },
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