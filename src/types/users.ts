// types/users.ts
export interface User {
  username: string;
  email: string;
  role: string;
  status: number;
  createdAt: string;
  avatar?: string;
  dob?: string;
  address?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  nationality?: string;
  salary?: string;
  password?: any;
  bloodGroup?: string;
}

export interface Message {
  id: number;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Group {
  id: number;
  name: string;
  members: string[];
  createdBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // User's username
  assignedBy: string; // Manager's username
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // ISO string
  startTime?: string; // ISO string, when the task was started
  completedAt?: string; // ISO string, when the task was completed
  createdAt: string; // ISO string
  timeSpent?: number;
}

export interface AttendanceRecord {
  date: string; // ISO string (YYYY-MM-DD)
  checkIn?: string; // Time string (HH:MM)
  checkOut?: string; // Time string (HH:MM)
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  code: string;
}

export interface MealRecord {
  date: string; // ISO string (YYYY-MM-DD)
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string; // Time string (HH:MM)
  calories: number;
}

export type TabValue = 'profile' | 'users' | 'inbox' | 'groups';