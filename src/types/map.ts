// types/map.ts

export interface SnapToRoadsResponse {
  snappedPoints: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
    originalIndex?: number;
    placeId: string;
  }>;
  warningMessage?: string;
}

export interface SpeedLimitsResponse {
  speedLimits: Array<{
    placeId: string;
    speedLimit: number;
    units: 'KPH' | 'MPH';
  }>;
}

export interface OpenRouteServiceRoute {
  type: string;
  features: Array<{
    type: string;
    properties: {
      summary: {
        distance: number;
        duration: number;
      };
      segments: Array<{
        distance: number;
        duration: number;
        steps: Array<{
          distance: number;
          duration: number;
          type: number;
          instruction: string;
          name: string;
          way_points: number[];
        }>;
      }>;
    };
    geometry: {
      type: string;
      coordinates: number[][];
    };
  }>;
  bbox: [number, number, number, number];
}

export interface RouteWithTraffic {
  distance: number;
  duration: number;
  trafficDuration: number;
  polyline: string;
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    duration_in_traffic: {
      text: string;
      value: number;
    };
    steps: any[];
  }>;
  snappedPoints?: Array<{
    lat: number;
    lng: number;
    placeId?: string;
  }>;
  speedLimits?: Array<{
    placeId: string;
    speedLimit: number;
    units: 'KPH' | 'MPH';
  }>;
  routeGeometry?: number[][];
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  trafficInfo?: {
    hasTraffic: boolean;
    trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
    trafficDelay: number;
  };
}

export interface PlaceSuggestion {
  name: string;
  lat: number;
  lng: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  type?: string;
  importance?: number;
}

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
  boundingbox: [string, string, string, string];
}

export interface MapRouteResult {
  success: boolean;
  data?: RouteWithTraffic;
  error?: string;
  metadata?: {
    engine: 'openrouteservice' | 'fallback' | 'google';
    processingTime: number;
    cached: boolean;
    trafficAvailable: boolean;
  };
}

export interface GeocodeResult {
  success: boolean;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  formattedAddress?: string;
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
    postalCode?: string;
  };
  confidence?: number;
}

export interface RouteStatistics {
  totalDistance: number;
  totalDuration: number;
  totalDurationWithTraffic: number;
  averageSpeed: number;
  maxSpeedLimit: number;
  minSpeedLimit: number;
  waypointsCount: number;
  roadTypes: {
    highway: number;
    primary: number;
    secondary: number;
    tertiary: number;
    residential: number;
  };
}

export interface TrafficSegment {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  speed: number;
  congestion: 'low' | 'moderate' | 'high' | 'severe';
  delay: number;
}

export interface TrafficInfo {
  hasTraffic: boolean;
  trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
  trafficDelay: number;
  trafficSegments: TrafficSegment[];
}

export interface MapTileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  color: string;
  icon?: string;
  draggable?: boolean;
}

export interface RouteOptimizationOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  optimizeWaypoints?: boolean;
  departureTime?: string;
}