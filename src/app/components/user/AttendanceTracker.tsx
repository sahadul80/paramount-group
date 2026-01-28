'use client'
import React, { useState, useEffect, useRef } from 'react';
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
  FiLoader,
  FiCalendar as FiCalendarIcon,
  FiFileText,
  FiRefreshCw,
  FiNavigation
} from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AttendanceTrackerProps {
  attendance: AttendanceRecord[];
  currentUser: { username: string };
  onAttendanceUpdate: () => void;
}

interface LeaveRequestData {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}

// Centralized time utility functions
const TimeUtils = {
  // Get current Dhaka time (GMT+6)
  getCurrentDhakaTime: () => {
    const now = new Date();
    // Dhaka is UTC+6, so add 6 hours to UTC
    const dhakaTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
    return dhakaTime;
  },

  // Get formatted Dhaka time
  getFormattedDhakaTime: () => {
    const dhakaTime = TimeUtils.getCurrentDhakaTime();
    const hours24 = dhakaTime.getUTCHours();
    const minutes = dhakaTime.getUTCMinutes();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    
    return {
      hours: hours24,
      minutes,
      formatted24h: `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      formatted12h: `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`,
      isoString: dhakaTime.toISOString()
    };
  },

  // Get Dhaka date in YYYY-MM-DD format
  getDhakaDate: () => {
    const dhakaTime = TimeUtils.getCurrentDhakaTime();
    const year = dhakaTime.getUTCFullYear();
    const month = (dhakaTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dhakaTime.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Format any time string to HH:mm
  formatTime: (timeValue?: string | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    
    try {
      // If already in HH:mm format
      if (/^\d{2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(':').map(Number);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      // Try parsing as Date object
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        // Extract time from UTC date (since we store in Dhaka time)
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      return '--:--';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  },

  // Format date for display
  formatDate: (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString + 'T00:00:00+06:00'); // Assume Dhaka timezone
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  },

  // Calculate attendance status based on check-in time
  calculateStatus: (checkInTime?: string): string => {
    if (!checkInTime) return 'absent';
    
    const formattedTime = TimeUtils.formatTime(checkInTime);
    if (formattedTime === '--:--') return 'absent';
    
    try {
      const [hoursStr, minutesStr] = formattedTime.split(':');
      const checkInHour = parseInt(hoursStr, 10);
      const checkInMinute = parseInt(minutesStr, 10);
      
      const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
      const nineThirtyAM = 9 * 60 + 30; // 9:30 AM
      const elevenAM = 11 * 60;         // 11:00 AM
      
      if (checkInTotalMinutes > elevenAM) {
        return 'half-day';
      } else if (checkInTotalMinutes > nineThirtyAM) {
        return 'late';
      }
      
      return 'present';
    } catch (error) {
      console.error('Error calculating status:', error);
      return 'present';
    }
  }
};

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ 
  attendance, 
  currentUser,
  onAttendanceUpdate 
}) => {
  // State using centralized utilities
  const [currentDhakaTime, setCurrentDhakaTime] = useState(TimeUtils.getFormattedDhakaTime());
  const [currentDhakaDate, setCurrentDhakaDate] = useState(TimeUtils.getDhakaDate());
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; address?: string} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequestData>({
    startDate: TimeUtils.getDhakaDate(),
    endDate: TimeUtils.getDhakaDate(),
    leaveType: 'casual',
    reason: ''
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  
  // Refs for managing location requests
  const locationWatchId = useRef<number | null>(null);
  const locationRetryCount = useRef(0);
  const maxRetries = 3;
  
  // Find today's attendance record
  const currentRecord = attendance.find(record => {
    try {
      return record.date === currentDhakaDate;
    } catch (error) {
      console.error('Error finding record:', error);
      return false;
    }
  });

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentDhakaTime(TimeUtils.getFormattedDhakaTime());
      setCurrentDhakaDate(TimeUtils.getDhakaDate());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Optimized location fetching function
  const fetchUserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return false;
    }

    setLocationLoading(true);
    setLocationError(null);
    
    return new Promise<boolean>((resolve) => {
      const onSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use a more reliable geocoding service with CORS headers
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: data.locality || data.city || data.principalSubdivision || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          } else {
            // Fallback to coordinates if API fails
            setUserLocation({
              lat: latitude,
              lng: longitude,
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
            });
          }
          
          // Clear any watch if it was set
          if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
          }
          
          locationRetryCount.current = 0;
          setLocationLoading(false);
          resolve(true);
        } catch (error) {
          console.error('Error getting address:', error);
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
          });
          setLocationLoading(false);
          resolve(true);
        }
      };

      const onError = (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = "Could not get your location.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your device settings.";
            break;
          case error.TIMEOUT:
            if (locationRetryCount.current < maxRetries) {
              locationRetryCount.current++;
              // Retry with reduced accuracy
              setTimeout(() => {
                navigator.geolocation.getCurrentPosition(
                  onSuccess,
                  onError,
                  {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 30000
                  }
                );
              }, 1000);
              return;
            }
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        setLocationError(errorMessage);
        setLocationLoading(false);
        
        // For iOS Safari, try using watchPosition as a workaround
        if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          try {
            locationWatchId.current = navigator.geolocation.watchPosition(
              onSuccess,
              onError,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
            
            // Clear watch after 10 seconds
            setTimeout(() => {
              if (locationWatchId.current !== null) {
                navigator.geolocation.clearWatch(locationWatchId.current);
                locationWatchId.current = null;
                if (!userLocation) {
                  setLocationError("Location detection timed out on iOS. Please ensure location services are enabled.");
                }
              }
            }, 10000);
          } catch (watchError) {
            console.error('Watch position error:', watchError);
          }
        }
        
        resolve(false);
      };

      // Optimized options for different browsers
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      // For iOS, use slightly different options
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        options.timeout = 15000;
        options.maximumAge = 10000;
      }

      try {
        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
      } catch (error) {
        console.error('Geolocation request failed:', error);
        setLocationError("Failed to request location. Please refresh the page and try again.");
        setLocationLoading(false);
        resolve(false);
      }
    });
  };

  // Get user's current location - with user interaction requirement for iOS
  useEffect(() => {
    // Don't auto-fetch location on iOS Safari immediately
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      // On iOS Safari, we'll fetch location when user interacts
      setLocationLoading(false);
      setLocationError("Tap 'Get Location' button to enable location services.");
      return;
    }
    
    // For other browsers, try to get location on mount
    fetchUserLocation();
    
    // Cleanup function
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
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

  const getCurrentStatus = () => {
    if (!currentRecord) return 'not-checked-in';
    if (currentRecord.checkIn && !currentRecord.checkOut) return 'checked-in';
    if (currentRecord.checkIn && currentRecord.checkOut) return 'checked-out';
    return 'not-checked-in';
  };

  // Handle attendance check-in/out
  const handleAttendance = async (type: 'check-in' | 'check-out') => {
    if (!userLocation) {
      toast.error("Location is required. Please enable location services.");
      
      // Try to get location if not available
      const success = await fetchUserLocation();
      if (!success) {
        toast.error("Could not get your location. Please check your browser settings.");
        return;
      }
      
      // If location was just fetched, wait a moment and retry
      setTimeout(() => {
        if (userLocation) {
          toast.info("Location acquired. Please try checking in/out again.");
        }
      }, 500);
      return;
    }

    setIsLoading(true);
    try {
      // Get current Dhaka timestamp
      const dhakaTimestamp = TimeUtils.getCurrentDhakaTime().toISOString();
      
      const response = await fetch('/api/user/attendance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          type,
          location: userLocation,
          time: currentDhakaTime.formatted24h, // Use 24-hour format
          date: currentDhakaDate,
          timestamp: dhakaTimestamp, // Send ISO timestamp
          timezone: 'Asia/Dhaka',
          status: type === 'check-in' ? TimeUtils.calculateStatus(currentDhakaTime.formatted24h) : undefined
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Attendance failed');
      }

      toast.success(`Successfully ${type === 'check-in' ? 'checked in' : 'checked out'} at ${currentDhakaTime.formatted12h} (Bangladesh Time)!`);
      onAttendanceUpdate();
    } catch (error: any) {
      console.error('Attendance error:', error);
      toast.error(error.message || `Failed to ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate today's work progress
  const calculateWorkProgress = () => {
    if (!currentRecord?.checkIn || currentRecord.checkOut) return 0;
    
    try {
      const checkInFormatted = TimeUtils.formatTime(currentRecord.checkIn);
      if (checkInFormatted === '--:--') return 0;
      
      const [checkInHour, checkInMinute] = checkInFormatted.split(':').map(Number);
      const currentHour = currentDhakaTime.hours;
      const currentMinute = currentDhakaTime.minutes;
      
      const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      
      const workDayMinutes = 8 * 60; // 8 hours work day
      const elapsedMinutes = currentTotalMinutes - checkInTotalMinutes;
      
      // Ensure progress is between 0-100
      return Math.min(Math.max((elapsedMinutes / workDayMinutes) * 100, 0), 100);
    } catch (error) {
      console.error('Error calculating work progress:', error);
      return 0;
    }
  };

  // Calculate current status based on time
  const getCurrentTimeStatus = () => {
    const currentTotalMinutes = currentDhakaTime.hours * 60 + currentDhakaTime.minutes;
    const elevenAM = 11 * 60;
    const nineThirtyAM = 9 * 60 + 30;
    
    if (currentTotalMinutes > elevenAM) {
      return { 
        status: 'half-day', 
        message: 'Arrival after 11:00 AM is considered half day' 
      };
    } else if (currentTotalMinutes > nineThirtyAM) {
      return { 
        status: 'late', 
        message: 'Arrival after 9:30 AM is considered late' 
      };
    }
    
    return { 
      status: 'on-time', 
      message: 'You can check in' 
    };
  };

  const handleLeaveRequest = async () => {
    if (!leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Leave request submitted successfully! This feature will be implemented soon.');
      setShowLeaveDialog(false);
      setLeaveRequest({
        startDate: TimeUtils.getDhakaDate(),
        endDate: TimeUtils.getDhakaDate(),
        leaveType: 'casual',
        reason: ''
      });
    } catch (error: any) {
      console.error('Leave request error:', error);
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const status = getCurrentStatus();
  const workProgress = calculateWorkProgress();
  const timeStatus = getCurrentTimeStatus();
  const displayDate = TimeUtils.formatDate(currentDhakaDate);

  // Truncate address for mobile display
  const truncateAddress = (address?: string, maxLength: number = 60) => {
    if (!address) return '';
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4 md:space-y-6"
      >
        {/* Current Day Card */}
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-300 
                        dark:bg-gray-900/50 dark:border-gray-800 w-full overflow-hidden">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl 
                                     dark:text-gray-100 truncate">
                  <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0">
                    <FiCalendar className="w-4 h-4 md:w-5 md:h-5 text-primary dark:text-primary" />
                  </div>
                  <span className="truncate">Today's Attendance</span>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 truncate">
                    {displayDate}
                  </span>
                  <Badge variant="outline" 
                         className="text-xs border-blue-200 text-blue-700 bg-blue-50 
                                   dark:border-blue-800 dark:text-blue-400 dark:bg-blue-900/30 shrink-0">
                    GMT+6
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 truncate">
                    {currentDhakaTime.formatted24h}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 truncate">
                    ({currentDhakaTime.formatted12h})
                  </span>
                </div>
                {!currentRecord?.checkIn && (
                  <div className="mt-2">
                    <Badge variant="outline" className={`text-xs ${
                      timeStatus.status === 'late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                      timeStatus.status === 'half-day' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    }`}>
                      {timeStatus.status === 'late' && <FiAlertCircle className="w-3 h-3 mr-1" />}
                      <span className="truncate">{timeStatus.message}</span>
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                {/* Leave Request Button */}
                <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 h-11 md:h-12 w-full sm:w-auto"
                      size="lg"
                    >
                      <FiFileText className="w-4 h-4" />
                      <span className="truncate">Leave Request</span>
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Submit Leave Request</DialogTitle>
                      <DialogDescription>
                        Fill out the form below to request leave. Your request will be reviewed by management.
                        <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                          Note: This feature is currently in development
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={leaveRequest.startDate}
                            onChange={(e) => setLeaveRequest({...leaveRequest, startDate: e.target.value})}
                            min={TimeUtils.getDhakaDate()}
                            required
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={leaveRequest.endDate}
                            onChange={(e) => setLeaveRequest({...leaveRequest, endDate: e.target.value})}
                            min={leaveRequest.startDate}
                            required
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="leaveType">Leave Type *</Label>
                        <Select 
                          value={leaveRequest.leaveType} 
                          onValueChange={(value) => setLeaveRequest({...leaveRequest, leaveType: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casual">Casual Leave</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="earned">Earned Leave</SelectItem>
                            <SelectItem value="maternity">Maternity Leave</SelectItem>
                            <SelectItem value="paternity">Paternity Leave</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                          id="reason"
                          placeholder="Please provide a reason for your leave request..."
                          value={leaveRequest.reason}
                          onChange={(e) => setLeaveRequest({...leaveRequest, reason: e.target.value})}
                          rows={4}
                          required
                          className="w-full resize-none"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowLeaveDialog(false)}
                        disabled={isSubmittingLeave}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleLeaveRequest}
                        disabled={isSubmittingLeave}
                        className="w-full sm:w-auto"
                      >
                        {isSubmittingLeave ? (
                          <>
                            <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 md:space-y-5">
            {/* Location Display - Fixed for mobile */}
            <AnimatePresence>
              {locationLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-lg bg-muted/50 border dark:bg-gray-800/50 dark:border-gray-700 
                           w-full max-w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <FiLoader className="w-4 h-4 animate-spin text-muted-foreground 
                                        dark:text-gray-400 shrink-0" />
                    <span className="text-sm text-muted-foreground dark:text-gray-400 truncate">
                      Getting your location...
                    </span>
                  </div>
                </motion.div>
              ) : userLocation ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 
                            dark:bg-blue-900/20 dark:border-blue-800 w-full max-w-full overflow-hidden"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-800 shrink-0">
                      <FiMapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 
                                          dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-700 
                                         dark:text-blue-400 truncate">
                          Current Location
                        </span>
                        <Badge variant="outline" 
                               className="text-xs py-0 h-4 px-1.5 border-blue-200 text-blue-600
                                         dark:border-blue-700 dark:text-blue-400 shrink-0">
                          Live
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-xs h-6 px-2 shrink-0"
                          onClick={fetchUserLocation}
                        >
                          <FiRefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      <div className="text-xs text-blue-600/80 break-words 
                                     dark:text-blue-400/80 line-clamp-2">
                        {truncateAddress(userLocation.address)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : locationError ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-yellow-50/50 border border-yellow-100
                            dark:bg-yellow-900/20 dark:border-yellow-800 w-full max-w-full overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 
                                               dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-yellow-700 
                                       dark:text-yellow-400 mb-1">
                          Location Required
                        </div>
                        <div className="text-xs text-yellow-600/80 break-words 
                                       dark:text-yellow-500/80 line-clamp-2">
                          {locationError}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:pl-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={fetchUserLocation}
                      >
                        <FiNavigation className="w-3 h-3 mr-1" />
                        Get Location
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                            toast.info("On iOS, please enable Location Services in Settings > Privacy > Location Services");
                          } else {
                            toast.info("Please allow location access in your browser permissions");
                          }
                        }}
                      >
                        <FiAlertCircle className="w-3 h-3 mr-1" />
                        Help
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            
            {/* Check In/Out Buttons */}
            <AnimatePresence mode="wait">
              {status === 'not-checked-in' && (
                <motion.div
                  key="check-in"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full"
                >
                  <Button 
                    onClick={() => handleAttendance('check-in')} 
                    className="w-full flex items-center justify-center gap-2 h-11 md:h-12"
                    disabled={isLoading || locationLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiCheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                    <span className="truncate">
                      {isLoading ? 'Checking in...' : 'Check In'}
                    </span>
                  </Button>
                </motion.div>
              )}
              
              {status === 'checked-in' && (
                <motion.div
                  key="check-out"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-2 w-full"
                >
                  <Button 
                    onClick={() => handleAttendance('check-out')} 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 h-11 md:h-12
                              dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiXCircle className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                    <span className="truncate">
                      {isLoading ? 'Checking out...' : 'Check Out'}
                    </span>
                  </Button>
                  
                  {/* Work Progress Indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground 
                                    dark:text-gray-400">
                      <span>Work Progress</span>
                      <span>{workProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={workProgress} className="h-1.5 w-full" />
                  </div>
                </motion.div>
              )}
              
              {status === 'checked-out' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full"
                >
                  <Badge className="px-4 py-2 bg-green-50 text-green-700 border-green-200 
                                    hover:bg-green-50 w-full justify-center
                                    dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 
                                    dark:hover:bg-green-900/40">
                    <FiCheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                    <span className="truncate">Completed for today</span>
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Time Display - Optimized for mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                          border hover:shadow-sm overflow-hidden
                          dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-800 shrink-0">
                    <FiSunrise className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 
                                         dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground 
                                 dark:text-gray-400 truncate">
                    Check In
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-card-foreground 
                               dark:text-gray-100 mb-1 truncate">
                  {TimeUtils.formatTime(currentRecord?.checkIn)}
                </div>
                {currentRecord?.checkInLocation?.address && (
                  <div className="text-xs text-muted-foreground truncate 
                                 dark:text-gray-500 px-1">
                    {truncateAddress(currentRecord.checkInLocation.address, 40)}
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                          border hover:shadow-sm overflow-hidden
                          dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-800 shrink-0">
                    <FiSunset className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 
                                        dark:text-purple-400" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground 
                                 dark:text-gray-400 truncate">
                    Check Out
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-card-foreground 
                               dark:text-gray-100 mb-1 truncate">
                  {TimeUtils.formatTime(currentRecord?.checkOut)}
                </div>
                {currentRecord?.checkOutLocation?.address && (
                  <div className="text-xs text-muted-foreground truncate 
                                 dark:text-gray-500 px-1">
                    {truncateAddress(currentRecord.checkOutLocation.address, 40)}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Additional Info - Responsive grid */}
            {currentRecord && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
              >
                <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                              transition-shadow dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FiWatch className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground 
                                       dark:text-gray-400 shrink-0" />
                    <div className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                      Total Hours
                    </div>
                  </div>
                  <div className="text-lg md:text-xl font-semibold text-card-foreground 
                                 dark:text-gray-100 truncate">
                    {currentRecord.totalHours?.toFixed(1) || '0'}h
                  </div>
                </div>
                
                {currentRecord.overtimeHours && currentRecord.overtimeHours > 0 ? (
                  <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100 
                                hover:shadow-sm transition-shadow overflow-hidden
                                dark:bg-amber-900/20 dark:border-amber-800">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <FiTrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 
                                             dark:text-amber-500 shrink-0" />
                      <div className="text-xs text-amber-700 dark:text-amber-400 truncate">
                        Overtime
                      </div>
                    </div>
                    <div className="text-lg md:text-xl font-semibold text-amber-700 
                                   dark:text-amber-400 truncate">
                      +{currentRecord.overtimeHours.toFixed(1)}h
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                                transition-shadow dark:border-gray-700 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1 dark:text-gray-400 truncate">
                      Status
                    </div>
                    <div className="truncate">
                      {getStatusBadge(currentRecord.status)}
                    </div>
                  </div>
                )}

                <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                              transition-shadow dark:border-gray-700 overflow-hidden">
                  <div className="text-xs text-muted-foreground mb-1 dark:text-gray-400 truncate">
                    Arrival Time
                  </div>
                  <div className="text-lg md:text-xl font-semibold text-card-foreground 
                                 dark:text-gray-100 truncate">
                    {TimeUtils.formatTime(currentRecord.checkIn)}
                  </div>
                </div>

                <div className="text-center p-3 rounded-lg bg-background border hover:shadow-sm 
                              transition-shadow dark:border-gray-700 overflow-hidden">
                  <div className="text-xs text-muted-foreground mb-1 dark:text-gray-400 truncate">
                    Current Status
                  </div>
                  <div className="truncate">
                    {getStatusBadge(TimeUtils.calculateStatus(currentRecord.checkIn))}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History - Mobile optimized */}
        <div className="w-full overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base md:text-lg font-semibold text-card-foreground 
                          dark:text-gray-100 flex items-center gap-2 truncate">
              <FiClock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground 
                                 dark:text-gray-400 shrink-0" />
              <span className="truncate">Recent Attendance</span>
            </h4>
            <Badge variant="outline" className="text-xs dark:border-gray-600 shrink-0">
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
                className="w-full"
              >
                <Card className="border-border hover:shadow-sm transition-shadow cursor-pointer 
                                group dark:bg-gray-900/50 dark:border-gray-800 w-full overflow-hidden">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 
                                         dark:bg-primary/20 flex items-center justify-center">
                            <FiCalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary 
                                                     dark:text-primary" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="text-sm font-medium dark:text-gray-200 truncate">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="hidden sm:block shrink-0">
                              {getStatusBadge(record.status)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 
                                        text-xs text-muted-foreground dark:text-gray-500">
                            <div className="flex items-center gap-1 shrink-0">
                              <FiSunrise className="w-3 h-3 shrink-0" />
                              <span className="truncate">{TimeUtils.formatTime(record.checkIn)}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <FiSunset className="w-3 h-3 shrink-0" />
                              <span className="truncate">{TimeUtils.formatTime(record.checkOut)}</span>
                            </div>
                            {record.totalHours && (
                              <div className="flex items-center gap-1 shrink-0">
                                <FiWatch className="w-3 h-3 shrink-0" />
                                <span className="truncate">{record.totalHours.toFixed(1)}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-normal">
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
                        <div className="truncate flex-1">
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
    </div>
  );
};

export default AttendanceTracker;