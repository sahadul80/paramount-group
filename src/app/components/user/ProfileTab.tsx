import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { User, Task, AttendanceRecord, MealRecord } from '@/types/users';
import { 
  FiEdit, FiSave, FiX, FiTrash2, FiClock, FiCheckCircle, 
  FiActivity, FiTrendingUp, FiCalendar, FiCoffee, FiDollarSign,
  FiPlus, FiFilter, FiSearch, FiBarChart2, FiUserCheck, FiPieChart,
  FiUser, FiBell,
  FiLoader
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import ViewMode from './ViewMode';
import EditMode from './EditMode';
import TaskManagement from './TaskManagement';
import AttendanceTracker from './AttendanceTracker';
import MealTracker from './MealTracker';
import SalaryAdjustment from './SalaryAdjustment';
import { PerformanceMetrics } from './PerformanceMetrics';
import AttendanceViewer from './AttendanceViewer';

interface ProfileTabProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User|null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
}

// Fixed Bangladesh country code
const BANGLADESH_CODE = '+880';

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  currentUser, 
  setCurrentUser, 
  handleProfileUpdate 
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'tasks' | 'attendance' | 'meals' | 'salary' | 'performance'>('profile');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<User>({ ...currentUser });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [unreadTaskIds, setUnreadTaskIds] = useState<Set<string>>(new Set());
  const [taskNotificationCount, setTaskNotificationCount] = useState(0);
  const router = useRouter();
  const prevTasksRef = useRef<Task[]>([]);

  // Initialize phone data
  useEffect(() => {
    if (currentUser.phone) {
      if (currentUser.phone.startsWith(BANGLADESH_CODE)) {
        setPhoneNumber(currentUser.phone.slice(BANGLADESH_CODE.length));
      } else {
        setPhoneNumber(currentUser.phone);
      }
    }
  }, [currentUser]);

  // Update profile phone when inputs change
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      phone: BANGLADESH_CODE + phoneNumber
    }));
  }, [phoneNumber]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/user/all");
        if (!res.ok) throw new Error("Failed to fetch users");
        const usersData = await res.json();
        setUsers(usersData);
      } catch (err) {
        console.error("Fetch users error:", err);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/attendance/get?username=${currentUser.username}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  }, [currentUser.username]);

  // Load attendance on mount and when currentUser changes
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Track new tasks and update notification count
  useEffect(() => {
    // Skip initial render
    if (prevTasksRef.current.length === 0) {
      prevTasksRef.current = tasks;
      return;
    }

    const newTasks = tasks.filter(task => 
      !prevTasksRef.current.some(prevTask => prevTask.id === task.id)
    );

    if (newTasks.length > 0) {
      // Add new tasks to unread set
      const newUnreadTasks = new Set(unreadTaskIds);
      newTasks.forEach(task => newUnreadTasks.add(task.id));
      setUnreadTaskIds(newUnreadTasks);
      
      // Update notification count for tasks assigned to current user
      const assignedToMe = newTasks.filter(task => 
        task.assignedTo && task.assignedTo.includes(currentUser.username)
      );
      
      if (assignedToMe.length > 0) {
        setTaskNotificationCount(prev => prev + assignedToMe.length);
      }
    }

    prevTasksRef.current = tasks;
  }, [tasks, currentUser.username]);

  const handleEditClick = () => {
    setProfileData({ ...currentUser });
    setAvatarPreview(currentUser.avatar || null);
    setAvatarFile(null);
    setErrors({});
    setEditMode(true);
  };

  const handleCancel = () => {
    setProfileData({ ...currentUser });
    setAvatarPreview(null);
    setAvatarFile(null);
    setErrors({});
    setEditMode(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profileData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!profileData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!profileData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (profileData.dob && !/^\d{4}-\d{2}-\d{2}$/.test(profileData.dob)) {
      newErrors.dob = 'Invalid date format (YYYY-MM-DD)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneNumberChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      setPhoneNumber(numericValue);
      
      // Clear phone error if any
      if (errors.phone) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    }
  };

  const handleAvatarChange = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid File Type! Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File Too Large! Please select an image smaller than 5MB");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
  };

  const uploadAvatar = async (file: File, username: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);
  
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Avatar upload failed');
      }
  
      const data = await response.json();
      return data.avatarUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Validation Error! Please fix the errors in the form");
      return;
    }
    
    setIsUploading(true);
    
    try {
      let updatedUser = { ...profileData };
      
      // Upload new avatar if one was selected
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar(avatarFile, currentUser.username);
        updatedUser = { 
          ...updatedUser, 
          avatar: newAvatarUrl
        };
      }
  
      // Call parent's update handler with updatedUser
      const success = await handleProfileUpdate(updatedUser);
      
      if (success) {
        setCurrentUser(updatedUser);
        setEditMode(false);
        setAvatarPreview(null);
        setAvatarFile(null);
        
        toast.success("Your profile has been updated successfully");
      }
    } catch (error) {
      toast.error("Update Failed! Could not update profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: currentUser.username })
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast.warning("Account Deleted! Your account has been permanently removed and you can no longer access the system!");

      // Clear user data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Deletion Failed! Could not delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const updateUserStatus = async (status: number) => {
    setStatusUpdating(true);
    
    try {
      const response = await fetch('/api/user/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: currentUser.username, 
          status 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      setCurrentUser( { ...currentUser, status }  );
      
      toast.success(`Status Updated to ${getStatusString(status)}`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Could not update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusString = (status: number) => {
    switch (status) {
      case 0: return 'Inactive';
      case 1: return 'Pending';
      case 2: return 'Onboarded';
      case 3: return 'Away';
      case 4: return 'Offline';
      case 5: return 'Online';
      default: return 'Unknown';
    }
  };

  const handleFieldChange = (field: keyof User, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    
    // If task is marked as completed or in progress, remove from unread
    if (updates.status === 'completed' || updates.status === 'in-progress') {
      setUnreadTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
    
    toast.success("Task updated successfully");
  };

  const handleNewTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
    
    // Add new task to unread set if assigned to current user
    if (task.assignedTo && task.assignedTo.includes(currentUser.username)) {
      setUnreadTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.add(task.id);
        return newSet;
      });
      
      setTaskNotificationCount(prev => prev + 1);
    }
    
    toast.success("New task assigned");
  };

  const handleMealRecord = (type: string, calories: number) => {
    // Validate the type
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    const mealType = validTypes.includes(type as any) ? type as typeof validTypes[number] : 'lunch';
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    // Build a full MealRecord object to satisfy the MealRecord type requirements.
    // Use currentUser.username as userId fallback and generate a simple id.
    const newRecord = {
      id: `${Date.now()}`,
      userId: (currentUser && (currentUser.username || (currentUser as any).id)) || '',
      date: today,
      type: mealType,
      time: now,
      calories,
      items: []
    } as MealRecord;
    
    setMealRecords(prev => [...prev, newRecord]);
    toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} recorded`);
  };

  const handleSalaryAdjustment = (newSalary: number) => {
    setCurrentUser( { ...currentUser, salary: newSalary.toString() });
    toast.success("Salary adjusted successfully");
  };

  // Function to mark task notifications as read
  const markTaskNotificationsAsRead = () => {
    setTaskNotificationCount(0);
    setUnreadTaskIds(new Set());
  };

  // Update notification count when unread tasks change
  useEffect(() => {
    const count = Array.from(unreadTaskIds).filter(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return task && task.assignedTo && task.assignedTo.includes(currentUser.username);
    }).length;
    
    setTaskNotificationCount(count);
  }, [unreadTaskIds, tasks, currentUser.username]);

  return (
    <>
      <Card className="w-full flex flex-col bg-card min-h-0 shadow-lg border border-border">        
        {/* Navigation Tabs */}
        <div className="sticky top-0 z-10 rounded-lg bg-black/25 backdrop-blur-2xl -mt-2">
        <div className="border border-border">
          <div className="flex justify-between w-full">
            <Button
              variant={activeSection === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('profile')}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiUser className="w-4 h-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>
            
            <Button
              variant={activeSection === 'tasks' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveSection('tasks');
                markTaskNotificationsAsRead();
              }}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span className="hidden md:inline">Tasks</span>
              {taskNotificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {taskNotificationCount}
                </span>
              )}
            </Button>
            
            <Button
              variant={activeSection === 'attendance' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('attendance')}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiClock className="w-4 h-4" />
              <span className="hidden md:inline">Attendance</span>
            </Button>
            
            <Button
              variant={activeSection === 'meals' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('meals')}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiCoffee className="w-4 h-4" />
              <span className="hidden md:inline">Meals</span>
            </Button>
            
            <Button
              variant={activeSection === 'salary' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('salary')}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiDollarSign className="w-4 h-4" />
              <span className="hidden md:inline">Salary</span>
            </Button>
            
            <Button
              variant={activeSection === 'performance' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('performance')}
              className="rounded-lg flex items-center gap-1 hover:cursor-pointer"
            >
              <FiTrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Performance</span>
            </Button>
          </div>
        </div>
        </div>
        {/* Full Screen Loader */}
        {isUploading ? (
          <div className="flex justify-center items-center h-full py-[30vh]">
            <FiLoader className="animate-spin h-16 w-16"/>
          </div>
        ) : (
          <CardContent className="overflow-auto p-1 mb-12 sm:mb-0">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && !editMode && (
              <ViewMode 
                currentUser={currentUser}
                updateUserStatus={updateUserStatus}
                statusUpdating={statusUpdating}
                getStatusString={getStatusString}
                editClick={handleEditClick}
              />
            )}
            
            {activeSection === 'profile' && editMode && (
              <EditMode
                profileData={profileData}
                currentUser={currentUser}
                avatarPreview={avatarPreview}
                avatarFile={avatarFile}
                phoneNumber={phoneNumber}
                errors={errors}
                isUploading={isUploading}
                handleChange={handleFieldChange}
                handlePhoneNumberChange={handlePhoneNumberChange}
                handleAvatarChange={handleAvatarChange}
                handleSubmit={handleSubmit}
                setShowDeleteModal={setShowDeleteModal}
                BANGLADESH_CODE={BANGLADESH_CODE}
              />
            )}
            
            {activeSection === 'tasks' && (
              <TaskManagement
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onNewTask={handleNewTask}
                currentUser={currentUser}
                users={users}
                unreadTaskIds={unreadTaskIds}
                setUnreadTaskIds={setUnreadTaskIds}
              />
            )}
            
            {activeSection === 'attendance' && (
              currentUser.role === 'admin' ? (
                <div className="flex flex-col md:flex-row gap-4 p-4 overflow-auto w-auto">
                  <div className="w-1/3">
                    <AttendanceTracker
                      attendance={attendance}
                      currentUser={currentUser}
                      onAttendanceUpdate={fetchAttendance}
                    />
                  </div>
                  <div className="w-2/3">
                    <AttendanceViewer/>
                  </div>
                </div>
              ) : (
                <AttendanceTracker
                  attendance={attendance}
                  currentUser={currentUser}
                  onAttendanceUpdate={fetchAttendance}
                />
              )
            )}
            
            {activeSection === 'meals' && (
              <MealTracker
                mealRecords={mealRecords}
                onRecordMeal={handleMealRecord}
              />
            )}
            
            {activeSection === 'salary' && (
              <SalaryAdjustment
                currentSalary={typeof currentUser.salary === 'string' ? 
                              parseFloat(currentUser.salary) : 
                              (currentUser.salary || 0)}
                onSalaryAdjust={handleSalaryAdjustment}
              />
            )}
            
            {activeSection === 'performance' && (
              <PerformanceMetrics
                tasks={tasks}
                attendance={attendance}
                currentUser={currentUser}
              />
            )}
          </AnimatePresence>
        </CardContent>
        )}
        

        {/* Fixed buttons for mobile edit mode */}
        {editMode && activeSection === 'profile' && (
          <CardFooter className='-mt-6 md:mt-0'>
            <div className="flex gap-2 w-full">
              <Button 
                type="submit"
                form="profile-form"
                className="flex-1 bg-secondary text-text hover:bg-red-500"
                disabled={isUploading}
              >
                <FiSave />
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <FiLoader/>
                    <span className="ml-1">Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isUploading}
                className="w-1/3 bg-foreground border border-border text-text hover:shadow-full hover:bg-primary"
              >
                <FiX/>
                Cancel
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-card rounded-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-card-foreground">
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Are you sure you want to delete your account? This action is irreversible and will permanently remove all your data. You will be logged out immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="border-border text-text hover:shadow-full"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-text hover:shadow-full"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin"><FiLoader/></div>
                  Deleting...
                </div>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileTab;