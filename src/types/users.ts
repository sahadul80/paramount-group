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

export type TabValue = 'profile' | 'users' | 'inbox' | 'groups';