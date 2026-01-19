import { useState, useCallback, useEffect } from 'react';
import { Employee, Journey, Car, Driver, DistanceMetrics } from '@/types/transport';
import { User } from '@/types/users';
import toast from 'react-hot-toast';

interface UseEmployeeReturn {
  user?: Employee | null;
  isLoading?: boolean;
  error?: string | null;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Employee>) => Promise<boolean>;
}

export const useEmployee = (): UseEmployeeReturn => {
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeData = useCallback(async (): Promise<Employee | null> => {
    try {
      const username = localStorage.getItem("user");
      if (!username) {
        setError("No user found. Please login.");
        return null;
      }

      const res = await fetch("/api/user/all");
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      const users = data.data || data;
      
      const employee = users.find((u: User) => u.username === username) as Employee;
      
      if (!employee) {
        setError("Employee not found");
        return null;
      }

      // Store complete employee data
      localStorage.setItem("currentUser", JSON.stringify(employee));
      return employee;
    } catch (err) {
      console.error("Error fetching employee:", err);
      setError("Failed to load employee data");
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    const employee = await fetchEmployeeData();
    if (employee) {
      setUser(employee);
      setError(null);
    }
    setIsLoading(false);
  }, [fetchEmployeeData]);

  const updateProfile = useCallback(async (data: Partial<Employee>): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, ...data }),
      });

      if (!response.ok) throw new Error("Update failed");
      
      await refreshUser();
      toast.success("Profile updated successfully!");
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
      return false;
    }
  }, [user, refreshUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return {
    user,
    isLoading,
    error,
    refreshUser,
    updateProfile
  };
};