import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BookingState, Journey, BookingStep, Location, JourneyRequest } from '@/types/transport';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HybridMap = dynamic(
  () => import('@/app/components/Travell/HybridMap'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center">Loading map...</div>
  }
);

interface BookRideTabProps {
  bookingState: BookingState;
  selectedDestination: string;
  onDestinationChange: (destination: string) => void;
  onRequest: (journeyData: JourneyRequest) => Promise<Journey | null | undefined>;
  onCancel: (journeyId: string) => Promise<void>;
  isLoading: boolean;
  previousDestinations: string[];
  requestedJourney?: Journey | null;
  userId?: string;
}

// Fallback location
const FALLBACK_LOCATION: Location = {
  lat: 23.8103,
  lng: 90.4125,
  address: 'Dhaka, Bangladesh'
};

// Cooldown time in milliseconds (5 minutes)
const COOLDOWN_TIME = 5 * 60 * 1000;

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const slideIn = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

export default function BookRideTab({
  bookingState,
  selectedDestination,
  onDestinationChange,
  onRequest,
  onCancel,
  isLoading,
  previousDestinations,
  requestedJourney,
  userId
}: BookRideTabProps) {
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState<Location>(FALLBACK_LOCATION);
  const [selectedStartLocation, setSelectedStartLocation] = useState<Location | null>(null);
  const [selectedEndLocation, setSelectedEndLocation] = useState<Location | undefined>(undefined);
  const [waypoints, setWaypoints] = useState<Location[]>([]);
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);
  
  // UI states
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [cooldownTimer, setCooldownTimer] = useState<number>(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Mode states
  const [activeMode, setActiveMode] = useState<'start' | 'destination' | 'waypoint'>('destination');
  const [isRouteCalculating, setIsRouteCalculating] = useState(false);
  
  // Route data
  const [routeData, setRouteData] = useState<{
    distance: number;
    duration: number;
    trafficDuration: number;
    snappedRoute: Array<{ lat: number; lng: number }>;
    speedLimits: Array<{ placeId: string; speedLimit: number }>;
  } | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Booking steps with animations
  const bookingSteps = useMemo(() => {
    const steps: BookingStep[] = [
      { step: 1, title: 'Set Start', description: 'Select your pickup location', icon: '📍', completed: false, active: false, status: 'pending' },
      { step: 2, title: 'Choose Destination', description: 'Select where you want to go', icon: '🎯', completed: false, active: false, status: 'pending' },
      { step: 3, title: 'Add Stops', description: 'Optional stops along the way', icon: '🔄', completed: false, active: false, status: 'pending' },
      { step: 4, title: 'Review & Book', description: 'Confirm your ride details', icon: '📝', completed: false, active: false, status: 'pending' },
      { step: 5, title: 'Request Sent', description: 'Waiting for driver assignment', icon: '⏳', completed: false, active: false, status: 'pending' },
    ];

    // Update based on current state
    if (selectedStartLocation) {
      steps[0].completed = true;
      steps[0].status = 'completed';
      steps[1].active = true;
      steps[1].status = 'in-progress';
    }

    if (selectedEndLocation) {
      steps[1].completed = true;
      steps[1].status = 'completed';
      steps[2].active = true;
      steps[2].status = 'in-progress';
    }

    if (waypoints.length > 0) {
      steps[2].completed = true;
      steps[2].status = 'completed';
      steps[3].active = true;
      steps[3].status = 'in-progress';
    } else if (selectedEndLocation) {
      steps[3].active = true;
      steps[3].status = 'in-progress';
    }

    if (requestedJourney) {
      steps.forEach(step => {
        step.completed = true;
        step.status = 'completed';
      });
      steps[4].active = true;
      steps[4].status = 'in-progress';
    }

    return steps;
  }, [selectedStartLocation, selectedEndLocation, waypoints, requestedJourney]);

  // Get current location via geolocation API
  useEffect(() => {
    let isMounted = true;
    
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setGeoError('Geolocation is not supported by your browser');
        return;
      }

      setIsGeolocating(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return;
          
          const { latitude, longitude } = position.coords;
          
          try {
            // Try to reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            const data = await response.json();
            const address = data.display_name || 'Current Location';
            
            const location: Location = {
              lat: latitude,
              lng: longitude,
              address
            };
            
            setCurrentLocation(location);
            if (!selectedStartLocation) {
              setSelectedStartLocation(location);
            }
            
            setGeoError(null);
          } catch (error) {
            const location: Location = {
              lat: latitude,
              lng: longitude,
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
            };
            
            setCurrentLocation(location);
            if (!selectedStartLocation) {
              setSelectedStartLocation(location);
            }
          } finally {
            if (isMounted) {
              setIsGeolocating(false);
            }
          }
        },
        (error) => {
          if (!isMounted) return;
          
          setIsGeolocating(false);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setGeoError('Location access denied. Please enable location services.');
              break;
            case error.POSITION_UNAVAILABLE:
              setGeoError('Location information unavailable.');
              break;
            case error.TIMEOUT:
              setGeoError('Location request timed out.');
              break;
            default:
              setGeoError('Unable to get your location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    getCurrentLocation();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Search function
  const searchLocations = useCallback(async (query: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=bd&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return data.slice(0, 6);
    } catch (err) {
      console.error('Search error:', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search query with debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchLocations(searchQuery);
        setSearchSuggestions(results);
        setShowSearchResults(true);
      } else {
        setSearchSuggestions([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: Location, type: 'start' | 'destination' | 'waypoint') => {
    if (type === 'start') {
      setSelectedStartLocation(location);
      setSearchQuery(location.address || '');
      setActiveMode('destination');
    } else if (type === 'destination') {
      setSelectedEndLocation(location);
      onDestinationChange(location.address || '');
      setSearchQuery(location.address || '');
      setActiveMode('waypoint');
    } else if (type === 'waypoint') {
      if (selectedWaypointIndex !== null) {
        const newWaypoints = [...waypoints];
        newWaypoints[selectedWaypointIndex] = location;
        setWaypoints(newWaypoints);
        setSelectedWaypointIndex(null);
      } else {
        setWaypoints([...waypoints, location]);
      }
      setSearchQuery('');
    }
    
    setSearchSuggestions([]);
    setShowSearchResults(false);
  }, [selectedWaypointIndex, waypoints, onDestinationChange]);

  // Handle search suggestion click
  const handleSuggestionClick = useCallback((suggestion: { display_name: string; lat: string; lon: string }) => {
    const location: Location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    };
    
    handleLocationSelect(location, activeMode);
  }, [activeMode, handleLocationSelect]);

  // Handle route update with animation
  const handleRouteUpdate = useCallback((data: {
    distance: number;
    duration: number;
    trafficDuration: number;
    snappedRoute: Array<{ lat: number; lng: number }>;
    speedLimits: Array<{ placeId: string; speedLimit: number }>;
  }) => {
    setIsRouteCalculating(true);
    setRouteData(data);
    
    // Show route calculation animation
    setTimeout(() => {
      setIsRouteCalculating(false);
    }, 1000);
  }, []);

  // Format cooldown time
  const formatCooldownTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle retry geolocation
  const handleRetryGeolocation = useCallback(() => {
    setGeoError(null);
    setIsGeolocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: Location = {
          lat: latitude,
          lng: longitude,
          address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        };
        setCurrentLocation(location);
        setSelectedStartLocation(location);
        setGeoError(null);
        setIsGeolocating(false);
      },
      (error) => {
        setIsGeolocating(false);
        setGeoError('Failed to get location. Please check your permissions.');
      }
    );
  }, []);

  // Add waypoint
  const addWaypoint = useCallback(() => {
    setSelectedWaypointIndex(null);
    setActiveMode('waypoint');
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Edit waypoint
  const editWaypoint = useCallback((index: number) => {
    setSelectedWaypointIndex(index);
    setActiveMode('waypoint');
    setSearchQuery(waypoints[index].address || '');
    setSearchSuggestions([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [waypoints]);

  // Remove waypoint
  const removeWaypoint = useCallback((index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
    setSelectedWaypointIndex(null);
  }, []);

  // Clear all selections with animation
  const clearAllSelections = useCallback(() => {
    // Animate the clear action
    setShowConfetti(false);
    
    setTimeout(() => {
      setSelectedStartLocation(currentLocation);
      setSelectedEndLocation(undefined);
      setWaypoints([]);
      setSelectedWaypointIndex(null);
      setSearchQuery('');
      onDestinationChange('');
      setRouteData(null);
      setActiveMode('destination');
      setSearchSuggestions([]);
      setShowSearchResults(false);
    }, 300);
  }, [currentLocation, onDestinationChange]);

  // Set start location mode
  const handleSetStartLocation = useCallback(() => {
    setActiveMode('start');
    setSearchQuery(selectedStartLocation?.address || '');
    setSearchSuggestions([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedStartLocation]);

  // Set destination mode
  const handleSetDestination = useCallback(() => {
    setActiveMode('destination');
    setSearchQuery(selectedEndLocation?.address || '');
    setSearchSuggestions([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedEndLocation]);

  // Calculate distance for display
  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle request button click - FIXED JOURNEY CREATION
  const handleRequest = useCallback(async () => {
    if (!selectedStartLocation || !selectedEndLocation) {
      toast.error('Please select start and destination locations');
      return;
    }

    if (!userId) {
      toast.error('User not found. Please login again.');
      return;
    }

    setIsRequesting(true);
    try {
      // Calculate total distance if route data is available
      const totalDistance = routeData?.distance || calculateDistance(selectedStartLocation, selectedEndLocation);
      const estimatedDuration = routeData?.duration || Math.ceil(totalDistance * 2); // 2 min per km

      const journeyRequest: JourneyRequest = {
        userId,
        startLocation: selectedStartLocation,
        endLocation: selectedEndLocation,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        preferredTime: new Date().toISOString(),
        priority: 'normal',
        specialRequirements: '',
        estimatedDuration,
        distance: totalDistance
      };

      console.log('Sending journey request:', journeyRequest);

      // Call the API through parent component
      const journey = await onRequest(journeyRequest);
      
      if (journey) {
        // Success - show confetti and start cooldown
        setShowConfetti(true);
        setCooldownTimer(COOLDOWN_TIME);
        
        // Clear existing interval
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
        }
        
        // Start cooldown timer
        cooldownIntervalRef.current = setInterval(() => {
          setCooldownTimer(prev => {
            if (prev <= 1000) {
              if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
              }
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);

        toast.success('Ride request sent successfully!');
      }
    } catch (error: any) {
      console.error('Request failed:', error);
      toast.error(error.message || 'Failed to send request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  }, [selectedStartLocation, selectedEndLocation, waypoints, routeData, userId, onRequest]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide confetti
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Memoize the start location for HybridMap
  const hybridMapStartLocation = useMemo(() => 
    selectedStartLocation || currentLocation, 
    [selectedStartLocation, currentLocation]
  );

  // Get active mode display
  const getActiveModeText = () => {
    switch (activeMode) {
      case 'start': return 'Selecting Start Location';
      case 'destination': return 'Selecting Destination';
      case 'waypoint': return 'Adding Waypoint';
      default: return 'Search';
    }
  };

  // Get active mode placeholder
  const getPlaceholder = () => {
    switch (activeMode) {
      case 'start': return 'Search or click on map for start location...';
      case 'destination': return 'Search or click on map for destination...';
      case 'waypoint': return 'Search or click on map for waypoint...';
      default: return 'Search locations...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-100 bg-white/95 backdrop-blur-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Book a New Ride</h3>
        
        {/* Active Booking Banner */}
        <AnimatePresence>
          {bookingState.hasActiveRequest && requestedJourney && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 border border-amber-200 bg-amber-50/80 backdrop-blur-sm rounded-xl p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
                    <motion.svg
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Booking Request Pending</p>
                    <p className="text-amber-700 text-sm">
                      Status: <span className="font-semibold capitalize">{requestedJourney.status}</span>
                      {cooldownTimer > 0 && (
                        <span className="ml-2 font-semibold">
                          Cooldown: {formatCooldownTime(cooldownTimer)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCancel(requestedJourney.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm shadow-md"
                >
                  Cancel Request
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Map and Controls */}
          <div className="lg:w-2/3 space-y-6">
            {/* Location Status Banner */}
            <AnimatePresence>
              {isGeolocating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex items-center space-x-3 shadow-sm"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="rounded-full h-5 w-5 border-b-2 border-blue-600"
                  />
                  <span className="text-blue-700 text-sm">Detecting your current location...</span>
                </motion.div>
              )}
              
              {geoError && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-red-50/80 border border-red-200 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 text-sm">{geoError}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetryGeolocation}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap shadow-sm"
                    >
                      Retry Location
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search and Mode Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Mode Selection Buttons */}
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSetStartLocation}
                    className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                      activeMode === 'start'
                        ? 'bg-white text-gray-800 shadow-lg border-2 border-green-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">Start</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSetDestination}
                    className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                      activeMode === 'destination'
                        ? 'bg-white text-gray-800 shadow-lg border-2 border-blue-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-sm font-medium">Destination</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addWaypoint}
                    disabled={!selectedEndLocation}
                    className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                      activeMode === 'waypoint'
                        ? 'bg-white text-gray-800 shadow-lg border-2 border-yellow-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    } ${!selectedEndLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm font-medium">Add Stop</span>
                  </motion.button>
                </div>

                {/* Request Button - Only shows when destination is selected */}
                <AnimatePresence>
                  {selectedEndLocation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex-shrink-0"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRequest}
                        disabled={isRequesting || !bookingState.isBookingAllowed || bookingState.hasActiveRequest}
                        className={`px-6 py-2 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 w-full ${
                          !bookingState.isBookingAllowed || isRequesting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl shadow-md'
                        }`}
                      >
                        {isRequesting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="rounded-full h-5 w-5 border-b-2 border-white"
                            />
                            <span>Processing...</span>
                          </>
                        ) : !bookingState.isBookingAllowed ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Wait {formatCooldownTime(bookingState.cooldownRemaining)}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Request Ride</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Input */}
              <div className="relative search-container">
                <div className="relative">
                  <motion.input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    placeholder={getPlaceholder()}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-500 transition-all backdrop-blur-sm"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-4 w-4 border-b-2 border-blue-600"
                      />
                    </div>
                  )}
                </div>
                
                {/* Mode Indicator */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={pulseAnimation}
                      className={`w-2 h-2 rounded-full ${
                        activeMode === 'start' ? 'bg-green-500' :
                        activeMode === 'destination' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                    />
                    <span className="text-sm text-gray-600 font-medium">{getActiveModeText()}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {currentLocation.address?.split(',')[0]}
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-300 max-h-60 overflow-y-auto z-50"
                    >
                      {searchSuggestions.map((suggestion, index) => (
                        <motion.button
                          key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.display_name.split(',')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {suggestion.display_name.split(',').slice(1).join(',').trim()}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Selected Locations Summary */}
            <AnimatePresence>
              {(selectedStartLocation || selectedEndLocation || waypoints.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Selected Locations</h4>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearAllSelections}
                      disabled={!selectedEndLocation && waypoints.length === 0}
                      className="text-xs px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center space-x-1 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear All</span>
                    </motion.button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Start Location */}
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                        <span className="text-xs text-white font-bold">S</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Start Location</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSetStartLocation}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Change
                          </motion.button>
                        </div>
                        <p className="text-sm text-gray-800 truncate">{selectedStartLocation?.address}</p>
                      </div>
                    </motion.div>

                    {/* Waypoints */}
                    <AnimatePresence>
                      {waypoints.map((waypoint, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 20, opacity: 0 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm">
                            <span className="text-xs text-white font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Stop {index + 1}</span>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => editWaypoint(index)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeWaypoint(index)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </motion.button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 truncate">{waypoint.address}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Destination */}
                    <AnimatePresence>
                      {selectedEndLocation && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                            <span className="text-xs text-white font-bold">D</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Destination</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSetDestination}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Change
                              </motion.button>
                            </div>
                            <p className="text-sm text-gray-800 truncate">{selectedEndLocation.address}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Route Information */}
                  <AnimatePresence>
                    {routeData && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Distance</p>
                            <p className="text-lg font-bold text-gray-800">{routeData.distance.toFixed(1)} km</p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Est. Time</p>
                            <p className="text-lg font-bold text-gray-800">{Math.ceil(routeData.duration)} min</p>
                          </div>
                        </div>
                        {isRouteCalculating && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="mt-3 text-center"
                          >
                            <p className="text-xs text-gray-500">Calculating optimal route...</p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map Component */}
            <motion.div
              ref={mapContainerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl overflow-hidden border border-gray-300 shadow-lg"
            >
              <HybridMap 
                startLocation={hybridMapStartLocation}
                endLocation={selectedEndLocation}
                currentLocation={currentLocation}
                waypoints={waypoints}
                onRouteUpdate={handleRouteUpdate}
                height="400px"
                onLocationSelect={handleLocationSelect}
                showSearch={false}
                interactive={true}
                mapStyle="transport"
                autoCalculateRoute={!!selectedStartLocation && !!selectedEndLocation}
              />
            </motion.div>
          </div>

          {/* Right Column - Booking Process */}
          <div className="lg:w-1/3 space-y-6">
            {/* Booking Process Steps */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideIn}
              className="rounded-2xl p-6 shadow-lg border border-gray-100 bg-white/95 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Booking Journey</h3>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(bookingSteps.filter(s => s.completed).length / bookingSteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 to-blue-600"
                  />
                </div>
                
                <div className="space-y-8">
                  {bookingSteps.map((step) => (
                    <motion.div
                      key={step.step}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: step.step * 0.1 }}
                      className="flex items-start relative"
                    >
                      <motion.div
                        animate={step.active ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                          step.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                          step.active ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                          'bg-gray-300'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.active ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-3 h-3 rounded-full bg-white"
                          />
                        ) : (
                          <span className="text-sm text-white">{step.step}</span>
                        )}
                      </motion.div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{step.icon}</span>
                          <div>
                            <h4 className={`text-sm font-medium ${
                              step.status === 'completed' ? 'text-green-700' : 
                              step.active ? 'text-blue-600' : 
                              'text-gray-500'
                            }`}>
                              {step.title}
                            </h4>
                            <p className="text-gray-500 text-xs mt-1">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={addWaypoint}
                disabled={!selectedEndLocation}
                className={`p-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all border ${
                  !selectedEndLocation 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-gray-700 hover:shadow-lg border-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs font-medium">Add Stop</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllSelections}
                disabled={!selectedEndLocation && waypoints.length === 0}
                className={`p-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all border ${
                  !selectedEndLocation && waypoints.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-gray-700 hover:shadow-lg border-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs font-medium">Clear All</span>
              </motion.button>
            </motion.div>
            
            {/* Status Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border border-green-200"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Ready to Book!</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {selectedEndLocation 
                      ? `Ride from ${selectedStartLocation?.address?.split(',')[0] || 'current location'} to ${selectedEndLocation.address?.split(',')[0]}`
                      : 'Select a destination to continue.'}
                  </p>
                  {cooldownTimer > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 pt-2 border-t border-gray-200"
                    >
                      <div className="text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Next request in: <span className="font-semibold">{formatCooldownTime(cooldownTimer)}</span></span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Tips
              </h4>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Click on map to set locations directly
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Add stops for work breaks or meetings
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Route updates automatically with changes
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}