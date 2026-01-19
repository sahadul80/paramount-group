import { Location } from "./transport";

export interface User {
  id?: string;
  username: string;
  email: string;
  role: string;
  status: number;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  dob?: string;
  address?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other' | undefined;
  department?: string;
  position?: string;
  employeeId?: string;
  nationality?: string;
  salary?: string;
  password?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  joiningDate?: string;
  lastLogin?: string;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
  };
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
  conversationId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  isPrivate: boolean;
  lastMessage?: Message;
}

// SSE Event Types
export type EventType = "user" | "message" | "group" | "initial" | "heartbeat";

export interface UserEventData {
  action: "created" | "updated" | "deleted";
  user?: User;
  username?: string;
}

export interface MessageEventData {
  action: "created" | "updated" | "deleted";
  message?: Message;
  messageId?: string;
}

export interface GroupEventData {
  action: "created" | "updated" | "deleted";
  group?: Group;
  groupId?: string;
}

export interface InitialData {
  users: User[];
  messages: Message[];
  groups: Group[];
}

export interface HeartbeatData {
  timestamp: string;
}

export interface SSEEvent {
  type: EventType;
  data: UserEventData | MessageEventData | GroupEventData | InitialData | HeartbeatData;
}

// Tab Types
export type TabValue = "profile" | "users" | "inbox" | "groups";

// Tab State
export interface TabState {
  loaded: boolean;
  loading: boolean;
}


export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // User's username
  assignedBy: string; // Manager's username
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string; // ISO string
  startTime?: string; // ISO string, when the task was started
  completedAt?: string; // ISO string, when the task was completed
  createdAt: string; // ISO string
  timeSpent?: number;
  estimatedTime?: number;
  category?: string;
  tags?: string[];
  attachments?: string[];
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface AttendanceRecord {
  id: string;
  userName: string;
  date: string; // ISO string (YYYY-MM-DD)
  checkIn?: string; // Time string (HH:MM)
  checkOut?: string; // Time string (HH:MM)
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'leave';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  checkInLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  checkOutLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  totalHours?: number;
  overtimeHours?: number;
  notes?: string;
  approvedBy?: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  date: string; // ISO string (YYYY-MM-DD)
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string; // Time string (HH:MM)
  calories: number;
  items: string[];
  cost?: number;
  location?: string;
  notes?: string;
}

export interface LeaveApplication {
  id: string;
  userId: string;
  type: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  totalDays: number;
  attachments?: string[];
  emergencyContact?: string;
}

export interface PerformanceReview {
  id: string;
  userId: string;
  reviewedBy: string;
  period: string; // e.g., "Q1 2024"
  rating: number; // 1-5
  strengths: string[];
  areasForImprovement: string[];
  comments: string;
  goals: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  submittedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  type: 'contract' | 'certificate' | 'id' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'pending';
  tags?: string[];
}
