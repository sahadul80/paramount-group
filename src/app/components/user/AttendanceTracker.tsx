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
  FiNavigation,
  FiMap,
  FiGlobe,
  FiCrosshair,
  FiChevronDown,
  FiChevronUp,
  FiDownload
} from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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

interface GeocodedAddress {
  formatted: string;
  components: {
    street?: string;
    neighborhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  accuracy?: number;
}

// Centralized time utilities
const TimeUtils = {
  getCurrentDhakaTime: () => {
    const now = new Date();
    return new Date(now.getTime() + (6 * 60 * 60 * 1000));
  },

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

  getDhakaDate: () => {
    const dhakaTime = TimeUtils.getCurrentDhakaTime();
    const year = dhakaTime.getUTCFullYear();
    const month = (dhakaTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dhakaTime.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatTime12h: (timeValue?: string | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    try {
      let hours: number, minutes: number;
      if (/^\d{2}:\d{2}$/.test(timeValue)) {
        [hours, minutes] = timeValue.split(':').map(Number);
      } else {
        const date = new Date(timeValue);
        if (isNaN(date.getTime())) return '--:--';
        hours = date.getUTCHours();
        minutes = date.getUTCMinutes();
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return '--:--';
    }
  },

  formatTimeForTable: (timeValue?: string | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    try {
      let hours: number, minutes: number;
      if (/^\d{2}:\d{2}$/.test(timeValue)) {
        [hours, minutes] = timeValue.split(':').map(Number);
      } else {
        const date = new Date(timeValue);
        if (isNaN(date.getTime())) return '--:--';
        hours = date.getUTCHours();
        minutes = date.getUTCMinutes();
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')}${ampm}`;
    } catch {
      return '--:--';
    }
  },

  formatDate: (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00+06:00');
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  },

  calculateStatus: (checkInTime?: string): string => {
    if (!checkInTime) return 'absent';
    const formattedTime = TimeUtils.formatTime12h(checkInTime);
    if (formattedTime === '--:--') return 'absent';
    try {
      const timeMatch = formattedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return 'present';
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const checkInTotalMinutes = hours * 60 + minutes;
      const nineFiveAM = 9 * 60 + 5;
      const elevenAM = 11 * 60;
      if (checkInTotalMinutes > elevenAM) return 'half-day';
      if (checkInTotalMinutes > nineFiveAM) return 'late';
      return 'present';
    } catch {
      return 'present';
    }
  },

  calculateWorkingHours: (checkInTime?: string, checkOutTime?: string): number => {
    if (!checkInTime || !checkOutTime) return 0;
    try {
      const getMinutes = (timeStr: string): number => {
        const formatted = TimeUtils.formatTime12h(timeStr);
        const timeMatch = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return 0;
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const inMinutes = getMinutes(checkInTime);
      const outMinutes = getMinutes(checkOutTime);
      if (inMinutes === 0 || outMinutes === 0) return 0;
      let totalMinutes = outMinutes - inMinutes;
      if (totalMinutes > 4 * 60) totalMinutes -= 60;
      return Math.min(totalMinutes / 60, 9);
    } catch {
      return 0;
    }
  },

  formatDateForCSV: (dateString: string) => dateString,
  formatTimeForCSV: (timeValue?: string | null) => TimeUtils.formatTime12h(timeValue)
};

// Address utilities
const AddressUtils = {
  formatFullAddress: (address: GeocodedAddress): string => {
    if (address.formatted) return address.formatted;
    const parts = [];
    if (address.components.street) parts.push(address.components.street);
    if (address.components.neighborhood) parts.push(address.components.neighborhood);
    if (address.components.suburb) parts.push(address.components.suburb);
    if (address.components.city) parts.push(address.components.city);
    if (address.components.state) parts.push(address.components.state);
    if (address.components.postcode) parts.push(address.components.postcode);
    if (address.components.country) parts.push(address.components.country);
    return parts.join(', ');
  },

  parseAddressString: (addressString: string): GeocodedAddress => {
    try {
      const parsed = JSON.parse(addressString);
      if (parsed.components && parsed.formatted) return parsed;
    } catch {}
    const parts = addressString.split(',').map(p => p.trim());
    return {
      formatted: addressString,
      components: {
        street: parts[0] || '',
        neighborhood: parts[1],
        city: parts.find(p => p.includes('City') || p.includes('Dhaka')) || parts[2],
        state: parts.find(p => p.includes('Division') || p.includes('State')),
        country: parts.find(p => p.includes('Bangladesh') || p.includes('BD')),
        postcode: parts.find(p => /^\d{4,6}$/.test(p))
      }
    };
  }
};

// CSV utilities
const CSVUtils = {
  generateCSVData: (attendance: AttendanceRecord[], includeDetails: boolean = true): string => {
    const headers = includeDetails 
      ? ['Date','Day','Check In','Check Out','Working Hours','Overtime','Status','Check In Location','Check Out Location']
      : ['Date','Day','Check In','Check Out','Working Hours','Overtime','Status'];
    const rows = attendance.map(record => {
      const date = new Date(record.date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const baseRow = [
        TimeUtils.formatDateForCSV(record.date),
        day,
        TimeUtils.formatTimeForCSV(record.checkIn),
        TimeUtils.formatTimeForCSV(record.checkOut),
        record.totalHours?.toFixed(2) || '0.00',
        record.overtimeHours?.toFixed(2) || '0.00',
        record.status.toUpperCase()
      ];
      if (includeDetails) {
        return [...baseRow, record.checkInLocation?.address || 'N/A', record.checkOutLocation?.address || 'N/A'];
      }
      return baseRow;
    });
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  },

  downloadCSV: (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ attendance, currentUser, onAttendanceUpdate }) => {
  // State
  const [currentDhakaTime, setCurrentDhakaTime] = useState(TimeUtils.getFormattedDhakaTime());
  const [currentDhakaDate, setCurrentDhakaDate] = useState(TimeUtils.getDhakaDate());
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number; lng: number; address?: string; geocoded?: GeocodedAddress; accuracy?: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<'high'|'medium'|'low'|'unknown'>('unknown');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequestData>({
    startDate: TimeUtils.getDhakaDate(),
    endDate: TimeUtils.getDhakaDate(),
    leaveType: 'casual',
    reason: ''
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  const [csvExportType, setCsvExportType] = useState<'detailed'|'summary'>('detailed');
  const [isExporting, setIsExporting] = useState(false);

  const locationWatchId = useRef<number | null>(null);
  const locationRetryCount = useRef(0);
  const maxRetries = 3;
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const currentRecord = attendance.find(r => r.date === currentDhakaDate);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentDhakaTime(TimeUtils.getFormattedDhakaTime());
      setCurrentDhakaDate(TimeUtils.getDhakaDate());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Geocoding (simplified, keep original implementation)
  const geocodeCoordinates = async (latitude: number, longitude: number): Promise<GeocodedAddress> => {
    try {
      const services = [
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      ];
      for (const service of services) {
        try {
          const response = await fetch(service, { headers: { 'Accept': 'application/json', 'User-Agent': 'AttendanceTrackerApp/1.0' } });
          if (response.ok) {
            const data = await response.json();
            if (service.includes('nominatim')) {
              return {
                formatted: data.display_name,
                components: {
                  street: data.address?.road || data.address?.street,
                  neighborhood: data.address?.neighbourhood,
                  suburb: data.address?.suburb,
                  city: data.address?.city || data.address?.town,
                  state: data.address?.state,
                  country: data.address?.country,
                  postcode: data.address?.postcode
                }
              };
            } else {
              return {
                formatted: `${data.locality}, ${data.city}, ${data.principalSubdivision}`,
                components: {
                  street: data.locality,
                  city: data.city,
                  state: data.principalSubdivision,
                  country: data.countryName,
                  postcode: data.postcode
                }
              };
            }
          }
        } catch { continue; }
      }
      return {
        formatted: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
        components: { street: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }
      };
    } catch {
      throw new Error('Geocoding failed');
    }
  };

  // Location fetching
  const fetchUserLocation = async (highAccuracy: boolean = true) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      toast.error("Your browser doesn't support location services");
      return false;
    }
    setLocationLoading(true);
    setLocationError(null);
    setLocationAccuracy('unknown');

    return new Promise<boolean>((resolve) => {
      const onSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy <= 20) setLocationAccuracy('high');
        else if (accuracy <= 100) setLocationAccuracy('medium');
        else setLocationAccuracy('low');
        try {
          const geocodedAddress = await geocodeCoordinates(latitude, longitude);
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: AddressUtils.formatFullAddress(geocodedAddress),
            geocoded: geocodedAddress,
            accuracy
          });
          if (locationWatchId.current !== null) navigator.geolocation.clearWatch(locationWatchId.current);
          locationRetryCount.current = 0;
          setLocationLoading(false);
          toast.success(`Location acquired (${locationAccuracy} accuracy)`);
          resolve(true);
        } catch {
          setUserLocation({ lat: latitude, lng: longitude, address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`, accuracy });
          setLocationLoading(false);
          toast.success("Location acquired (address unavailable)");
          resolve(true);
        }
      };

      const onError = (error: GeolocationPositionError) => {
        let msg = "Could not get location.";
        if (error.code === error.PERMISSION_DENIED) msg = "Permission denied.";
        else if (error.code === error.POSITION_UNAVAILABLE) msg = "Position unavailable.";
        else if (error.code === error.TIMEOUT) {
          if (locationRetryCount.current < maxRetries) {
            locationRetryCount.current++;
            setTimeout(() => fetchUserLocation(locationRetryCount.current === 1), locationRetryCount.current * 3000);
            toast.info(`Retry attempt ${locationRetryCount.current}...`);
            return;
          }
          msg = "Request timed out.";
        }
        setLocationError(msg);
        setLocationLoading(false);
        toast.error(msg);
        resolve(false);
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0
      });
    });
  };

  // Attempt to get location on mount (skip iOS Safari)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setLocationError("Tap 'Get Precise Location' button.");
      return;
    }
    fetchUserLocation(true);
  }, []);

  // Periodic location updates
  useEffect(() => {
    if (userLocation && !locationLoading) {
      if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = setInterval(() => fetchUserLocation(false), 5 * 60 * 1000);
    }
    return () => {
      if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
      if (locationWatchId.current !== null) navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [userLocation, locationLoading]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Present</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">Absent</Badge>;
      case 'late': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">Late</Badge>;
      case 'half-day': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">Half Day</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAccuracyBadge = (accuracy: 'high'|'medium'|'low'|'unknown') => {
    switch (accuracy) {
      case 'high': return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300"><FiCrosshair className="w-3 h-3 mr-1" />High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"><FiMap className="w-3 h-3 mr-1" />Medium</Badge>;
      case 'low': return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300"><FiGlobe className="w-3 h-3 mr-1" />Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCurrentStatus = () => {
    if (!currentRecord) return 'not-checked-in';
    if (currentRecord.checkIn && !currentRecord.checkOut) return 'checked-in';
    if (currentRecord.checkIn && currentRecord.checkOut) return 'checked-out';
    return 'not-checked-in';
  };

  const handleAttendance = async (type: 'check-in' | 'check-out') => {
    if (!userLocation) {
      toast.error("Location required.");
      const success = await fetchUserLocation(true);
      if (success) toast.info("Location acquired. Please try again.");
      return;
    }
    if (locationAccuracy === 'low') toast.warning("Low location accuracy.");
    setIsLoading(true);
    try {
      const dhakaTimestamp = TimeUtils.getCurrentDhakaTime().toISOString();
      const response = await fetch('/api/user/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          type,
          location: { ...userLocation, accuracy: locationAccuracy, timestamp: new Date().toISOString() },
          time: currentDhakaTime.formatted12h,
          date: currentDhakaDate,
          timestamp: dhakaTimestamp,
          timezone: 'Asia/Dhaka',
          status: type === 'check-in' ? TimeUtils.calculateStatus(currentDhakaTime.formatted12h) : undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Attendance failed');
      toast.success(`Successfully ${type} at ${currentDhakaTime.formatted12h}`);
      onAttendanceUpdate();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWorkProgress = () => {
    if (!currentRecord?.checkIn || currentRecord.checkOut) return 0;
    try {
      const checkInFormatted = TimeUtils.formatTime12h(currentRecord.checkIn);
      const timeMatch = checkInFormatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return 0;
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const checkInMinutes = hours * 60 + minutes;
      const currentMinutes = currentDhakaTime.hours * 60 + currentDhakaTime.minutes;
      const elapsed = currentMinutes - checkInMinutes;
      return Math.min(Math.max((elapsed / (9 * 60)) * 100, 0), 100);
    } catch {
      return 0;
    }
  };

  const getCurrentTimeStatus = () => {
    const currentMinutes = currentDhakaTime.hours * 60 + currentDhakaTime.minutes;
    if (currentMinutes > 11 * 60) return { status: 'half-day', message: 'After 11:00 AM is half day' };
    if (currentMinutes > 9 * 60 + 30) return { status: 'late', message: 'After 9:30 AM is late' };
    return { status: 'on-time', message: 'You can check in' };
  };

  const handleLeaveRequest = async () => {
    if (!leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmittingLeave(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Leave request submitted (demo)');
      setShowLeaveDialog(false);
      setLeaveRequest({ startDate: TimeUtils.getDhakaDate(), endDate: TimeUtils.getDhakaDate(), leaveType: 'casual', reason: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const formatTableLocation = (record: AttendanceRecord) => {
    const loc = record.checkInLocation?.address;
    if (!loc) return null;
    const isExpanded = expandedLocationId === record.id;
    return (
      <div className="flex items-start gap-1 max-w-[180px]">
        <FiMapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className={`text-xs text-muted-foreground ${!isExpanded ? 'truncate' : 'break-words'}`}>
            {loc}
          </div>
          {loc.length > 50 && (
            <button
              className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1"
              onClick={() => setExpandedLocationId(isExpanded ? null : record.id)}
            >
              {isExpanded ? <><FiChevronUp className="w-3 h-3" /> Less</> : <><FiChevronDown className="w-3 h-3" /> More</>}
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const displayed = attendance.slice(0, 10);
      if (displayed.length === 0) throw new Error("No data");
      const csv = CSVUtils.generateCSVData(displayed, csvExportType === 'detailed');
      CSVUtils.downloadCSV(csv, `attendance_${currentUser.username}_${TimeUtils.getDhakaDate()}_${csvExportType}.csv`);
      toast.success(`Exported ${csvExportType} data`);
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const status = getCurrentStatus();
  const workProgress = calculateWorkProgress();
  const timeStatus = getCurrentTimeStatus();
  const displayDate = TimeUtils.formatDate(currentDhakaDate);

  return (
    <TooltipProvider>
      <div className="w-full max-w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Today's Card - Compact */}
          <Card className="border-border shadow-sm dark:bg-gray-900/50">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <FiCalendar className="w-4 h-4 text-primary" />
                    </div>
                    <span>Today's Attendance</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{displayDate}</span>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-900/30">GMT+6</Badge>
                    <span className="text-muted-foreground">{currentDhakaTime.formatted12h}</span>
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-900/30">9h day</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <FiFileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                        <DialogDescription>Fill out the form (demo).</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" type="date" value={leaveRequest.startDate} onChange={e => setLeaveRequest({...leaveRequest, startDate: e.target.value})} />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input id="endDate" type="date" value={leaveRequest.endDate} onChange={e => setLeaveRequest({...leaveRequest, endDate: e.target.value})} min={leaveRequest.startDate} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="leaveType">Leave Type</Label>
                          <Select value={leaveRequest.leaveType} onValueChange={v => setLeaveRequest({...leaveRequest, leaveType: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="sick">Sick</SelectItem>
                              <SelectItem value="earned">Earned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea id="reason" value={leaveRequest.reason} onChange={e => setLeaveRequest({...leaveRequest, reason: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>Cancel</Button>
                        <Button onClick={handleLeaveRequest} disabled={isSubmittingLeave}>
                          {isSubmittingLeave ? <FiLoader className="animate-spin mr-2" /> : null}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Location display - compact collapsible */}
              <AnimatePresence>
                {locationLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 rounded-lg bg-muted/50 border flex items-center gap-2 text-sm">
                    <FiLoader className="animate-spin w-4 h-4" />
                    <span>Getting location...</span>
                  </motion.div>
                ) : userLocation ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 rounded-lg bg-blue-50/50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FiMapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs truncate">{userLocation.address?.split(',')[0] || 'Location acquired'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getAccuracyBadge(locationAccuracy)}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLocationDetails(!showLocationDetails)}>
                          <FiMap className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchUserLocation(true)}>
                          <FiRefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {showLocationDetails && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="mt-2 pt-2 border-t text-xs text-muted-foreground grid grid-cols-2 gap-1"
                      >
                        <div>Lat: {userLocation.lat.toFixed(6)}</div>
                        <div>Lng: {userLocation.lng.toFixed(6)}</div>
                        <div className="col-span-2 truncate">{userLocation.address}</div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : locationError ? (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                    <span>{locationError}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => fetchUserLocation(true)}>Retry</Button>
                  </div>
                ) : null}
              </AnimatePresence>

              {/* Check In/Out Buttons */}
              <AnimatePresence mode="wait">
                {status === 'not-checked-in' && (
                  <motion.div key="check-in">
                    <Button onClick={() => handleAttendance('check-in')} className="w-full gap-2 h-10" disabled={isLoading || locationLoading}>
                      {isLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                      {isLoading ? 'Checking in...' : 'Check In'}
                    </Button>
                  </motion.div>
                )}
                {status === 'checked-in' && (
                  <motion.div key="check-out" className="space-y-2">
                    <Button onClick={() => handleAttendance('check-out')} variant="outline" className="w-full gap-2 h-10" disabled={isLoading}>
                      {isLoading ? <FiLoader className="animate-spin" /> : <FiXCircle />}
                      {isLoading ? 'Checking out...' : 'Check Out'}
                    </Button>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Work Progress</span>
                        <span>{workProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={workProgress} className="h-1.5" />
                    </div>
                  </motion.div>
                )}
                {status === 'checked-out' && (
                  <Badge className="w-full py-2 bg-green-100 text-green-800 border-green-200 justify-center">
                    <FiCheckCircle className="mr-2" /> Attendance Completed
                  </Badge>
                )}
              </AnimatePresence>

              {/* Time boxes - smaller */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FiSunrise className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Check In</span>
                  </div>
                  <div className="text-base font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkIn)}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FiSunset className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-muted-foreground">Check Out</span>
                  </div>
                  <div className="text-base font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkOut)}</div>
                </div>
              </div>

              {/* Stats - compact grid */}
              {currentRecord && (
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-muted-foreground">Hours</div>
                    <div className="text-sm font-medium">{currentRecord.totalHours?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm">{getStatusBadge(currentRecord.status)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-muted-foreground">Arrival</div>
                    <div className="text-sm font-medium">{TimeUtils.formatTime12h(currentRecord.checkIn)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-muted-foreground">Late</div>
                    <div className="text-sm">{TimeUtils.calculateStatus(currentRecord.checkIn) === 'late' ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance - compact list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Recent
              </h4>
              <div className="flex items-center gap-2">
                <Select value={csvExportType} onValueChange={(v: any) => setCsvExportType(v)}>
                  <SelectTrigger className="h-7 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportCSV} disabled={isExporting || attendance.length === 0}>
                  {isExporting ? <FiLoader className="animate-spin w-3 h-3" /> : <FiDownload className="w-3 h-3" />}
                  CSV
                </Button>
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 mb-1 text-xs font-medium text-muted-foreground">
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-center">In</div>
              <div className="col-span-2 text-center">Out</div>
              <div className="col-span-2 text-center">Hours</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2">Location</div>
            </div>

            <div className="space-y-1">
              {attendance.slice(0, 10).map((record, idx) => (
                <Card key={record.id} className="border-border dark:bg-gray-900/50">
                  <CardContent className="p-2">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiCalendarIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">In:</span> {TimeUtils.formatTimeForTable(record.checkIn)}</div>
                        <div><span className="text-muted-foreground">Out:</span> {TimeUtils.formatTimeForTable(record.checkOut)}</div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Hours: {record.totalHours?.toFixed(1)}h</span>
                        {record.overtimeHours ? <span className="text-amber-600">+{record.overtimeHours.toFixed(1)}h OT</span> : null}
                      </div>
                      {formatTableLocation(record) && <div className="pt-1 border-t">{formatTableLocation(record)}</div>}
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-2 items-center text-sm">
                      <div className="col-span-2">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="col-span-2 text-center">{TimeUtils.formatTimeForTable(record.checkIn)}</div>
                      <div className="col-span-2 text-center">{TimeUtils.formatTimeForTable(record.checkOut)}</div>
                      <div className="col-span-2 text-center">
                        {record.totalHours?.toFixed(1)}h
                        {record.overtimeHours ? <span className="text-xs text-amber-600 block">+{record.overtimeHours.toFixed(1)}h OT</span> : null}
                      </div>
                      <div className="col-span-2 text-center">{getStatusBadge(record.status)}</div>
                      <div className="col-span-2">{formatTableLocation(record)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {attendance.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">No attendance records</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};

export default AttendanceTracker;