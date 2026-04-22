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
      if (total > 4 * 60) total -= 60;
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
      case 'present': return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-[10px] px-1.5 py-0">Present</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 text-[10px] px-1.5 py-0">Absent</Badge>;
      case 'late': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 text-[10px] px-1.5 py-0">Late</Badge>;
      case 'half-day': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-1.5 py-0">Half Day</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Unknown</Badge>;
    }
  };

  const getAccuracyBadge = (accuracy: 'high'|'medium'|'low'|'unknown') => {
    switch (accuracy) {
      case 'high': return <Badge className="bg-green-100 text-green-800 text-[9px] px-1 py-0"><FiCrosshair className="w-2 h-2 mr-0.5" />High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 text-[9px] px-1 py-0"><FiMap className="w-2 h-2 mr-0.5" />Med</Badge>;
      case 'low': return <Badge className="bg-red-100 text-red-800 text-[9px] px-1 py-0"><FiGlobe className="w-2 h-2 mr-0.5" />Low</Badge>;
      default: return <Badge variant="outline" className="text-[9px] px-1 py-0">Unknown</Badge>;
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Today's Card */}
          <Card className="border-border shadow-sm dark:bg-gray-900/50">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex flex-wrap items-start justify-between gap-1">
                <div className="space-y-0.5">
                  <CardTitle className="flex items-center gap-1 text-sm">
                    <div className="p-1 rounded-lg bg-primary/10">
                      <FiCalendar className="w-3 h-3 text-primary" />
                    </div>
                    <span>Today's Attendance</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="text-muted-foreground">{displayDate}</span>
                    <Badge variant="outline" className="text-[9px] px-1">GMT+6</Badge>
                    <span className="text-muted-foreground">{currentDhakaTime.formatted12h}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                        <FiFileText className="w-3 h-3" />
                        <span className="hidden sm:inline">Leave</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[90vw] md:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm">Submit Leave Request</DialogTitle>
                        <DialogDescription className="text-xs">Fill out the form (demo).</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Start Date</Label>
                            <Input type="date" value={leaveRequest.startDate} onChange={e => setLeaveRequest({...leaveRequest, startDate: e.target.value})} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">End Date</Label>
                            <Input type="date" value={leaveRequest.endDate} onChange={e => setLeaveRequest({...leaveRequest, endDate: e.target.value})} min={leaveRequest.startDate} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Leave Type</Label>
                          <Select value={leaveRequest.leaveType} onValueChange={v => setLeaveRequest({...leaveRequest, leaveType: v})}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="casual" className="text-xs">Casual</SelectItem>
                              <SelectItem value="sick" className="text-xs">Sick</SelectItem>
                              <SelectItem value="earned" className="text-xs">Earned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Reason</Label>
                          <Textarea value={leaveRequest.reason} onChange={e => setLeaveRequest({...leaveRequest, reason: e.target.value})} className="text-xs" rows={2} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setShowLeaveDialog(false)} className="text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleLeaveRequest} disabled={isSubmittingLeave} className="text-xs">
                          {isSubmittingLeave ? <FiLoader className="animate-spin mr-1 w-3 h-3" /> : null}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              {/* Combined row: location + check buttons */}
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 min-w-0">
                  <AnimatePresence>
                    {locationLoading ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-1.5 rounded-md bg-muted/50 border flex items-center gap-1 text-xs">
                        <FiLoader className="animate-spin w-3 h-3" />
                        <span>Getting location...</span>
                      </motion.div>
                    ) : userLocation ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-1.5 rounded-md bg-blue-50/50 border border-blue-200 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <FiMapPin className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="text-[11px] truncate">{userLocation.address?.split(',')[0] || 'Location acquired'}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {getAccuracyBadge(locationAccuracy)}
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowLocationDetails(!showLocationDetails)}>
                              <FiMap className="w-2.5 h-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => fetchUserLocation(true)}>
                              <FiRefreshCw className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        {showLocationDetails && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            className="mt-1 pt-1 border-t text-[10px] text-muted-foreground grid grid-cols-2 gap-0.5"
                          >
                            <div>Lat: {userLocation.lat.toFixed(6)}</div>
                            <div>Lng: {userLocation.lng.toFixed(6)}</div>
                            <div className="col-span-2 truncate">{userLocation.address}</div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : locationError ? (
                      <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                        <span>{locationError}</span>
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1" onClick={() => fetchUserLocation(true)}>Retry</Button>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Check In/Out Buttons */}
                <div className="md:w-40 shrink-0">
                  <AnimatePresence mode="wait">
                    {status === 'not-checked-in' && (
                      <motion.div key="check-in">
                        <Button onClick={() => handleAttendance('check-in')} className="w-full gap-1 h-8 text-xs" disabled={isLoading || locationLoading}>
                          {isLoading ? <FiLoader className="animate-spin w-3 h-3" /> : <FiCheckCircle className="w-3 h-3" />}
                          {isLoading ? 'Checking...' : 'Check In'}
                        </Button>
                      </motion.div>
                    )}
                    {status === 'checked-in' && (
                      <motion.div key="check-out" className="space-y-1">
                        <Button onClick={() => handleAttendance('check-out')} variant="outline" className="w-full gap-1 h-8 text-xs" disabled={isLoading}>
                          {isLoading ? <FiLoader className="animate-spin w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                          {isLoading ? 'Checking out...' : 'Check Out'}
                        </Button>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span>Work Progress</span>
                            <span>{workProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={workProgress} className="h-1" />
                        </div>
                      </motion.div>
                    )}
                    {status === 'checked-out' && (
                      <Badge className="w-full py-1.5 bg-green-100 text-green-800 border-green-200 justify-center text-xs">
                        <FiCheckCircle className="mr-1 w-3 h-3" /> Completed
                      </Badge>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Time boxes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-1.5 rounded-md bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    <FiSunrise className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] text-muted-foreground">Check In</span>
                  </div>
                  <div className="text-sm font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkIn)}</div>
                  {currentRecord?.checkInLocation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5 cursor-help">{currentRecord.checkInLocation.address?.split(',')[0]}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs wrap-break-words">{currentRecord.checkInLocation.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-center p-1.5 rounded-md bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    <FiSunset className="w-3 h-3 text-purple-600" />
                    <span className="text-[10px] text-muted-foreground">Check Out</span>
                  </div>
                  <div className="text-sm font-semibold">{TimeUtils.formatTime12h(currentRecord?.checkOut)}</div>
                  {currentRecord?.checkOutLocation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5 cursor-help">{currentRecord.checkOutLocation.address?.split(',')[0]}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs wrap-break-words">{currentRecord.checkOutLocation.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Stats */}
              {currentRecord && (
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="p-1 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-[10px] text-muted-foreground">Hours</div>
                    <div className="text-xs font-medium">{currentRecord.totalHours?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="p-1 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-[10px] text-muted-foreground">Status</div>
                    <div className="text-xs">{getStatusBadge(currentRecord.status)}</div>
                  </div>
                  <div className="p-1 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-[10px] text-muted-foreground">Arrival</div>
                    <div className="text-xs font-medium">{TimeUtils.formatTime12h(currentRecord.checkIn)}</div>
                  </div>
                  <div className="p-1 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="text-[10px] text-muted-foreground">Late</div>
                    <div className="text-xs">{TimeUtils.calculateStatus(currentRecord.checkIn) === 'late' ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                Recent
              </h4>
              <div className="flex items-center gap-1">
                <Select value={csvExportType} onValueChange={(v: any) => setCsvExportType(v)}>
                  <SelectTrigger className="h-6 w-16 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed" className="text-xs">Detailed</SelectItem>
                    <SelectItem value="summary" className="text-xs">Summary</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-0.5" onClick={handleExportCSV} disabled={isExporting || attendance.length === 0}>
                  {isExporting ? <FiLoader className="animate-spin w-2.5 h-2.5" /> : <FiDownload className="w-2.5 h-2.5" />}
                  CSV
                </Button>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {attendance.slice(0, 5).map((record) => (
                <Card key={record.id} className="border-border dark:bg-gray-900/50">
                  <CardContent className="p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FiCalendarIcon className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><span className="text-muted-foreground">In:</span> {TimeUtils.formatTimeForTable(record.checkIn)}</div>
                      <div><span className="text-muted-foreground">Out:</span> {TimeUtils.formatTimeForTable(record.checkOut)}</div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Hours: {record.totalHours?.toFixed(1)}h</span>
                      {record.overtimeHours ? <span className="text-amber-600">+{record.overtimeHours.toFixed(1)}h OT</span> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {attendance.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">No attendance records</div>
              )}
            </div>

            {/* Desktop Table - compact */}
            <div className="hidden md:block rounded-md border overflow-hidden">
              <div className="max-h-75 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="text-xs px-2 py-1.5">Date</TableHead>
                      <TableHead className="text-xs px-2 py-1.5 text-center">In</TableHead>
                      <TableHead className="text-xs px-2 py-1.5 text-center">Out</TableHead>
                      <TableHead className="text-xs px-2 py-1.5 text-center">Hours</TableHead>
                      <TableHead className="text-xs px-2 py-1.5 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 5).map((record) => {
                      const hours = record.totalHours?.toFixed(1) || '0.0';
                      const overtime = record.overtimeHours;
                      return (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell className="px-2 py-1.5 whitespace-nowrap text-xs">
                            {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-center text-xs">
                            {TimeUtils.formatTimeForTable(record.checkIn)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-center text-xs">
                            {TimeUtils.formatTimeForTable(record.checkOut)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-center text-xs">
                            {hours}h
                            {overtime ? <span className="text-amber-600 text-[9px] block">+{overtime.toFixed(1)}h OT</span> : null}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-center">
                            {getStatusBadge(record.status)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-3 text-xs text-muted-foreground">
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