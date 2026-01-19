'use client'
import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types/users';
import { FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiMapPin } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AttendanceTrackerProps {
  attendance: AttendanceRecord[];
  currentUser: { username: string };
  onAttendanceUpdate: () => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ 
  attendance, 
  currentUser,
  onAttendanceUpdate 
}) => {
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; address?: string} | null>(null);
  const currentRecord = attendance.find(record => record.date === currentDate);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from coordinates
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              setUserLocation({
                lat: latitude,
                lng: longitude,
                address: data.display_name || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            } else {
              setUserLocation({
                lat: latitude,
                lng: longitude,
                address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            }
          } catch (error) {
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error("Could not get your location. Please enable location services.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

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

  const handleAttendance = async (type: 'check-in' | 'check-out') => {
    if (!userLocation) {
      toast.error("Waiting for location... Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/attendance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          type,
          location: userLocation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Attendance failed');
      }

      const data = await response.json();
      toast.success(`Successfully ${type === 'check-in' ? 'checked in' : 'checked out'}!`);
      
      // Refresh attendance data
      onAttendanceUpdate();
    } catch (error: any) {
      console.error('Attendance error:', error);
      toast.error(error.message || `Failed to ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const status = getCurrentStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 w-full"
    >
      {/* Current Day Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
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
                <Button 
                  onClick={() => handleAttendance('check-in')} 
                  className="flex items-center gap-1"
                  disabled={isLoading || !userLocation}
                >
                  <FiCheckCircle />
                  <span className='hidden md:flex'>
                    {isLoading ? 'Checking in...' : 'Check In'}
                  </span>
                </Button>
              )}
              
              {status === 'checked-in' && (
                <Button 
                  onClick={() => handleAttendance('check-out')} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <FiXCircle className="w-4 h-4" />
                  {isLoading ? 'Checking out...' : 'Check Out'}
                </Button>
              )}
              
              {status === 'checked-out' && (
                <Badge className="bg-success/10 text-success">Completed for today</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Location Display */}
          {userLocation && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <FiMapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Current Location:</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {userLocation.address}
              </p>
            </div>
          )}

          {/* Time Display */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Check In</div>
              <div className="text-2xl font-bold text-card-foreground">
                {formatTime(currentRecord?.checkIn)}
              </div>
              {currentRecord?.checkInLocation?.address && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {currentRecord.checkInLocation.address.split(',')[0]}
                </div>
              )}
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Check Out</div>
              <div className="text-2xl font-bold text-card-foreground">
                {formatTime(currentRecord?.checkOut)}
              </div>
              {currentRecord?.checkOutLocation?.address && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {currentRecord.checkOutLocation.address.split(',')[0]}
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {currentRecord && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {currentRecord.totalHours !== undefined && (
                <div className="text-center p-2 rounded bg-background">
                  <div className="text-muted-foreground">Total Hours</div>
                  <div className="font-semibold">{currentRecord.totalHours.toFixed(1)}h</div>
                </div>
              )}
              {currentRecord.overtimeHours && currentRecord.overtimeHours > 0 && (
                <div className="text-center p-2 rounded bg-background">
                  <div className="text-muted-foreground">Overtime</div>
                  <div className="font-semibold text-warning">{currentRecord.overtimeHours.toFixed(1)}h</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <div>
        <h4 className="text-md font-medium text-card-foreground mb-3">Attendance History</h4>
        <div className="space-y-2">
          {attendance.slice(0, 10).map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
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
                  </div>
                  
                  {/* Record Location if available */}
                  {(record.checkInLocation?.address || record.checkOutLocation?.address) && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground mt-2">
                      <FiMapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="truncate">
                        {record.checkInLocation?.address?.split(',')[0]}
                        {record.checkOutLocation?.address && ` → ${record.checkOutLocation.address.split(',')[0]}`}
                      </span>
                    </div>
                  )}
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