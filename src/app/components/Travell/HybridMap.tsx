// components/HybridMap.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
// Remove the direct import of L from leaflet
import { Location } from '@/types/transport';
import { Search, MapPin, Navigation, Clock, Route, AlertCircle, Car } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Move the icon fix into a separate useEffect
const fixLeafletIcon = () => {
  if (typeof window === 'undefined') return; // Guard for server-side
  
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Rest of your interfaces remain the same...
interface HybridMapProps {
  startLocation?: Location;
  endLocation?: Location;
  currentLocation?: Location;
  waypoints?: Location[];
  onRouteUpdate?: (data: {
    distance: number;
    duration: number;
    trafficDuration: number;
    snappedRoute: Array<{ lat: number; lng: number }>;
    speedLimits: Array<{ placeId: string; speedLimit: number }>;
  }) => void;
  interactive?: boolean;
  mapStyle?: 'default' | 'transport' | 'cycle' | 'landscape';
  height?: string;
  onLocationSelect?: (location: Location, type: 'start' | 'destination' | 'waypoint') => void;
  showSearch?: boolean;
  autoCalculateRoute?: boolean;
  searchPlaceholder?: string;
}

interface SearchSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  trafficDuration: number;
  snappedRoute: Array<{ lat: number; lng: number }>;
  speedLimits: Array<{ placeId: string; speedLimit: number }>;
  isFastest?: boolean;
  isCommon?: boolean;
}

export default function HybridMap({
  startLocation,
  endLocation,
  currentLocation,
  waypoints = [],
  onRouteUpdate,
  interactive = true,
  mapStyle = 'default',
  height = '400px',
  onLocationSelect,
  showSearch = true,
  autoCalculateRoute = false,
  searchPlaceholder = 'Search for places...',
}: HybridMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const commonRouteLayerRef = useRef<any>(null);
  const fastestRouteLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const searchMarkerRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<{
    commonRoute: RouteInfo | null;
    fastestRoute: RouteInfo | null;
  } | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState<'start' | 'destination' | 'waypoint'>('destination');

  // Track which markers have been added to avoid duplicates
  const addedMarkersRef = useRef<Set<string>>(new Set());

  // Tile layer configurations
  const tileLayers = {
    default: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    },
    transport: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    },
    cycle: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    },
    landscape: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }
  };

  // Initialize map with fallback tile layer
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || typeof window === 'undefined') return;

    try {
      const L = require('leaflet');
      fixLeafletIcon();
      
      const tileConfig = tileLayers[mapStyle];
      
      const map = L.map(mapRef.current, {
        zoomControl: interactive,
        scrollWheelZoom: interactive,
        dragging: interactive,
        attributionControl: true,
      });

      // Set view based on available locations
      const initialLocation = currentLocation || startLocation || { lat: 23.8103, lng: 90.4125, address: 'Dhaka, Bangladesh' };
      map.setView([initialLocation.lat, initialLocation.lng], 13);

      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
        subdomains: tileConfig.subdomains,
      }).addTo(map);

      // Add click event for map
      if (interactive && onLocationSelect) {
        map.on('click', (e: any) => {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
      setIsLoading(false);
      
      // Add initial markers
      addInitialMarkers();
      
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [mapStyle, interactive, onLocationSelect, currentLocation, startLocation]);

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    if (!onLocationSelect || !mapInstanceRef.current || typeof window === 'undefined') return;

    try {
      // Try to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        
        const location: Location = {
          lat,
          lng,
          address
        };
        
        onLocationSelect(location, selectedLocationType);
        addSearchMarker(lat, lng, address);
      } else {
        // If reverse geocoding fails, use coordinates
        const location: Location = {
          lat,
          lng,
          address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
        };
        
        onLocationSelect(location, selectedLocationType);
        addSearchMarker(lat, lng, location.address ? location.address : "");
      }
    } catch (error) {
      // Fallback to coordinates
      const location: Location = {
        lat,
        lng,
        address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      };
      
      onLocationSelect(location, selectedLocationType);
      addSearchMarker(lat, lng, location.address ? location.address : "");
    }
  };

  // Add search marker to map
  const addSearchMarker = (lat: number, lng: number, address: string) => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;
    const markerId = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
    
    // Remove previous search marker
    if (searchMarkerRef.current) {
      const oldId = searchMarkerRef.current.getLatLng().lat.toFixed(6) + '_' + 
                    searchMarkerRef.current.getLatLng().lng.toFixed(6);
      addedMarkersRef.current.delete(oldId);
      searchMarkerRef.current.remove();
    }
    
    // Create appropriate marker based on location type
    let markerColor = '#9333ea'; // Default purple for waypoints
    let markerLabel = '📍';
    
    if (selectedLocationType === 'start') {
      markerColor = '#10B981'; // Green for start
      markerLabel = 'S';
    } else if (selectedLocationType === 'destination') {
      markerColor = '#EF4444'; // Red for destination
      markerLabel = 'D';
    }

    // Check if marker already exists at this location
    if (addedMarkersRef.current.has(markerId)) {
      return; // Skip adding duplicate marker
    }

    const searchMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `
          <div style="
            background: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">
            ${markerLabel}
          </div>
        `,
        className: 'search-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    })
    .bindPopup(`<b>${selectedLocationType === 'start' ? 'Start' : selectedLocationType === 'destination' ? 'Destination' : 'Waypoint'}</b><br>${address}`)
    .addTo(map);
    
    searchMarkerRef.current = searchMarker;
    addedMarkersRef.current.add(markerId);
    
    // Pan to clicked location
    map.panTo([lat, lng]);
  };

  // Add initial markers
  const addInitialMarkers = useCallback(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;
    
    // Clear existing markers except search marker
    markersRef.current.forEach(marker => {
      if (marker !== searchMarkerRef.current) {
        marker.remove();
      }
    });
    markersRef.current = searchMarkerRef.current ? [searchMarkerRef.current] : [];
    addedMarkersRef.current.clear();
    
    // Add search marker to tracking set
    if (searchMarkerRef.current) {
      const pos = searchMarkerRef.current.getLatLng();
      addedMarkersRef.current.add(`${pos.lat.toFixed(6)}_${pos.lng.toFixed(6)}`);
    }

    // Create custom icons
    const createCustomIcon = (html: string, className: string, size: number) => {
      return L.divIcon({
        html,
        className,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
      });
    };

    // Add current location marker
    if (currentLocation) {
      const markerId = `${currentLocation.lat.toFixed(6)}_${currentLocation.lng.toFixed(6)}`;
      if (!addedMarkersRef.current.has(markerId)) {
        const currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: createCustomIcon(
            `<div style="
              background: #3B82F6;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              animation: pulse 1.5s infinite;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              C
            </div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>`,
            'current-marker',
            28
          )
        }).bindPopup(`<b>Your Location</b><br/>${currentLocation.address}`).addTo(map);
        
        markersRef.current.push(currentMarker);
        addedMarkersRef.current.add(markerId);
      }
    }

    // Add start marker if provided and not same as current location
    if (startLocation) {
      const markerId = `${startLocation.lat.toFixed(6)}_${startLocation.lng.toFixed(6)}`;
      const isSameAsCurrent = currentLocation && 
        currentLocation.lat.toFixed(6) === startLocation.lat.toFixed(6) && 
        currentLocation.lng.toFixed(6) === startLocation.lng.toFixed(6);
      
      if (!addedMarkersRef.current.has(markerId) && !isSameAsCurrent) {
        const startMarker = L.marker([startLocation.lat, startLocation.lng], {
          icon: createCustomIcon(
            `<div style="
              background: #10B981;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              S
            </div>`,
            'start-marker',
            28
          )
        }).bindPopup(`<b>Start Location</b><br/>${startLocation.address}`).addTo(map);
        
        markersRef.current.push(startMarker);
        addedMarkersRef.current.add(markerId);
      }
    }

    // Add end marker if provided
    if (endLocation) {
      const markerId = `${endLocation.lat.toFixed(6)}_${endLocation.lng.toFixed(6)}`;
      const isSameAsCurrent = currentLocation && 
        currentLocation.lat.toFixed(6) === endLocation.lat.toFixed(6) && 
        currentLocation.lng.toFixed(6) === endLocation.lng.toFixed(6);
      const isSameAsStart = startLocation && 
        startLocation.lat.toFixed(6) === endLocation.lat.toFixed(6) && 
        startLocation.lng.toFixed(6) === endLocation.lng.toFixed(6);
      
      if (!addedMarkersRef.current.has(markerId) && !isSameAsCurrent && !isSameAsStart) {
        const endMarker = L.marker([endLocation.lat, endLocation.lng], {
          icon: createCustomIcon(
            `<div style="
              background: #EF4444;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              D
            </div>`,
            'end-marker',
            28
          )
        }).bindPopup(`<b>Destination</b><br/>${endLocation.address}`).addTo(map);
        
        markersRef.current.push(endMarker);
        addedMarkersRef.current.add(markerId);
      }
    }

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const markerId = `${waypoint.lat.toFixed(6)}_${waypoint.lng.toFixed(6)}`;
      if (!addedMarkersRef.current.has(markerId)) {
        const waypointMarker = L.marker([waypoint.lat, waypoint.lng], {
          icon: createCustomIcon(
            `<div style="
              background: #F59E0B;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">
              ${index + 1}
            </div>`,
            'waypoint-marker',
            24
          )
        }).bindPopup(`<b>Stop ${index + 1}:</b><br/>${waypoint.address}`).addTo(map);
        
        markersRef.current.push(waypointMarker);
        addedMarkersRef.current.add(markerId);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(markersRef.current.map(marker => marker.getLatLng()));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [currentLocation, startLocation, endLocation, waypoints]);

  // Search function using OpenStreetMap Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=bd&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchSuggestion[] = await response.json();
      setSearchResults(data.slice(0, 6));
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchLocations(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Handle search result selection
  const handleSearchResultClick = useCallback((result: SearchSuggestion) => {
    const location: Location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    };

    // Call parent callback
    if (onLocationSelect) {
      onLocationSelect(location, selectedLocationType);
    }

    // Center map on selected location
    if (mapInstanceRef.current) {
      addSearchMarker(location.lat, location.lng, location.address ? location.address : "" );
    }

    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
  }, [onLocationSelect, selectedLocationType]);

  // Get road route from OSRM (Open Source Routing Machine) - follows actual roads
  const getRoadRoute = async (locations: Location[]): Promise<RouteInfo | null> => {
    if (locations.length < 2) return null;

    try {
      // Format coordinates for OSRM API: lon,lat;lon,lat;...
      const coordinates = locations
        .map(loc => `${loc.lng},${loc.lat}`)
        .join(';');
      
      // OSRM API for car routing (driving profile)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) throw new Error('OSRM routing failed');
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const distance = route.distance / 1000; // Convert meters to kilometers
      const duration = route.duration / 60; // Convert seconds to minutes
      
      // Get the geometry points
      const snappedRoute = route.geometry.coordinates.map((coord: [number, number]) => ({
        lng: coord[0],
        lat: coord[1]
      }));

      // Calculate traffic duration (add 20% for traffic)
      const trafficDuration = duration * 1.2;

      return {
        distance,
        duration,
        trafficDuration,
        snappedRoute,
        speedLimits: []
      };

    } catch (error) {
      console.error('Error getting road route:', error);
      // Fallback to straight line calculation
      return calculateStraightLineRoute(locations);
    }
  };

  // Fallback to straight line calculation
  const calculateStraightLineRoute = (locations: Location[]): RouteInfo => {
    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      totalDistance += calculateDistance(locations[i], locations[i + 1]);
    }
    
    const duration = totalDistance * 2; // 2 minutes per km
    const trafficDuration = duration * 1.3;
    
    return {
      distance: totalDistance,
      duration,
      trafficDuration,
      snappedRoute: locations.map(loc => ({ lat: loc.lat, lng: loc.lng })),
      speedLimits: []
    };
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Calculate and display both routes
  const calculateAndDisplayRoutes = useCallback(async () => {
    if (!mapInstanceRef.current || !startLocation || !endLocation || typeof window === 'undefined') {
      setError('Start and destination locations are required to calculate route');
      return;
    }

    setIsRouteLoading(true);
    setError(null);

    try {
      const L = require('leaflet');
      
      // Clear existing routes
      if (commonRouteLayerRef.current) {
        commonRouteLayerRef.current.remove();
      }
      if (fastestRouteLayerRef.current) {
        fastestRouteLayerRef.current.remove();
      }

      const map = mapInstanceRef.current;

      // Calculate common route (with all waypoints)
      const commonRouteLocations = [startLocation, ...waypoints, endLocation];
      const commonRoute = await getRoadRoute(commonRouteLocations);
      
      // Calculate fastest route (direct route with no waypoints or optimized)
      const fastestRouteLocations = [startLocation, endLocation];
      const fastestRoute = await getRoadRoute(fastestRouteLocations);

      if (!commonRoute || !fastestRoute) {
        throw new Error('Failed to calculate routes');
      }

      const routeInfo = {
        commonRoute: { ...commonRoute, isCommon: true },
        fastestRoute: { ...fastestRoute, isFastest: true }
      };

      setRouteData(routeInfo);

      // Notify parent with the common route (for backward compatibility)
      if (onRouteUpdate) {
        onRouteUpdate(commonRoute);
      }

      // Draw both routes
      if (commonRoute.snappedRoute.length > 0) {
        const commonPolyline = L.polyline(
          commonRoute.snappedRoute.map(p => [p.lat, p.lng]),
          {
            color: '#0078ff', // Blue for common route
            weight: 4,
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: '5, 5' // Dashed line for common route
          }
        ).bindPopup('<b>Common Route</b><br>Route with all waypoints').addTo(map);
        commonRouteLayerRef.current = commonPolyline;
      }

      if (fastestRoute.snappedRoute.length > 0) {
        const fastestPolyline = L.polyline(
          fastestRoute.snappedRoute.map(p => [p.lat, p.lng]),
          {
            color: '#10B981', // Green for fastest route
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }
        ).bindPopup('<b>Fastest Route</b><br>Direct route optimized for time').addTo(map);
        fastestRouteLayerRef.current = fastestPolyline;
      }

      // Fit bounds to show all markers and routes
      const allPoints = [
        ...markersRef.current.map(marker => marker.getLatLng()),
        ...commonRoute.snappedRoute.map(p => L.latLng(p.lat, p.lng)),
        ...fastestRoute.snappedRoute.map(p => L.latLng(p.lat, p.lng))
      ];
      
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

    } catch (err) {
      console.error('Error calculating route:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
    } finally {
      setIsRouteLoading(false);
    }
  }, [startLocation, endLocation, waypoints, onRouteUpdate]);

  // Initialize map on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initMap();
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  // Update markers when locations change
  useEffect(() => {
    if (!isLoading && mapInstanceRef.current && typeof window !== 'undefined') {
      addInitialMarkers();
    }
  }, [isLoading, addInitialMarkers]);

  // Calculate route when destinations change
  useEffect(() => {
    if (autoCalculateRoute && startLocation && endLocation && typeof window !== 'undefined') {
      calculateAndDisplayRoutes();
    }
  }, [autoCalculateRoute, startLocation, endLocation, calculateAndDisplayRoutes]);

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

  // Set location type for selection
  const setLocationType = (type: 'start' | 'destination' | 'waypoint') => {
    setSelectedLocationType(type);
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height }}>
      {/* Location Type Selector - FIXED Z-INDEX */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="flex space-x-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-300">
          <button
            onClick={() => setLocationType('start')}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              selectedLocationType === 'start' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Start</span>
          </button>
          <button
            onClick={() => setLocationType('destination')}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              selectedLocationType === 'destination' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-medium">Destination</span>
          </button>
          <button
            onClick={() => setLocationType('waypoint')}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              selectedLocationType === 'waypoint' 
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Route className="w-4 h-4" />
            <span className="text-sm font-medium">Waypoint</span>
          </button>
        </div>
      </div>

      {/* Search Box - FIXED Z-INDEX AND VISIBILITY */}
      {showSearch && (
        <div className="absolute top-20 left-4 z-[1000] w-80 search-container">
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto z-[2000]">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.lat}-${result.lon}-${index}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm text-blue-600">
                        {result.type === 'highway' ? '🛣️' : 
                         result.type === 'building' ? '🏢' :
                         result.type === 'amenity' ? '🏪' : '📍'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.display_name.split(',')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {result.display_name.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      {isRouteLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="text-center bg-white p-6 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600 font-medium">Calculating routes...</p>
            <p className="text-sm text-gray-500 mt-1">Finding road paths using OpenStreetMap</p>
          </div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-sm">
            <div className="text-red-600 mb-3">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 font-medium">{error}</p>
            {startLocation && endLocation && (
              <button
                onClick={calculateAndDisplayRoutes}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry Route Calculation
              </button>
            )}
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Route Info Panel - FIXED VISIBILITY */}
      {routeData && !error && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-xs border border-gray-300 z-[1000]">
          <div className="space-y-4">
            {/* Common Route Info */}
            {routeData.commonRoute && (
              <div className="pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-sm font-semibold text-gray-700">Road Route</h4>
                  <span className="text-xs text-gray-500 ml-auto">Via {waypoints.length || 0} stops</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Route className="w-3 h-3 mr-1" /> Distance:
                    </span>
                    <span className="font-semibold">{routeData.commonRoute.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Time:
                    </span>
                    <span className="font-semibold">{Math.ceil(routeData.commonRoute.duration)} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">With Traffic:</span>
                    <span className="font-semibold text-amber-600">
                      {Math.ceil(routeData.commonRoute.trafficDuration)} min
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Fastest Route Info */}
            {routeData.fastestRoute && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h4 className="text-sm font-semibold text-gray-700">Fastest Route</h4>
                  <span className="text-xs text-green-600 ml-auto font-medium">Recommended</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Route className="w-3 h-3 mr-1" /> Distance:
                    </span>
                    <span className="font-semibold">{routeData.fastestRoute.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Time:
                    </span>
                    <span className="font-semibold text-green-600">
                      {Math.ceil(routeData.fastestRoute.duration)} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">With Traffic:</span>
                    <span className="font-semibold text-green-600">
                      {Math.ceil(routeData.fastestRoute.trafficDuration)} min
                    </span>
                  </div>
                  {routeData.commonRoute && routeData.fastestRoute && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Save ~{Math.ceil(routeData.commonRoute.duration - routeData.fastestRoute.duration)} minutes
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Legend Panel - FIXED VISIBILITY */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-gray-300 z-[1000]">
        <div className="flex flex-col space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-medium">Your Location</span>
          </div>
          {startLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Start Point</span>
            </div>
          )}
          {endLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Destination</span>
            </div>
          )}
          {waypoints.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Stop ({waypoints.length})</span>
            </div>
          )}
          {onLocationSelect && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Click to Select</span>
            </div>
          )}
          {routeData && (
            <>
              <div className="flex items-center space-x-2 mt-1 pt-1 border-t border-gray-200">
                <div className="w-3 h-1 bg-blue-500"></div>
                <span>Common Route</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-green-500"></div>
                <span className="font-medium">Fastest Route</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Map controls - FIXED VISIBILITY */}
      {interactive && mapInstanceRef.current && (
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-[1000]">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-300 transition-colors"
            title="Zoom in"
          >
            <span className="text-lg font-semibold text-gray-700">+</span>
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-300 transition-colors"
            title="Zoom out"
          >
            <span className="text-lg font-semibold text-gray-700">−</span>
          </button>
          <button
            onClick={() => {
              const allPoints = [
                ...(startLocation ? [[startLocation.lat, startLocation.lng]] : []),
                ...(endLocation ? [[endLocation.lat, endLocation.lng]] : []),
                ...waypoints.map(wp => [wp.lat, wp.lng])
              ];
              if (allPoints.length > 0) {
                mapInstanceRef.current?.fitBounds(allPoints as [number, number][], { padding: [60, 60] });
              }
            }}
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 border border-gray-300 transition-colors"
            title="Fit to view"
          >
            <span className="text-lg text-gray-700">⌖</span>
          </button>
          {startLocation && endLocation && (
            <button
              onClick={calculateAndDisplayRoutes}
              className="w-9 h-9 bg-blue-600 text-white rounded-full shadow flex items-center justify-center hover:bg-blue-700 transition-colors"
              title="Calculate routes"
            >
              <Car className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Instructions Panel - FIXED VISIBILITY */}
      {onLocationSelect && (
        <div className="absolute bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-300 z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Map Instructions
            </h4>
            <div className="text-xs text-gray-500">
              Selected: <span className="font-medium capitalize">{selectedLocationType}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium">Start Point</span>
              </div>
              <p className="text-gray-600">Click anywhere on the map or search to set start location</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-medium">Destination</span>
              </div>
              <p className="text-gray-600">Select destination point for route calculation</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-medium">Waypoints</span>
              </div>
              <p className="text-gray-600">Add stops along your route by selecting waypoints</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}