'use client'
import React, { useState } from 'react';
import { AttendanceRecord } from '@/types/users';
import { FiClock, FiCheckCircle, FiXCircle, FiCalendar } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { Input } from '../ui/input';

interface AttendanceTrackerProps {
  attendance: AttendanceRecord[];
  onCheckIn: () => void;
  code: string;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ attendance, onCheckIn }) => {
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const currentRecord = attendance.find(record => record.date === currentDate);
  const [attandanceCode, setAttandanceCode] = useState({
    date: '', // ISO string (YYYY-MM-DD)
    checkIn: '', // Time string (HH:MM)
    checkOut: '', // Time string (HH:MM)
    status: '',
    code: ''
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-success/10 text-success">Present</Badge>;
      case 'absent': return <Badge className="bg-destructive/10 text-destructive">Absent</Badge>;
      case 'late': return <Badge className="bg-warning/10 text-warning">Late</Badge>;
      case 'half-day': return <Badge className="bg-info/10 text-info">Half Day</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '--:--';
    return time;
  };

  const getCurrentStatus = () => {
    if (!currentRecord) return 'not-checked-in';
    if (currentRecord.checkIn && !currentRecord.checkOut) return 'checked-in';
    if (currentRecord.checkIn && currentRecord.checkOut) return 'checked-out';
    return 'not-checked-in';
  };

  const status = getCurrentStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Current Day Card */}
      <Card className="border-border bg-gradient-to-br from-card to-card/80">
        <CardHeader>
            <div className="flex justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                        <FiCalendar className="w-5 h-5" />
                        Today's Attendance
                    </CardTitle>
                    <CardDescription className='text-xs sm:text-sm'>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                </div>
                <div className="relative">
                    {status === 'not-checked-in' && (
                        <div className='flex justify-between border border-1 rounded-lg'>
                            <Input 
                                value={attandanceCode.code} 
                                onChange={(e) => setAttandanceCode({...attandanceCode, code: e.target.value})} 
                                placeholder="Enter attandance code"
                                className='flex w-auto border border-0'
                            />
                            <Button onClick={onCheckIn} className="flex items-center gap-1">
                                <FiCheckCircle />
                                <span className='hidden md:flex'>Check In</span>
                            </Button>
                        </div>
                        )}
                        
                        {status === 'checked-in' && (
                        <Button onClick={onCheckIn} variant="outline" className="flex items-center gap-2">
                            <FiXCircle className="w-4 h-4" />
                            Check Out
                        </Button>
                        )}
                        
                        {status === 'checked-out' && (
                        <Badge className="bg-success/10 text-success">Completed for today</Badge>
                    )}
                </div>
            </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Check In</div>
              <div className="text-2xl font-bold text-card-foreground">
                {formatTime(currentRecord?.checkIn)}
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Check Out</div>
              <div className="text-2xl font-bold text-card-foreground">
                {formatTime(currentRecord?.checkOut)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <div>
        <h4 className="text-md font-medium text-card-foreground mb-3">Attendance History</h4>
        <div className="space-y-2">
          {attendance.slice(0, 10).map((record, index) => (
            <motion.div
              key={record.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border">
                <CardContent className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FiClock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.checkIn && `In: ${record.checkIn}`} {record.checkOut && `Out: ${record.checkOut}`}
                      </div>
                    </div>
                  </div>
                  
                  {getStatusBadge(record.status)}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceTracker;