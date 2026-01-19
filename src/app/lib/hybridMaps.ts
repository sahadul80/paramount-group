// lib/hybridMaps.ts
import { 
  Location, 
  Route, 
  MapBounds,
  RouteStep 
} from '@/types/transport';
import { 
  SnapToRoadsResponse, 
  SpeedLimitsResponse,
  OpenRouteServiceRoute,
  RouteWithTraffic,
  PlaceSuggestion,
  NominatimResponse,
  MapRouteResult,
  GeocodeResult,
  RouteStatistics,
  TrafficInfo,
  MapTileConfig,
  MapMarker,
  RouteOptimizationOptions
} from '@/types/map';

export class HybridMapService {
  private static readonly GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
  private static readonly OPENROUTESERVICE_API_KEY = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY || '';
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  
  // Cache for API responses
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // OpenStreetMap tile configurations
  static readonly TILE_LAYERS: Record<string, MapTileConfig> = {
    default: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    },
    transport: {
      url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apikey}',
      attribution: 'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 22,
      subdomains: ['a', 'b', 'c']
    },
    cycle: {
      url: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}',
      attribution: 'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 22,
      subdomains: ['a', 'b', 'c']
    },
    landscape: {
      url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}',
      attribution: 'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 22,
      subdomains: ['a', 'b', 'c']
    }
  };

  /**
   * Get tile layer configuration
   */
  static getTileLayer(style: keyof typeof HybridMapService.TILE_LAYERS = 'default'): MapTileConfig {
    return this.TILE_LAYERS[style];
  }

  /**
   * Google Roads API - Snap GPS points to roads
   */
  static async snapToRoads(
    points: Array<{ lat: number; lng: number }>,
    interpolate: boolean = true
  ): Promise<SnapToRoadsResponse> {
    if (!this.GOOGLE_API_KEY) {
      console.warn('Google API key not configured, using fallback');
      return this.getFallbackSnapToRoads(points);
    }

    const cacheKey = `snap_${JSON.stringify(points)}_${interpolate}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const path = points.map(p => `${p.lat},${p.lng}`).join('|');
    
    try {
      const response = await fetch(
        `https://roads.googleapis.com/v1/snapToRoads?` +
        `path=${encodeURIComponent(path)}&interpolate=${interpolate}&key=${this.GOOGLE_API_KEY}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Roads API error: ${response.status} ${errorText}`);
      }

      const data: SnapToRoadsResponse = await response.json();
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.warn('Failed to snap to roads, using fallback:', error);
      return this.getFallbackSnapToRoads(points);
    }
  }

  /**
   * Google Roads API - Get speed limits
   */
  static async getSpeedLimits(placeIds: string[]): Promise<SpeedLimitsResponse> {
    if (!this.GOOGLE_API_KEY || placeIds.length === 0) {
      return { speedLimits: [] };
    }

    const cacheKey = `speed_${placeIds.join('_')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const placeIdsStr = placeIds.filter(id => id && !id.startsWith('fallback_')).join('|');
    
    if (!placeIdsStr) {
      return { speedLimits: [] };
    }

    try {
      const response = await fetch(
        `https://roads.googleapis.com/v1/speedLimits?` +
        `placeId=${placeIdsStr}&key=${this.GOOGLE_API_KEY}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Speed Limits API error: ${response.status} ${errorText}`);
      }

      const data: SpeedLimitsResponse = await response.json();
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.warn('Failed to get speed limits:', error);
      return { speedLimits: [] };
    }
  }

  /**
   * Get route with traffic using OpenRouteService
   */
  static async getRouteWithTraffic(
    start: Location,
    end: Location,
    waypoints: Location[] = [],
    options: RouteOptimizationOptions = {}
  ): Promise<MapRouteResult> {
    const cacheKey = `route_${JSON.stringify({ start, end, waypoints, options })}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached as RouteWithTraffic,
        metadata: {
          engine: 'openrouteservice',
          processingTime: 0,
          cached: true,
          trafficAvailable: true
        }
      };
    }

    const coordinates = [
      [start.lng, start.lat],
      ...waypoints.map(wp => [wp.lng, wp.lat]),
      [end.lng, end.lat]
    ];

    try {
      const body: any = {
        coordinates,
        instructions: false,
        geometry: true,
        units: 'km',
        optimize: options.optimizeWaypoints || false,
      };

      if (options.avoidTolls || options.avoidHighways || options.avoidFerries) {
        body.options = {
          avoid_features: [
            ...(options.avoidTolls ? ['tolls'] : []),
            ...(options.avoidHighways ? ['highways'] : []),
            ...(options.avoidFerries ? ['ferries'] : [])
          ]
        };
      }

      const startTime = Date.now();
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'POST',
          headers: {
            'Authorization': this.OPENROUTESERVICE_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouteService error: ${response.status} ${errorText}`);
      }

      const data: OpenRouteServiceRoute = await response.json();
      
      if (!data.features?.[0]) {
        throw new Error('No route found');
      }

      const route = data.features[0];
      const distance = route.properties.summary.distance / 1000; // km
      const duration = route.properties.summary.duration / 60; // minutes

      // Decode geometry to get points
      const points = this.decodeGeometry(route.geometry.coordinates);
      
      // Snap route points to roads for accuracy
      const pointsToSnap = this.samplePoints(points, 20); // Sample 20 points to save API calls
      const snappedPoints = await this.snapToRoads(pointsToSnap);
      
      // Get speed limits for snapped points
      const placeIds = snappedPoints.snappedPoints
        .map(p => p.placeId)
        .filter((id): id is string => id !== undefined && !id.startsWith('fallback_'));
      
      const speedLimits = await this.getSpeedLimits(placeIds);

      // Estimate traffic based on time of day (pass full route response `data` to match OpenRouteServiceRoute)
      const trafficInfo = this.estimateTrafficInfo(data, options.departureTime);

      const result: RouteWithTraffic = {
        distance,
        duration,
        trafficDuration: duration * trafficInfo.trafficDelay,
        polyline: route.geometry.coordinates.join(';'),
        legs: [{
          distance: { 
            text: `${distance.toFixed(1)} km`, 
            value: distance * 1000 
          },
          duration: { 
            text: `${Math.round(duration)} min`, 
            value: duration * 60 
          },
          duration_in_traffic: { 
            text: `${Math.round(duration * trafficInfo.trafficDelay)} min`, 
            value: duration * trafficInfo.trafficDelay * 60 
          },
          steps: route.properties.segments?.[0]?.steps || []
        }],
        snappedPoints: snappedPoints.snappedPoints.map(p => ({
          lat: p.location.latitude,
          lng: p.location.longitude,
          placeId: p.placeId
        })),
        speedLimits: speedLimits.speedLimits,
        routeGeometry: route.geometry.coordinates,
        bounds: this.calculateBounds(route.geometry.coordinates),
        trafficInfo
      };

      this.saveToCache(cacheKey, result);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          engine: 'openrouteservice',
          processingTime,
          cached: false,
          trafficAvailable: true
        }
      };

    } catch (error) {
      console.error('Routing failed, using fallback:', error);
      return this.getFallbackRoute(start, end, waypoints);
    }
  }

  /**
   * Reverse geocoding using OpenStreetMap
   */
  static async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const cacheKey = `reverse_${lat}_${lng}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        address: cached.address,
        location: cached.location,
        formattedAddress: cached.formattedAddress,
        addressComponents: cached.addressComponents,
        confidence: 0.9
      };
    }

    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/reverse?` +
        `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FleetPro/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data: NominatimResponse = await response.json();
      
      const result: GeocodeResult = {
        success: true,
        address: data.display_name,
        location: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
        formattedAddress: data.display_name,
        addressComponents: data.address ? {
          streetNumber: data.address.road,
          locality: data.address.city || data.address.town || data.address.village,
          administrativeArea: data.address.state,
          country: data.address.country,
          postalCode: data.address.postcode
        } : undefined,
        confidence: 0.8
      };

      this.saveToCache(cacheKey, result);
      return result;

    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {
        success: false,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        location: { lat, lng },
        confidence: 0.1
      };
    }
  }

  /**
   * Place autocomplete using OpenStreetMap
   */
  static async searchPlaces(
    query: string, 
    countryCode: string = 'bd',
    limit: number = 5
  ): Promise<PlaceSuggestion[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query}_${countryCode}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/search?` +
        `q=${encodeURIComponent(query)}&format=json&limit=${limit}&countrycodes=${countryCode}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FleetPro/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Place search failed');
      }

      const data: NominatimResponse[] = await response.json();
      
      const suggestions: PlaceSuggestion[] = data.map((place) => ({
        name: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        address: place.address,
        type: place.osm_type
      }));

      this.saveToCache(cacheKey, suggestions);
      return suggestions;

    } catch (error) {
      console.warn('Place search failed:', error);
      return [];
    }
  }

  /**
   * Get route statistics
   */
  static calculateRouteStatistics(route: RouteWithTraffic): RouteStatistics {
    const speedLimits = route.speedLimits || [];
    const maxSpeed = speedLimits.length > 0 
      ? Math.max(...speedLimits.map(s => s.speedLimit)) 
      : 60;
    const minSpeed = speedLimits.length > 0 
      ? Math.min(...speedLimits.map(s => s.speedLimit)) 
      : 20;

    // Estimate road types based on distance and common distribution
    const roadTypes = {
      highway: route.distance * 0.3,
      primary: route.distance * 0.4,
      secondary: route.distance * 0.2,
      tertiary: route.distance * 0.08,
      residential: route.distance * 0.02
    };

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      totalDurationWithTraffic: route.trafficDuration,
      averageSpeed: (route.distance / route.duration) * 60,
      maxSpeedLimit: maxSpeed,
      minSpeedLimit: minSpeed,
      waypointsCount: route.snappedPoints?.length || 0,
      roadTypes
    };
  }

  /**
   * Calculate distance between multiple points
   */
  static calculateTotalDistance(points: Array<{ lat: number; lng: number }>): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistanceBetween(points[i], points[i + 1]);
    }
    return totalDistance;
  }

  /**
   * Generate markers for map
   */
  static generateMarkers(
    start: Location,
    end: Location,
    waypoints: Location[] = [],
    currentLocation?: Location
  ): MapMarker[] {
    const markers: MapMarker[] = [];

    // Start marker
    markers.push({
      position: { lat: start.lat, lng: start.lng },
      title: 'Start',
      color: '#10B981',
      icon: '🚗'
    });

    // End marker
    markers.push({
      position: { lat: end.lat, lng: end.lng },
      title: 'Destination',
      color: '#EF4444',
      icon: '📍'
    });

    // Waypoint markers
    waypoints.forEach((waypoint, index) => {
      markers.push({
        position: { lat: waypoint.lat, lng: waypoint.lng },
        title: `Stop ${index + 1}`,
        color: '#F59E0B',
        icon: '⏱️'
      });
    });

    // Current location marker
    if (currentLocation) {
      markers.push({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        title: 'Current Location',
        color: '#3B82F6',
        icon: '📍',
        draggable: false
      });
    }

    return markers;
  }

  // Private helper methods

  private static getFallbackSnapToRoads(points: Array<{ lat: number; lng: number }>): SnapToRoadsResponse {
    return {
      snappedPoints: points.map((p, index) => ({
        location: { latitude: p.lat, longitude: p.lng },
        originalIndex: index,
        placeId: `fallback_${index}`
      }))
    };
  }

  private static async getFallbackRoute(
    start: Location,
    end: Location,
    waypoints: Location[]
  ): Promise<MapRouteResult> {
    const distance = this.calculateDistanceBetween(start, end);
    const duration = distance * 1.5;
    
    // Add distance for waypoints
    let waypointsDistance = 0;
    let previous = start;
    for (const waypoint of waypoints) {
      waypointsDistance += this.calculateDistanceBetween(previous, waypoint);
      previous = waypoint;
    }
    waypointsDistance += this.calculateDistanceBetween(previous, end);
    
    const totalDistance = waypointsDistance > 0 ? waypointsDistance : distance;
    const totalDuration = duration + (waypoints.length * 5);

    const fallbackRoute: RouteWithTraffic = {
      distance: totalDistance,
      duration: totalDuration,
      trafficDuration: totalDuration * 1.2,
      polyline: '',
      legs: [{
        distance: { 
          text: `${totalDistance.toFixed(1)} km`, 
          value: totalDistance * 1000 
        },
        duration: { 
          text: `${Math.round(totalDuration)} min`, 
          value: totalDuration * 60 
        },
        duration_in_traffic: { 
          text: `${Math.round(totalDuration * 1.2)} min`, 
          value: totalDuration * 1.2 * 60 
        },
        steps: []
      }],
      trafficInfo: {
        hasTraffic: false,
        trafficLevel: 'moderate',
        trafficDelay: 1.2,
      }
    };

    return {
      success: true,
      data: fallbackRoute,
      metadata: {
        engine: 'fallback',
        processingTime: 0,
        cached: false,
        trafficAvailable: false
      }
    };
  }

  private static calculateDistanceBetween(start: Location, end: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(end.lat - start.lat);
    const dLon = this.toRad(end.lng - start.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(start.lat)) * Math.cos(this.toRad(end.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static decodeGeometry(coordinates: number[][]): Array<{ lat: number; lng: number }> {
    return coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));
  }

  private static calculateBounds(coordinates: number[][]): { 
    northeast: { lat: number; lng: number }; 
    southwest: { lat: number; lng: number } 
  } {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coordinates.forEach(coord => {
      const lat = coord[1];
      const lng = coord[0];
      
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    return {
      northeast: { lat: maxLat, lng: maxLng },
      southwest: { lat: minLat, lng: minLng }
    };
  }

  private static samplePoints(points: Array<{ lat: number; lng: number }>, maxPoints: number): Array<{ lat: number; lng: number }> {
    if (points.length <= maxPoints) return points;
    
    const sampled: Array<{ lat: number; lng: number }> = [];
    const step = points.length / maxPoints;
    
    for (let i = 0; i < maxPoints; i++) {
      const index = Math.floor(i * step);
      sampled.push(points[index]);
    }
    
    return sampled;
  }

  private static estimateTrafficInfo(route: OpenRouteServiceRoute, departureTime?: string): TrafficInfo {
    const now = departureTime ? new Date(departureTime) : new Date();
    const hour = now.getHours();
    
    // Traffic patterns based on time of day
    let trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
    let trafficDelay = 1.0;
    
    if (hour >= 7 && hour <= 9) {
      // Morning rush hour
      trafficLevel = 'high';
      trafficDelay = 1.5;
    } else if (hour >= 16 && hour <= 18) {
      // Evening rush hour
      trafficLevel = 'severe';
      trafficDelay = 1.8;
    } else if (hour >= 12 && hour <= 14) {
      // Lunch time
      trafficLevel = 'moderate';
      trafficDelay = 1.2;
    } else {
      // Off-peak
      trafficLevel = 'low';
      trafficDelay = 1.0;
    }

    // Generate sample traffic segments
    const segments = route.features[0].geometry.coordinates.slice(0, 5).map((coord, index) => ({
      start: { lat: coord[1], lng: coord[0] },
      end: { 
        lat: route.features[0].geometry.coordinates[index + 1]?.[1] || coord[1], 
        lng: route.features[0].geometry.coordinates[index + 1]?.[0] || coord[0] 
      },
      speed: 30 + Math.random() * 40,
      congestion: trafficLevel,
      delay: Math.random() * 5 * trafficDelay
    }));

    return {
      hasTraffic: true,
      trafficLevel,
      trafficDelay,
      trafficSegments: segments
    };
  }

  private static getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private static saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.cache.size > 100) {
      const keys = Array.from(this.cache.keys());
      for (let i = 0; i < 20; i++) {
        this.cache.delete(keys[i]);
      }
    }
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number } {
    return {
      size: this.cache.size
    };
  }
}