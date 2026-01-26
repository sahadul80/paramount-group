'use client'
import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types/users';
import { 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiMapPin,
  FiWatch,
  FiSunrise,
  FiSunset,
  FiTrendingUp,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';

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
  // Get current date and time in Dhaka timezone (Asia/Dhaka)
  const getDhakaDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now).replace(/\//g, '-');
  };

  const getDhakaTime = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
  };

  const getDhakaDateTime = () => {
    const now = new Date();
    return {
      date: getDhakaDate(),
      time: getDhakaTime(),
      fullDate: new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now)
    };
  };

  const [currentDateTime, setCurrentDateTime] = useState(getDhakaDateTime());
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; address?: string} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const currentRecord = attendance.find(record => record.date === currentDateTime.date);

  // Update time every minute and handle timezone
  useEffect(() => {
    const updateTime = () => {
      setCurrentDateTime(getDhakaDateTime());
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
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
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error("Could not get your location. Please enable location services.");
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': 
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 
                           dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            Present
          </Badge>
        );
      case 'absent': 
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 
                           dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
            Absent
          </Badge>
        );
      case 'late': 
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 
                           dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
            Late
          </Badge>
        );
      case 'half-day': 
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 
                           dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            Half Day
          </Badge>
        );
      default: 
        return <Badge variant="outline" className="border-gray-300 dark:border-gray-600">Unknown</Badge>;
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
      const dhakaTime = getDhakaTime();
      const dhakaDate = getDhakaDate();
      
      const response = await fetch('/api/user/attendance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          type,
          location: userLocation,
          time: dhakaTime,
          date: dhakaDate,
          timezone: 'Asia/Dhaka'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Attendance failed');
      }

      toast.success(`Successfully ${type === 'check-in' ? 'checked in' : 'checked out'} at ${dhakaTime} (Bangladesh Time)!`);
      onAttendanceUpdate();
    } catch (error: any) {
      console.error('Attendance error:', error);
      toast.error(error.message || `Failed to ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const status = getCurrentStatus();

  // Calculate today's work progress if checked in
  const calculateWorkProgress = () => {
    if (!currentRecord?.checkIn || currentRecord.checkOut) return 0;
    
    // Create date objects in Dhaka timezone
    const now = new Date();
    const dhakaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    
    // Parse check-in time (assuming stored time is in 24h format)
    const [checkInHour, checkInMinute] = currentRecord.checkIn.split(':').map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
    
    // Parse current Dhaka time
    const [currentHour, currentMinute] = dhakaTime.split(':').map(Number);
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const totalMinutes = 8 * 60; // 8 hours work day
    const elapsedMinutes = currentTotalMinutes - checkInTotalMinutes;
    
    return Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);
  };

  const workProgress = calculateWorkProgress();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 md:space-y-6"
    >
      {/* Current Day Card */}
      <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-300 
                      dark:bg-gray-900/50 dark:border-gray-800">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl 
                                   dark:text-gray-100">
                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <FiCalendar className="w-4 h-4 md:w-5 md:h-5 text-primary dark:text-primary" />
                </div>
                Today's Attendance
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
                  {currentDateTime.fullDate}
                </span>
                <Badge variant="outline" 
                       className="text-xs border-blue-200 text-blue-700 bg-blue-50 
                                 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-900/30">
                  GMT+6 (Asia/Dhaka)
                </Badge>
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <AnimatePresence mode="wait">
                {status === 'not-checked-in' && (
                  <motion.div
                    key="check-in"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <a>
                      <Button 
                        onClick={() => handleAttendance('check-in')} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 md:h-12"
                        disabled={isLoading || locationLoading || !userLocation}
                        size="lg"
                      >
                        {isLoading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiCheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                        <span>
                          {isLoading ? 'Checking in...' : 'Check In'}
                        </span>
                      </Button>
                    </a>
                  </motion.div>
                )}
                
                {status === 'checked-in' && (
                  <motion.div
                    key="check-out"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-2"
                  >
                    <a>
                      <Button 
                        onClick={() => handleAttendance('check-out')} 
                        variant="outline" 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 md:h-12
                                    dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiXCircle className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                        {isLoading ? 'Checking out...' : 'Check Out'}
                      </Button>
                    </a>
                    
                    {/* Work Progress Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground 
                                     dark:text-gray-400">
                        <span>Work Progress</span>
                        <span>{workProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={workProgress} className="h-1.5" />
                    </div>
                  </motion.div>
                )}
                
                {status === 'checked-out' && (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Badge className="px-4 py-2 bg-green-50 text-green-700 border-green-200 
                                      hover:bg-green-50
                                      dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 
                                      dark:hover:bg-green-900/40">
                      <FiCheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Completed for today
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 md:space-y-5">
          {/* Location Display */}
          <AnimatePresence>
            {locationLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-muted/50 border dark:bg-gray-800/50 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin text-muted-foreground 
                                      dark:text-gray-400" />
                  <span className="text-sm text-muted-foreground dark:text-gray-400">
                    Getting your location...
                  </span>
                </div>
              </motion.div>
            ) : userLocation ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 
                          dark:bg-blue-900/20 dark:border-blue-800"
              >
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-800">
                    <FiMapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 
                                        dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-700 
                                       dark:text-blue-400">
                        Current Location
                      </span>
                      <Badge variant="outline" 
                             className="text-xs py-0 h-4 px-1.5 border-blue-200 text-blue-600
                                       dark:border-blue-700 dark:text-blue-400">
                        Live
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-600/80 truncate 
                                   dark:text-blue-400/80">
                      {userLocation.address}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-yellow-50/50 border border-yellow-100
                          dark:bg-yellow-900/20 dark:border-yellow-800"
              >
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 
                                           dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-yellow-700 
                                   dark:text-yellow-400">
                      Location Required
                    </div>
                    <div className="text-xs text-yellow-600/80 
                                   dark:text-yellow-500/80">
                      Please enable location services to check in/out
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                        border hover:shadow-sm
                        dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-800">
                  <FiSunrise className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 
                                       dark:text-blue-400" />
                </div>
                <div className="text-sm font-medium text-muted-foreground 
                               dark:text-gray-400">
                  Check In
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-card-foreground 
                             dark:text-gray-100 mb-1">
                {formatTime(currentRecord?.checkIn)}
              </div>
              {currentRecord?.checkInLocation?.address && (
                <div className="text-xs text-muted-foreground truncate 
                               dark:text-gray-500">
                  {currentRecord.checkInLocation.address.split(',')[0]}
                </div>
              )}
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                        border hover:shadow-sm
                        dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-800">
                  <FiSunset className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 
                                      dark:text-purple-400" />
                </div>
                <div className="text-sm font-medium text-muted-foreground 
                               dark:text-gray-400">
                  Check Out
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-card-foreground 
                             dark:text-gray-100 mb-1">
                {formatTime(currentRecord?.checkOut)}
              </div>
              {currentRecord?.checkOutLocation?.address && (
                <div className="text-xs text-muted-foreground truncate 
                               dark:text-gray-500">
                  {currentRecord.checkOutLocation.address.split(',')[0]}
                </div>
              )}
            </motion.div>
          </div>

          {/* Additional Info */}
          {currentRecord && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                            transition-shadow dark:border-gray-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FiWatch className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground 
                                     dark:text-gray-400" />
                  <div className="text-xs text-muted-foreground dark:text-gray-400">
                    Total Hours
                  </div>
                </div>
                <div className="text-lg md:text-xl font-semibold text-card-foreground 
                               dark:text-gray-100">
                  {currentRecord.totalHours?.toFixed(1) || '0'}h
                </div>
              </div>
              
              {currentRecord.overtimeHours && currentRecord.overtimeHours > 0 ? (
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100 
                              hover:shadow-sm transition-shadow
                              dark:bg-amber-900/20 dark:border-amber-800">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FiTrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 
                                           dark:text-amber-500" />
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      Overtime
                    </div>
                  </div>
                  <div className="text-lg md:text-xl font-semibold text-amber-700 
                                 dark:text-amber-400">
                    +{currentRecord.overtimeHours.toFixed(1)}h
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                              transition-shadow dark:border-gray-700">
                  <div className="text-xs text-muted-foreground mb-1 dark:text-gray-400">
                    Status
                  </div>
                  {getStatusBadge(currentRecord.status)}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base md:text-lg font-semibold text-card-foreground 
                        dark:text-gray-100 flex items-center gap-2">
            <FiClock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground 
                               dark:text-gray-400" />
            Recent Attendance
          </h4>
          <Badge variant="outline" className="text-xs dark:border-gray-600">
            Last 10 days
          </Badge>
        </div>
        
        <div className="space-y-2">
          {attendance.slice(0, 10).map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
            >
              <Card className="border-border hover:shadow-sm transition-shadow cursor-pointer 
                              group dark:bg-gray-900/50 dark:border-gray-800">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 
                                       dark:bg-primary/20 flex items-center justify-center">
                          <FiCalendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary 
                                               dark:text-primary" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium dark:text-gray-200">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="hidden sm:block">
                            {getStatusBadge(record.status)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 
                                      text-xs text-muted-foreground dark:text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiSunrise className="w-3 h-3" />
                            <span>{formatTime(record.checkIn)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiSunset className="w-3 h-3" />
                            <span>{formatTime(record.checkOut)}</span>
                          </div>
                          {record.totalHours && (
                            <div className="flex items-center gap-1">
                              <FiWatch className="w-3 h-3" />
                              <span>{record.totalHours.toFixed(1)}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="sm:hidden">
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  </div>
                  
              {/* Record Location if available */}
              {(record.checkInLocation?.address || record.checkOutLocation?.address) && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground 
                              mt-3 pt-3 border-t dark:border-gray-800 dark:text-gray-500">
                  <FiMapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div className="truncate">
                    {record.checkInLocation?.address?.split(',')[0]}
                    {record.checkOutLocation?.address && ` → ${record.checkOutLocation.address.split(',')[0]}`}
                  </div>
                </div>
              )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {attendance.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-muted 
                            dark:bg-gray-800 flex items-center justify-center mb-3">
                <FiCalendar className="w-6 h-6 text-muted-foreground 
                                     dark:text-gray-400" />
              </div>
              <div className="text-muted-foreground dark:text-gray-400">
                No attendance records found
              </div>
              <div className="text-sm text-muted-foreground mt-1 dark:text-gray-500">
                Your attendance history will appear here
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceTracker;