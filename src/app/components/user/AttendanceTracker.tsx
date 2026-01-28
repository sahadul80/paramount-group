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
  FiCrosshair
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
      const nineFiveAM = 9 * 60 + 5; // 9:05 AM
      const elevenAM = 11 * 60;         // 11:00 AM
      
      if (checkInTotalMinutes > elevenAM) {
        return 'half-day';
      } else if (checkInTotalMinutes > nineFiveAM) {
        return 'late';
      }
      
      return 'present';
    } catch (error) {
      console.error('Error calculating status:', error);
      return 'present';
    }
  }
};

// Address formatting utilities
const AddressUtils = {
  // Format full address from components
  formatFullAddress: (address: GeocodedAddress): string => {
    const { components, formatted } = address;
    
    if (formatted) return formatted;
    
    const parts = [];
    if (components.street) parts.push(components.street);
    if (components.neighborhood) parts.push(components.neighborhood);
    if (components.suburb) parts.push(components.suburb);
    if (components.city) parts.push(components.city);
    if (components.state) parts.push(components.state);
    if (components.postcode) parts.push(components.postcode);
    if (components.country) parts.push(components.country);
    
    return parts.join(', ');
  },

  // Format short address for display
  formatShortAddress: (address: GeocodedAddress): string => {
    const { components } = address;
    
    // Prioritize: Street > Neighborhood > Suburb > City
    if (components.street) {
      return components.street;
    } else if (components.neighborhood) {
      return components.neighborhood;
    } else if (components.suburb) {
      return components.suburb;
    } else if (components.city) {
      return components.city;
    }
    
    return 'Location acquired';
  },

  // Parse address string into components
  parseAddressString: (addressString: string): GeocodedAddress => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(addressString);
      if (parsed.components && parsed.formatted) {
        return parsed;
      }
    } catch {
      // Not JSON, treat as simple string
    }
    
    // Extract components from address string
    const parts = addressString.split(',').map(part => part.trim());
    
    const components: GeocodedAddress['components'] = {
      street: parts[0] || '',
      neighborhood: parts.length > 1 ? parts[1] : undefined,
      city: parts.find(part => 
        part.includes('City') || 
        part.includes('Dhaka') || 
        part.includes('town')
      ) || parts[2],
      state: parts.find(part => 
        part.includes('Division') || 
        part.includes('Province') || 
        part.includes('State')
      ),
      country: parts.find(part => 
        part.includes('Bangladesh') || 
        part.includes('BD')
      ),
      postcode: parts.find(part => /^\d{4,6}$/.test(part))
    };
    
    return {
      formatted: addressString,
      components
    };
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
  const [userLocation, setUserLocation] = useState<{
    lat: number; 
    lng: number; 
    address?: string;
    geocoded?: GeocodedAddress;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<'high' | 'medium' | 'low' | 'unknown'>('unknown');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
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

  // Geocode coordinates to detailed address
  const geocodeCoordinates = async (latitude: number, longitude: number): Promise<GeocodedAddress> => {
    try {
      // Try multiple geocoding services for better accuracy
      const services = [
        // Primary: OpenStreetMap Nominatim
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&namedetails=1&extratags=1`,
        // Fallback: BigDataCloud
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        // Secondary: LocationIQ
        `https://us1.locationiq.com/v1/reverse.php?key=pk.49d56f8e5b3c4b1b8d5a7c6f9e0a1b2c&lat=${latitude}&lon=${longitude}&format=json&zoom=16`
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AttendanceTrackerApp/1.0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Parse based on service
            if (service.includes('nominatim')) {
              // OpenStreetMap format
              return {
                formatted: data.display_name,
                components: {
                  street: data.address?.road || data.address?.street,
                  neighborhood: data.address?.neighbourhood || data.address?.suburb,
                  suburb: data.address?.suburb,
                  city: data.address?.city || data.address?.town || data.address?.village,
                  state: data.address?.state || data.address?.region,
                  country: data.address?.country,
                  postcode: data.address?.postcode
                },
                accuracy: data.importance || 0.5
              };
            } else if (service.includes('bigdatacloud')) {
              // BigDataCloud format
              return {
                formatted: `${data.locality}, ${data.city}, ${data.principalSubdivision}, ${data.countryName}`,
                components: {
                  street: data.locality,
                  city: data.city,
                  state: data.principalSubdivision,
                  country: data.countryName,
                  postcode: data.postcode
                },
                accuracy: data.confidence || 0.5
              };
            } else if (service.includes('locationiq')) {
              // LocationIQ format
              return {
                formatted: data.display_name,
                components: {
                  street: data.address?.road,
                  neighborhood: data.address?.neighbourhood,
                  suburb: data.address?.suburb,
                  city: data.address?.city || data.address?.town,
                  state: data.address?.state,
                  country: data.address?.country,
                  postcode: data.address?.postcode
                }
              };
            }
          }
        } catch (error) {
          console.warn(`Geocoding service failed: ${service}`, error);
          continue;
        }
      }

      // Fallback: Use coordinates
      return {
        formatted: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
        components: {
          street: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Enhanced location fetching with high accuracy
  const fetchUserLocation = async (highAccuracy: boolean = true) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      toast.error("Your browser doesn't support location services");
      return false;
    }

    setLocationLoading(true);
    setLocationError(null);
    setLocationAccuracy('unknown');

    return new Promise<boolean>((resolve) => {
      const onSuccess = async (position: GeolocationPosition) => {
        const { 
          latitude, 
          longitude, 
          accuracy
        } = position.coords;

        // Set accuracy level
        if (accuracy <= 20) {
          setLocationAccuracy('high');
        } else if (accuracy <= 100) {
          setLocationAccuracy('medium');
        } else {
          setLocationAccuracy('low');
        }

        try {
          // Get detailed address
          const geocodedAddress = await geocodeCoordinates(latitude, longitude);
          
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: AddressUtils.formatFullAddress(geocodedAddress),
            geocoded: geocodedAddress,
            accuracy: accuracy
          });

          // Clear any watch if it was set
          if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
          }

          locationRetryCount.current = 0;
          setLocationLoading(false);
          
          toast.success(`Location acquired with ${locationAccuracy} accuracy!`);
          resolve(true);
        } catch (error) {
          console.error('Error getting address:', error);
          
          // Fallback to coordinates
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
            accuracy: accuracy
          });
          
          setLocationLoading(false);
          toast.success("Location acquired! Could not get full address details.");
          resolve(true);
        }
      };

      const onError = (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = "Could not get your location.";
        let toastMessage = "Location detection failed";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services in your device and browser settings.";
            toastMessage = "Please enable location permissions";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please ensure GPS/Wi-Fi is enabled and try again.";
            toastMessage = "Location services unavailable";
            break;
          case error.TIMEOUT:
            if (locationRetryCount.current < maxRetries) {
              locationRetryCount.current++;
              
              // Retry with different accuracy
              const retryAccuracy = locationRetryCount.current === 1 ? true : false;
              const retryTimeout = locationRetryCount.current * 3000;
              
              setTimeout(() => {
                navigator.geolocation.getCurrentPosition(
                  onSuccess,
                  onError,
                  {
                    enableHighAccuracy: retryAccuracy,
                    timeout: 10000,
                    maximumAge: 0
                  }
                );
              }, retryTimeout);
              
              toast.info(`Retrying location... Attempt ${locationRetryCount.current} of ${maxRetries}`);
              return;
            }
            errorMessage = "Location request timed out. Please check your connection and try again.";
            toastMessage = "Location request timed out";
            break;
        }
        
        setLocationError(errorMessage);
        setLocationLoading(false);
        toast.error(toastMessage);

        // iOS Safari specific workaround
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && locationWatchId.current === null) {
          try {
            locationWatchId.current = navigator.geolocation.watchPosition(
              onSuccess,
              (watchError) => {
                console.error('iOS watchPosition error:', watchError);
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
              }
            );

            // Clear watch after 15 seconds
            setTimeout(() => {
              if (locationWatchId.current !== null) {
                navigator.geolocation.clearWatch(locationWatchId.current);
                locationWatchId.current = null;
              }
            }, 15000);
          } catch (watchError) {
            console.error('Failed to set up watchPosition:', watchError);
          }
        }
        
        resolve(false);
      };

      // Configure options for best accuracy
      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 0 // Always get fresh location
      };

      // iOS specific optimizations
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        options.timeout = 20000; // Longer timeout for iOS
      }

      try {
        // First try with high accuracy
        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
      } catch (error) {
        console.error('Geolocation request failed:', error);
        setLocationError("Failed to request location. Please refresh the page and try again.");
        setLocationLoading(false);
        toast.error("Location request failed");
        resolve(false);
      }
    });
  };

  // Get user's current location - optimized for all platforms
  useEffect(() => {
    // Don't auto-fetch on iOS Safari (requires user gesture)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      setLocationLoading(false);
      setLocationError("Tap 'Get Precise Location' button to enable location services.");
      return;
    }
    
    // For other browsers, try to get location on mount
    fetchUserLocation(true);
    
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

  const getAccuracyBadge = (accuracy: 'high' | 'medium' | 'low' | 'unknown') => {
    switch (accuracy) {
      case 'high':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 
                           dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            <FiCrosshair className="w-3 h-3 mr-1" />
            High Accuracy
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 
                           dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
            <FiMap className="w-3 h-3 mr-1" />
            Medium Accuracy
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 
                           dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
            <FiGlobe className="w-3 h-3 mr-1" />
            Low Accuracy
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
            Accuracy Unknown
          </Badge>
        );
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
      toast.error("Location is required. Please enable precise location services.");
      
      // Try to get high accuracy location
      const success = await fetchUserLocation(true);
      if (!success) {
        toast.error("Could not get your location. Please check your device settings.");
        return;
      }
      
      setTimeout(() => {
        if (userLocation) {
          toast.info("Precise location acquired. Please try checking in/out again.");
        }
      }, 500);
      return;
    }

    // Warn about low accuracy
    if (locationAccuracy === 'low') {
      toast.warning("Your location accuracy is low. For better accuracy, enable GPS or connect to Wi-Fi.", {
        duration: 5000,
      });
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
          location: {
            ...userLocation,
            accuracy: locationAccuracy,
            timestamp: new Date().toISOString()
          },
          time: currentDhakaTime.formatted24h,
          date: currentDhakaDate,
          timestamp: dhakaTimestamp,
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
      
      const workDayMinutes = 9 * 60; // 9 hours work day
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

  // Format address for display with responsive wrapping
  const formatDisplayAddress = (address?: string) => {
    if (!address) return '';
    
    // For mobile: break after 40 chars
    // For desktop: break after 60 chars
    const isMobile = window.innerWidth < 768;
    const breakAt = isMobile ? 40 : 60;
    
    if (address.length <= breakAt) return address;
    
    // Try to break at natural points (commas, spaces)
    const naturalBreak = address.lastIndexOf(', ', breakAt);
    if (naturalBreak > breakAt - 20) {
      return (
        <>
          {address.substring(0, naturalBreak)}<br />
          {address.substring(naturalBreak + 2)}
        </>
      );
    }
    
    // Force break if no natural break found
    return (
      <>
        {address.substring(0, breakAt)}<br />
        {address.substring(breakAt)}
      </>
    );
  };

  const status = getCurrentStatus();
  const workProgress = calculateWorkProgress();
  const timeStatus = getCurrentTimeStatus();
  const displayDate = TimeUtils.formatDate(currentDhakaDate);

  return (
    <TooltipProvider>
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
              {/* Enhanced Location Display */}
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
                        Getting precise location...
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 dark:bg-blue-400 animate-pulse" 
                             style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                        Using GPS and Wi-Fi for high accuracy
                      </p>
                    </div>
                  </motion.div>
                ) : userLocation ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 
                              dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800 
                              w-full max-w-full overflow-hidden"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Location header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-800">
                            <FiMapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600 
                                                dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                              Current Location
                            </h4>
                            <div className="mt-1">
                              {getAccuracyBadge(locationAccuracy)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setShowLocationDetails(!showLocationDetails)}
                              >
                                <FiMap className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {showLocationDetails ? 'Hide details' : 'Show details'}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => fetchUserLocation(true)}
                              >
                                <FiRefreshCw className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh location</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Full address with responsive wrapping */}
                      <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 border 
                                    ${showLocationDetails ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">
                          {formatDisplayAddress(userLocation.address)}
                        </div>
                        
                        {showLocationDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">Latitude</p>
                                <p className="font-mono text-gray-800 dark:text-gray-200">
                                  {userLocation.lat.toFixed(6)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">Longitude</p>
                                <p className="font-mono text-gray-800 dark:text-gray-200">
                                  {userLocation.lng.toFixed(6)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">Accuracy</p>
                                <p className="text-gray-800 dark:text-gray-200">
                                  {userLocation.accuracy ? `${Math.round(userLocation.accuracy)}m` : 'Unknown'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-gray-500 dark:text-gray-400">Source</p>
                                <p className="text-gray-800 dark:text-gray-200">
                                  {locationAccuracy === 'high' ? 'GPS/Wi-Fi' : 
                                   locationAccuracy === 'medium' ? 'Cell Tower' : 
                                   locationAccuracy === 'low' ? 'IP Address' : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Location controls */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => fetchUserLocation(true)}
                        >
                          <FiCrosshair className="w-4 h-4 mr-2" />
                          Get Precise Location
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => setShowLocationDetails(!showLocationDetails)}
                        >
                          {showLocationDetails ? (
                            <>
                              <FiMap className="w-3 h-3 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <FiMap className="w-3 h-3 mr-1" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : locationError ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200
                              dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800 
                              w-full max-w-full overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800 shrink-0">
                          <FiAlertCircle className="w-5 h-5 text-amber-600 
                                                   dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                            Precise Location Required
                          </h4>
                          <div className="text-sm text-amber-700/80 break-words leading-relaxed
                                        dark:text-amber-400/80">
                            {locationError}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:pl-2">
                        <Button
                          size="sm"
                          className="h-9"
                          onClick={() => fetchUserLocation(true)}
                        >
                          <FiCrosshair className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                              toast.info(
                                <div className="space-y-2">
                                  <p className="font-semibold">iOS Location Setup:</p>
                                  <ol className="list-decimal pl-4 space-y-1 text-sm">
                                    <li>Open Settings &gt; Privacy &gt; Location Services</li>
                                    <li>Ensure Location Services is ON</li>
                                    <li>Find your browser and set to "While Using"</li>
                                    <li>Return here and tap "Try Again"</li>
                                  </ol>
                                </div>,
                                { duration: 8000 }
                              );
                            } else {
                              toast.info(
                                "Please ensure location permissions are enabled in your browser settings.",
                                { duration: 5000 }
                              );
                            }
                          }}
                        >
                          <FiNavigation className="w-4 h-4 mr-2" />
                          Setup Guide
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
                      className="w-full flex items-center justify-center gap-2 h-12 md:h-14 text-base md:text-lg"
                      disabled={isLoading || locationLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiCheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                      <span className="truncate font-semibold">
                        {isLoading ? 'Checking in...' : 'Check In Now'}
                      </span>
                    </Button>
                    {userLocation && locationAccuracy !== 'high' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                        ⚠️ Location accuracy is {locationAccuracy}. For best results, enable GPS.
                      </p>
                    )}
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
                      className="w-full flex items-center justify-center gap-2 h-12 md:h-14 text-base md:text-lg
                                dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiXCircle className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                      <span className="truncate font-semibold">
                        {isLoading ? 'Checking out...' : 'Check Out Now'}
                      </span>
                    </Button>
                    
                    {/* Work Progress Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground 
                                      dark:text-gray-400">
                        <span>Work Progress</span>
                        <span>{workProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={workProgress} className="h-2 w-full" />
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
                    <Badge className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 
                                      hover:bg-green-50 w-full justify-center text-base
                                      dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-800 
                                      dark:hover:bg-green-900/40">
                      <FiCheckCircle className="w-5 h-5 mr-2" />
                      <span className="truncate font-semibold">Attendance Completed for Today</span>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Time Display - Optimized for mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-center p-4 md:p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 
                            border border-blue-100 hover:shadow-sm overflow-hidden
                            dark:from-blue-900/10 dark:to-indigo-900/10 dark:border-blue-800/50"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800 shrink-0">
                      <FiSunrise className="w-4 h-4 md:w-5 md:h-5 text-blue-600 
                                           dark:text-blue-400" />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground 
                                   dark:text-gray-400 truncate">
                      Check In Time
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-card-foreground 
                                 dark:text-gray-100 mb-2 truncate">
                    {TimeUtils.formatTime(currentRecord?.checkIn)}
                  </div>
                  {currentRecord?.checkInLocation?.address && (
                    <div className="text-xs text-muted-foreground break-words leading-relaxed 
                                   dark:text-gray-500 px-1">
                      {formatDisplayAddress(currentRecord.checkInLocation.address)}
                    </div>
                  )}
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-center p-4 md:p-5 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 
                            border border-purple-100 hover:shadow-sm overflow-hidden
                            dark:from-purple-900/10 dark:to-pink-900/10 dark:border-purple-800/50"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800 shrink-0">
                      <FiSunset className="w-4 h-4 md:w-5 md:h-5 text-purple-600 
                                          dark:text-purple-400" />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground 
                                   dark:text-gray-400 truncate">
                      Check Out Time
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-card-foreground 
                                 dark:text-gray-100 mb-2 truncate">
                    {TimeUtils.formatTime(currentRecord?.checkOut)}
                  </div>
                  {currentRecord?.checkOutLocation?.address && (
                    <div className="text-xs text-muted-foreground break-words leading-relaxed 
                                   dark:text-gray-500 px-1">
                      {formatDisplayAddress(currentRecord.checkOutLocation.address)}
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
                  <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border hover:shadow-sm 
                                transition-shadow dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <FiWatch className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground 
                                         dark:text-gray-400 shrink-0" />
                      <div className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 truncate">
                        Total Hours
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-card-foreground 
                                   dark:text-gray-100 truncate">
                      {currentRecord.totalHours?.toFixed(1) || '0.0'}h
                    </div>
                  </div>
                  
                  {currentRecord.overtimeHours && currentRecord.overtimeHours > 0 ? (
                    <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 
                                  hover:shadow-sm transition-shadow overflow-hidden
                                  dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <FiTrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-600 
                                               dark:text-amber-500 shrink-0" />
                        <div className="text-xs md:text-sm text-amber-700 dark:text-amber-400 truncate">
                          Overtime
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-amber-700 
                                     dark:text-amber-400 truncate">
                        +{currentRecord.overtimeHours.toFixed(1)}h
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border hover:shadow-sm 
                                  transition-shadow dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 overflow-hidden">
                      <div className="text-xs md:text-sm text-muted-foreground mb-2 dark:text-gray-400 truncate">
                        Status
                      </div>
                      <div className="truncate">
                        {getStatusBadge(currentRecord.status)}
                      </div>
                    </div>
                  )}

                  <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border hover:shadow-sm 
                                transition-shadow dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 overflow-hidden">
                    <div className="text-xs md:text-sm text-muted-foreground mb-2 dark:text-gray-400 truncate">
                      Arrival Time
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-card-foreground 
                                   dark:text-gray-100 truncate">
                      {TimeUtils.formatTime(currentRecord.checkIn)}
                    </div>
                  </div>

                  <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border hover:shadow-sm 
                                transition-shadow dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 overflow-hidden">
                    <div className="text-xs md:text-sm text-muted-foreground mb-2 dark:text-gray-400 truncate">
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
                          <div className="truncate flex-1 break-words">
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
    </TooltipProvider>
  );
};

export default AttendanceTracker;