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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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

// ==================== TIME UTILITIES ====================
const TimeUtils = {
  getCurrentDhakaTime: () => new Date(new Date().getTime() + 6 * 60 * 60 * 1000),

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

  normalizeTimeString: (timeValue?: string | Date | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    let timeStr: string;
    if (typeof timeValue !== 'string') {
      try { timeStr = timeValue.toISOString(); } catch { return '--:--'; }
    } else { timeStr = timeValue; }
    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (timeStr.includes('T')) timeStr = timeStr.split('T')[1];
    if (timeStr.includes(' ')) { const parts = timeStr.split(' '); if (parts.length > 1) timeStr = parts[1]; }
    timeStr = timeStr.replace(/[Z+-].*$/, '').replace(/\.\d+$/, '');
    const match = timeStr.match(/\d{1,2}:\d{2}/);
    if (match) {
      const [h, m] = match[0].split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    return '--:--';
  },

  formatTime12h: (timeValue?: string | Date | null): string => {
    const normalized = TimeUtils.normalizeTimeString(timeValue);
    if (normalized === '--:--') return '--:--';
    const [hours, minutes] = normalized.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  },

  formatTimeForTable: (timeValue?: string | Date | null): string => {
    const normalized = TimeUtils.normalizeTimeString(timeValue);
    if (normalized === '--:--') return '--:--';
    const [hours, minutes] = normalized.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')}${ampm}`;
  },

  formatDate: (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00+06:00');
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return ''; }
  },

  calculateStatus: (checkInTime?: string | Date | null): string => {
    if (!checkInTime) return 'absent';
    const formatted = TimeUtils.formatTime12h(checkInTime);
    if (formatted === '--:--') return 'absent';
    try {
      const match = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 'present';
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const total = hours * 60 + minutes;
      if (total > 11 * 60) return 'half-day';
      if (total > 9 * 60 + 5) return 'late';
      return 'present';
    } catch { return 'present'; }
  },

  calculateWorkingHours: (checkInTime?: string | Date | null, checkOutTime?: string | Date | null): number => {
    if (!checkInTime || !checkOutTime) return 0;
    try {
      const getMinutes = (t: string | Date): number => {
        const f = TimeUtils.formatTime12h(t);
        const m = f.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 0;
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const a = m[3].toUpperCase();
        if (a === 'PM' && h !== 12) h += 12;
        if (a === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };
      const inMin = getMinutes(checkInTime);
      const outMin = getMinutes(checkOutTime);
      if (inMin === 0 || outMin === 0) return 0;
      let total = outMin - inMin;
      if (total > 4 * 60) total -= 60; // lunch break
      return Math.min(Math.max(total / 60, 0), 9);
    } catch { return 0; }
  },

  formatDateForCSV: (dateString: string) => dateString,
  formatTimeForCSV: (timeValue?: string | Date | null) => TimeUtils.formatTime12h(timeValue)
};

// ==================== ADDRESS UTILITIES ====================
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

// ==================== CSV UTILITIES ====================
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

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  attendance,
  currentUser,
  onAttendanceUpdate
}) => {
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
  const [isMobile, setIsMobile] = useState(false);

  const locationWatchId = useRef<number | null>(null);
  const locationRetryCount = useRef(0);
  const maxRetries = 3;
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Responsive
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Find today's record
  const currentRecord = attendance.find(record => {
    try {
      let recordDateStr: string;
      if (typeof record.date === 'string') {
        recordDateStr = record.date.split('T')[0];
      } else if (record.date && typeof record.date === 'object' && typeof (record.date as any).toISOString === 'function') {
        recordDateStr = (record.date as Date).toISOString().split('T')[0];
      } else {
        recordDateStr = String(record.date);
      }
      return recordDateStr === currentDhakaDate;
    } catch { return false; }
  });

  useEffect(() => {
    const updateTime = () => {
      setCurrentDhakaTime(TimeUtils.getFormattedDhakaTime());
      setCurrentDhakaDate(TimeUtils.getDhakaDate());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
    } catch { throw new Error('Geocoding failed'); }
  };

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

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setLocationError("Tap 'Get Precise Location' button.");
      return;
    }
    fetchUserLocation(true);
  }, []);

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
    } catch { return 0; }
  };

  const getCurrentTimeStatus = () => {
    const currentMinutes = currentDhakaTime.hours * 60 + currentDhakaTime.minutes;
    if (currentMinutes > 11 * 60) return { status: 'half-day', message: 'After 11:00 AM is half day' };
    if (currentMinutes > 9 * 60 + 5) return { status: 'late', message: 'After 9:05 AM is late' };
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
          {/* Today's Card */}
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
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
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
                    <DialogContent className="sm:max-w-100">
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
              {/* Combined row: location + check buttons */}
              <div className="flex flex-col md:flex-row gap-2">
                {/* Location display - left side */}
                <div className="flex-1 min-w-0">
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
                            <FiMapPin className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm truncate">{userLocation.address?.split(',')[0] || 'Location acquired'}</span>
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
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-sm flex items-center justify-between">
                        <span>{locationError}</span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => fetchUserLocation(true)}>Retry</Button>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Check In/Out Buttons - right side */}
                <div className="md:w-64 shrink-0">
                  <AnimatePresence mode="wait">
                    {status === 'not-checked-in' && (
                      <motion.div key="check-in">
                        <Button onClick={() => handleAttendance('check-in')} className="w-full gap-2 h-10 text-base" disabled={isLoading || locationLoading}>
                          {isLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                          {isLoading ? 'Checking in...' : 'Check In'}
                        </Button>
                      </motion.div>
                    )}
                    {status === 'checked-in' && (
                      <motion.div key="check-out" className="space-y-2">
                        <Button onClick={() => handleAttendance('check-out')} variant="outline" className="w-full gap-2 h-10 text-base" disabled={isLoading}>
                          {isLoading ? <FiLoader className="animate-spin" /> : <FiXCircle />}
                          {isLoading ? 'Checking out...' : 'Check Out'}
                        </Button>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Work Progress</span>
                            <span>{workProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={workProgress} className="h-1.5" />
                        </div>
                      </motion.div>
                    )}
                    {status === 'checked-out' && (
                      <Badge className="w-full py-2 bg-green-100 text-green-800 border-green-200 justify-center text-base">
                        <FiCheckCircle className="mr-2" /> Attendance Completed
                      </Badge>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Time boxes with location details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FiSunrise className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Check In</span>
                  </div>
                  <div className="text-lg font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkIn)}</div>
                  {currentRecord?.checkInLocation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate mt-1 cursor-help" title={currentRecord.checkInLocation.address}>
                          {currentRecord.checkInLocation.address?.split(',')[0]}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs wrap-break-word">{currentRecord.checkInLocation.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FiSunset className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Check Out</span>
                  </div>
                  <div className="text-lg font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkOut)}</div>
                  {currentRecord?.checkOutLocation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate mt-1 cursor-help" title={currentRecord.checkOutLocation.address}>
                          {currentRecord.checkOutLocation.address?.split(',')[0]}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs wrap-break-word">{currentRecord.checkOutLocation.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Stats */}
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

          {/* Recent Attendance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Recent
              </h4>
              <div className="flex items-center gap-2">
                <Select value={csvExportType} onValueChange={(v: any) => setCsvExportType(v)}>
                  <SelectTrigger className="h-8 w-20 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-sm gap-1" onClick={handleExportCSV} disabled={isExporting || attendance.length === 0}>
                  {isExporting ? <FiLoader className="animate-spin w-3 h-3" /> : <FiDownload className="w-3 h-3" />}
                  CSV
                </Button>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {attendance.slice(0, 10).map((record) => (
                <Card key={record.id} className="border-border dark:bg-gray-900/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCalendarIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">In:</span> {TimeUtils.formatTimeForTable(record.checkIn)}</div>
                      <div><span className="text-muted-foreground">Out:</span> {TimeUtils.formatTimeForTable(record.checkOut)}</div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hours: {record.totalHours?.toFixed(1)}h</span>
                      {record.overtimeHours ? <span className="text-amber-600">+{record.overtimeHours.toFixed(1)}h OT</span> : null}
                    </div>
                    {/* Locations on mobile */}
                    <div className="pt-1 border-t text-xs space-y-1">
                      {record.checkInLocation && (
                        <div className="flex items-start gap-1">
                          <FiMapPin className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground wrap-break-word" title={record.checkInLocation.address}>
                            In: {record.checkInLocation.address}
                          </span>
                        </div>
                      )}
                      {record.checkOutLocation && (
                        <div className="flex items-start gap-1">
                          <FiMapPin className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground wrap-break-word" title={record.checkOutLocation.address}>
                            Out: {record.checkOutLocation.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {attendance.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">No attendance records</div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border overflow-hidden">
              <div className="max-h-100 overflow-y-auto">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="text-sm px-3 py-2">Date</TableHead>
                      <TableHead className="text-sm px-3 py-2 text-center">In</TableHead>
                      <TableHead className="text-sm px-3 py-2 text-center">Out</TableHead>
                      <TableHead className="text-sm px-3 py-2 text-center">Hours</TableHead>
                      <TableHead className="text-sm px-3 py-2 text-center">Status</TableHead>
                      <TableHead className="text-sm px-3 py-2">Locations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 10).map((record) => {
                      const hours = record.totalHours?.toFixed(1) || '0.0';
                      const overtime = record.overtimeHours;
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                            {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-sm">
                            {TimeUtils.formatTimeForTable(record.checkIn)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-sm">
                            {TimeUtils.formatTimeForTable(record.checkOut)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-sm">
                            {hours}h
                            {overtime ? <span className="text-amber-600 text-xs block">+{overtime.toFixed(1)}h OT</span> : null}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center">
                            {getStatusBadge(record.status)}
                          </TableCell>
                          <TableCell className="px-3 py-2 max-w-50">
                            <div className="space-y-1">
                              {record.checkInLocation && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground truncate cursor-help">
                                      <FiMapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">In: {record.checkInLocation.address?.split(',')[0]}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="text-sm wrap-break-word">In: {record.checkInLocation.address}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {record.checkOutLocation && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground truncate cursor-help">
                                      <FiMapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">Out: {record.checkOutLocation.address?.split(',')[0]}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="text-sm wrap-break-word">Out: {record.checkOutLocation.address}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {!record.checkInLocation && !record.checkOutLocation && (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                          No attendance records
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};

export default AttendanceTracker;