// types/transport.ts

import { User } from "./users";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
  formattedAddress?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  accuracy?: number;
  timestamp?: Date;
}

export interface DistanceMetrics {
  day: number;
  week: number;
  month: number;
  year: number;
  total: number;
}

// Employee extends User with transport-specific properties
export interface Employee extends User {
  currentLocation?: Location;
  assignedCars?: Car[];
  totalDistance?: DistanceMetrics;
  journeys?: Journey[];
  assignedDrivers?: Driver[];
  onLeave?: boolean;
  totalLeave?: number;
  remainingLeave?: number;
  leaveBalance?: {
    annual: number;
    sick: number;
    casual: number;
  };
  transportPreferences?: {
    preferredCarType?: string;
    preferredDriver?: string;
    specialRequirements?: string;
    notificationSettings?: {
      journeyUpdates: boolean;
      promotions: boolean;
      emergencyAlerts: boolean;
    };
  };
}

// Driver extends User with driver-specific properties
export interface Driver extends User {
  designation: "driver";
  licenseNo: string;
  licenseExpiry: string;
  licenseClass: string;
  onLeave?: boolean;
  currentLocation?: Location;
  totalTravelledDistance?: DistanceMetrics;
  assignedCars?: Car[];
  availabilityStatus?: 'available' | 'busy' | 'on-break' | 'off-duty';
  rating?: number;
  totalTrips?: number;
  experience?: number; // in years
  languages?: string[];
  certifications?: string[];
  emergencyContact?: string;
  shift?: {
    start: string;
    end: string;
    days: string[];
  };
}

export interface Journey {
  id: string;
  userId: string;
  userName?: string;
  driverId?: string;
  driverName?: string;
  carId?: string;
  carDetails?: {
    model: string;
    regNo: string;
    color?: string;
    make?: string;
    seatingCapacity?: number;
  };
  startLocation: Location;
  endLocation: Location;
  startTime: string;
  endTime?: string;
  distance: number;
  estimatedDuration: number;
  status: 'requested' | 'in-progress' | 'completed' | 'cancelled' | 'driver-assigned';
  rating?: number;
  notes?: string;
  waypoints?: Location[];
  actualDuration?: number;
  fare?: number;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  priority?: 'normal' | 'urgent' | 'vip';
  specialRequirements?: string;
  createdAt: string;
  updatedAt?: string;
  routePolyline?: string;
  trafficConditions?: {
    level: 'clear' | 'moderate' | 'heavy' | 'severe';
    delay: number; // in minutes
  };
  realtimeLocation?: Location;
  estimatedArrival?: string;
  driverContact?: string;
}

export interface Car {
  id: string;
  model: string;
  make: string;
  regNo: string;
  color?: string;
  status: 'available' | 'in-use' | 'maintenance' | 'cleaning';
  isClean: boolean;
  needsServicing: boolean;
  currentLocation: Location;
  totalDistanceTravelled: DistanceMetrics;
  driverId?: string;
  fuelLevel?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  seatingCapacity?: number;
  features?: string[];
  year?: number;
  transmission?: 'manual' | 'automatic';
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  insurance?: {
    provider: string;
    policyNo: string;
    expiry: string;
  };
  maintenanceHistory?: MaintenanceRecord[];
  imageUrl?: string;
}

export interface RouteChange {
  id: string;
  journeyId: string;
  type: 'waypoint_added' | 'waypoint_removed' | 'destination_changed' | 'route_optimized';
  timestamp: string;
  location?: Location;
  reason?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Leave Request types
export interface LeaveRequest {
  id: string;
  driverId: string;
  driverName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid';
  emergencyContact?: string;
  attachments?: string[];
}

// System Stats types
export interface SystemStats {
  totalUsers: number;
  totalDrivers: number;
  totalCars: number;
  activeJourneys: number;
  pendingRequests: number;
  availableCars: number;
  driversOnLeave: number;
  monthlyDistance: number;
  totalRevenue?: number;
  averageRating?: number;
  utilization?: {
    cars: number;
    drivers: number;
  };
  monthlyGrowth?: {
    users: number;
    journeys: number;
    revenue: number;
  };
}

// Main data structure
export interface FleetData {
  users: User[];
  drivers: Driver[];
  cars: Car[];
  locations: Location[];
  journeys: Journey[];
  leaveRequests: LeaveRequest[];
  systemStats: SystemStats;
  notifications: Notification[];
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
  timestamp: string;
}

// Dashboard stats types
export interface DashboardStats {
  totalJourneys: number;
  completedJourneys: number;
  activeJourneys: number;
  totalDistance: number;
  availableCars: number;
  driversAvailable: number;
  pendingApprovals: number;
  revenue?: number;
  averageRating?: number;
  monthlyComparison?: {
    journeys: number;
    distance: number;
    revenue: number;
  };
}

// Form types
export interface JourneyRequest {
  userId: string;
  startLocation: Location;
  endLocation: Location;
  waypoints?: Location[];
  preferredTime?: string;
  specialRequirements?: string;
  priority?: 'normal' | 'urgent' | 'vip';
  notes?: string;
  estimatedDuration?: number;
  distance?: number;
}

export interface LeaveApplication {
  driverId: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid';
  emergencyContact?: string;
  attachments?: string[];
}

// Filter types
export interface UserFilters {
  department?: string;
  role?: string;
  isActive?: boolean;
  onLeave?: boolean;
  search?: string;
}

export interface CarFilters {
  status?: string;
  needsServicing?: boolean;
  isClean?: boolean;
  fuelLevel?: 'low' | 'medium' | 'high';
  model?: string;
  make?: string;
}

export interface JourneyFilters {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  driverId?: string;
  userId?: string;
  minDistance?: number;
  maxDistance?: number;
  priority?: string;
}

// Search types
export interface SearchCriteria {
  query: string;
  type: 'users' | 'drivers' | 'cars' | 'journeys' | 'locations';
  filters?: any;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'journey_update' | 'system' | 'driver_assigned' | 'journey_completed' | 'emergency' | 'message' | 'route_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
  driverId?: string;
  journeyId?: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  icon?: string;
}

// Map related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Route {
  points: Location[];
  distance: number;
  duration: number;
  polyline: string;
  trafficDuration?: number;
  steps?: RouteStep[];
  bounds: MapBounds;
  summary?: {
    totalDistance: number;
    totalDuration: number;
    tolls?: number;
    fuelCost?: number;
  };
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: Location;
  endLocation: Location;
  maneuver?: string;
  road?: string;
}

// Report types
export interface DistanceReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalDistance: number;
  byUser: { userId: string; userName: string; distance: number; trips: number }[];
  byDriver: { driverId: string; driverName: string; distance: number; trips: number }[];
  byCar: { carId: string; carModel: string; distance: number; trips: number }[];
  averageDistance: number;
  maxDistance: number;
  minDistance: number;
  trends?: {
    previousPeriod: number;
    growth: number;
  };
}

export interface UtilizationReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  carUtilization: { carId: string; carModel: string; utilization: number; totalHours: number; trips: number }[];
  driverUtilization: { driverId: string; driverName: string; utilization: number; totalHours: number; trips: number }[];
  averageUtilization: number;
  peakHours?: string[];
  lowHours?: string[];
}

// Booking and Journey Management
export interface BookingState {
  isBookingAllowed: boolean;
  lastBookingTime: Date | null;
  cooldownRemaining: number;
  hasActiveRequest: boolean;
  activeJourneyId?: string;
  maxRequestsPerDay?: number;
  requestsToday?: number;
}

export interface BookingRequest {
  id?: string;
  userId: string;
  destination: string;
  status: 'requested' | 'approved' | 'rejected' | 'cancelled';
  timestamp: Date;
  journeyId?: string;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'vip';
}

export interface ProfileData {
  name: string;
  email: string;
  designation: string;
  department: string;
  phone: string;
  location: Location;
  emergencyContact?: string;
  bloodGroup?: string;
  avatar?: string;
  preferences?: User['preferences'];
}

export interface RouteChangeRequest {
  id: string;
  journeyId: string;
  newWaypoint?: Location;
  newDestination?: Location;
  reason: string;
  type: 'add_stop' | 'change_destination' | 'emergency_stop' | 'route_optimization';
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface DropoffRequest {
  id: string;
  journeyId: string;
  location: Location;
  reason: string;
  emergencyContact?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  driverId?: string;
}

export interface ApiDataResponse {
  users?: User[];
  drivers?: Driver[];
  cars?: Car[];
  journeys?: Journey[];
  locations?: Location[];
  leaveRequests?: LeaveRequest[];
  systemStats?: SystemStats;
  notifications?: Notification[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface DriverDetails {
  id: string;
  name: string;
  age: number;
  contactNumber: string;
  licenseNumber: string;
  rating: number;
  experience: string;
  totalTrips: number;
  carDetails: {
    model: string;
    regNo: string;
    color: string;
    seatingCapacity: number;
    make?: string;
    year?: number;
  };
  availability: 'available' | 'busy' | 'offline' | 'on-break';
  languages?: string[];
  certifications?: string[];
  currentLocation?: Location;
  shift?: {
    start: string;
    end: string;
  };
}

export interface ActiveJourneyInfo {
  journey: Journey;
  driver: DriverDetails;
  estimatedArrival: string;
  car: Car;
  progress: number;
  currentLocation?: Location;
  nextWaypoint?: Location;
  trafficConditions?: {
    level: 'clear' | 'moderate' | 'heavy' | 'severe';
    delay: number;
    description?: string;
  };
  remainingDistance: number;
  remainingTime: number;
  speed?: number;
  heading?: number;
  lastUpdated: string;
}

export interface BookingStep {
  step: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
  status?: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface SafetyTip {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'driver' | 'vehicle' | 'emergency' | 'general';
  priority: 'low' | 'medium' | 'high';
}

export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  url?: string;
  category: string;
}

// Payment and Billing
export interface Payment {
  id: string;
  journeyId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: 'cash' | 'card' | 'wallet' | 'corporate';
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  receiptUrl?: string;
  notes?: string;
}

// Maintenance
export interface MaintenanceRecord {
  id: string;
  carId: string;
  type: 'routine' | 'repair' | 'accident' | 'inspection';
  description: string;
  cost?: number;
  date: string;
  nextDueDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  performedBy?: string;
  notes?: string;
  odometer?: number;
  parts?: {
    name: string;
    cost: number;
    warranty?: string;
  }[];
  invoiceUrl?: string;
}

// Real-time Tracking
export interface TrackingData {
  journeyId: string;
  location: Location;
  speed?: number;
  heading?: number;
  timestamp: Date;
  accuracy?: number;
  batteryLevel?: number;
  signalStrength?: number;
  odometer?: number;
  fuelLevel?: number;
}

// Emergency
export interface EmergencyAlert {
  id: string;
  journeyId: string;
  userId: string;
  driverId: string;
  type: 'accident' | 'medical' | 'security' | 'breakdown' | 'sos';
  location: Location;
  timestamp: Date;
  status: 'active' | 'resolved' | 'cancelled';
  respondedBy?: string;
  responseTime?: number;
  notes?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
}

// Feedback and Rating
export interface Feedback {
  id: string;
  journeyId: string;
  userId: string;
  driverId: string;
  rating: number;
  comments?: string;
  categories?: {
    punctuality: number;
    driving: number;
    vehicleCondition: number;
    service: number;
    safety: number;
  };
  submittedAt: Date;
  repliedAt?: Date;
  reply?: string;
  anonymous?: boolean;
}

// Analytics
export interface AnalyticsData {
  totalRevenue: number;
  totalJourneys: number;
  totalDistance: number;
  averageRating: number;
  userGrowth: number;
  peakHours: string[];
  popularDestinations: Array<{
    location: string;
    count: number;
    percentage: number;
    averageDistance: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    journeys: number;
    revenue: number;
    distance: number;
  }>;
  driverPerformance: Array<{
    driverId: string;
    driverName: string;
    rating: number;
    trips: number;
    distance: number;
  }>;
}

// Settings
export interface UserSettings {
  notifications: {
    journeyUpdates: boolean;
    promotions: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  privacy: {
    shareLocation: boolean;
    showProfile: boolean;
    shareContact: boolean;
    trackingEnabled: boolean;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    defaultView: 'dashboard' | 'map' | 'journeys';
    preferredCarType?: string;
    preferredDriver?: string;
    autoBook?: boolean;
  };
}

// Chat and Communication
export interface ChatMessage {
  id: string;
  journeyId: string;
  senderId: string;
  senderType: 'user' | 'driver' | 'admin' | 'system';
  message: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  attachments?: string[];
  type?: 'text' | 'image' | 'location' | 'system';
}

export interface ChatSession {
  id: string;
  journeyId: string;
  userId: string;
  driverId: string;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Map Service Types
export interface MapRouteResponse {
  distance: number;
  duration: number;
  polyline: string;
  bounds: MapBounds;
  steps: RouteStep[];
  trafficInfo?: {
    hasTraffic: boolean;
    trafficDuration: number;
    trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
    congestionPoints?: Location[];
  };
  tolls?: number;
  fuelEfficiency?: number;
}

export interface GeocodeResponse {
  address: string;
  location: Location;
  placeId: string;
  components: Record<string, string>;
  formattedAddress: string;
  types: string[];
}

export interface AutocompletePrediction {
  description: string;
  placeId: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
  types: string[];
  distance?: number;
}

// WebSocket Events
export type WebSocketEventType = 
  | 'location_update'
  | 'journey_assigned'
  | 'journey_completed'
  | 'driver_assigned'
  | 'emergency_alert'
  | 'message'
  | 'notification'
  | 'journey_status_update'
  | 'route_update'
  | 'driver_status_change';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: Date;
  userId?: string;
  driverId?: string;
  journeyId?: string;
  metadata?: Record<string, any>;
}

// Service Request Types
export interface ServiceRequest {
  id: string;
  type: 'car_wash' | 'maintenance' | 'fuel' | 'cleaning' | 'repair';
  carId: string;
  requestedBy: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  priority: 'low' | 'medium' | 'high';
  scheduledDate?: string;
  completedDate?: string;
  cost?: number;
  notes?: string;
  attachments?: string[];
}

// Dashboard Widgets
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stats' | 'chart' | 'list' | 'map';
  data: any;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  refreshInterval?: number;
  settings?: Record<string, any>;
}

// Audit Log
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Configuration
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  editable: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

// Batch Operations
export interface BatchOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  details?: Record<string, any>;
  errors?: string[];
}

// For WebSocket Hook
export interface WebSocketConfig {
  onMessage: (event: WebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface WebSocketHook {
  sendMessage: (event: WebSocketEvent) => void;
  isConnected: boolean;
  lastMessage: WebSocketEvent | null;
  reconnect: () => void;
  disconnect: () => void;
}