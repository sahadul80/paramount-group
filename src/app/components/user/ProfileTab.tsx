import React, { useState, useRef, useEffect } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { User } from '@/types/users';
import { 
  FiEdit, FiUser, FiMail, FiPhone, FiMapPin, FiPhoneCall, 
  FiBriefcase, FiDollarSign, FiCalendar, FiGlobe, FiSave,
  FiTrash2, FiCircle, FiWifi, FiWifiOff, FiAlertCircle, FiX,
  FiDroplet,
  FiXSquare
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { useRouter } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

interface ProfileTabProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
}

// Fixed Bangladesh country code
const BANGLADESH_CODE = '+880';

const bloodGroups = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  currentUser, 
  setCurrentUser, 
  handleProfileUpdate 
}) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize phone data
  useEffect(() => {
    if (currentUser.phone) {
      // Always use Bangladesh code
      if (currentUser.phone.startsWith(BANGLADESH_CODE)) {
        setPhoneNumber(currentUser.phone.slice(BANGLADESH_CODE.length));
      } else {
        // If phone doesn't start with +880, use the full number
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

  // Helper function to get avatar URL
  const getAvatarUrl = (url: string | undefined) => {
    if (!url) return '';
    return url.includes("googleapis.com/drive/v3/files/")
      ? `/api/image-proxy?url=${url}`
      : url;
  };

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-destructive/10 text-destructive';
      case 1: return 'bg-warning/10 text-warning';
      case 2: return 'bg-success/10 text-success';
      case 3: return 'bg-secondary/10 text-secondary';
      case 4: return 'bg-muted text-muted-foreground';
      case 5: return 'bg-primary/10 text-primary';
      default: return 'bg-secondary/10 text-secondary';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 5: return <FiWifi className="w-4 h-4" />;
      case 3: return <FiWifiOff className="w-4 h-4" />;
      case 4: return <FiWifiOff className="w-4 h-4" />;
      default: return <FiCircle className="w-4 h-4" />;
    }
  };

  const handleChange = (field: keyof User, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhoneNumber(value);
      
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
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
    }
  };

  const handleEditClick = () => {
    setProfileData({ ...currentUser });
    // Set initial preview to current avatar
    setAvatarPreview(getAvatarUrl(currentUser.avatar));
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
      return data.avatarUrl; // Return new avatar URL
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
      
      setCurrentUser(prev => prev ? { ...prev, status } : null);
      
      toast.success(`Status Updated to ${getStatusString(status)}`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Could not update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <>
      {/* Full Screen Loader */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-background p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mb-4"></div>
            <h2 className="text-xl font-bold text-foreground">Saving Changes</h2>
            <p className="text-muted-foreground mt-2">Please wait while we update your profile</p>
          </div>
        </div>
      )}

      <Card className="w-full overflow-hidden shadow-lg border-0">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
          <div className="flex justify-between items-start">
            <CardHeader className="p-0">
              <CardTitle className='text-xl md:text-2xl'>My Profile</CardTitle>
            </CardHeader>
            {!editMode ? (
              <Button 
                variant="outline"
                onClick={handleEditClick}
              >
                <FiEdit/><span>Edit</span>
              </Button>
            ) : (
              <div className="flex gap-2">
              <Button 
                variant="outline"
                form="profile-form"
                disabled={isUploading}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <FiSave/><span>Save</span>
                  </>
                )}
              </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                >
                  <FiX/>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-2">
          <AnimatePresence mode="wait">
            {!editMode ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* User Info with Avatar */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
                      <AvatarImage 
                        src={getAvatarUrl(currentUser.avatar)}
                        alt={currentUser.username} 
                        className="object-cover"
                      />
                      <AvatarFallback className="text-3xl bg-muted">
                        {currentUser.firstName?.charAt(0) || currentUser.username.charAt(0)}
                        {currentUser.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-foreground">{currentUser.username}</h2>
                    <p className="text-muted-foreground">{currentUser.email}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge variant="default" className="bg-primary">
                        {currentUser.role}
                      </Badge>
                      {currentUser.department && (
                        <Badge variant="outline" className="bg-foreground border-primary text-secondary">
                          {currentUser.department}
                        </Badge>
                      )}
                      {currentUser.position && (
                        <Badge variant="outline" className="border-primary text-primary">
                          {currentUser.position}
                        </Badge>
                      )}
                    </div>
                    {/* Status Selector */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant={currentUser.status === 5 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateUserStatus(5)}
                          disabled={statusUpdating}
                          className={`flex items-center gap-2 ${currentUser.status === 5 ? "bg-success" : ""}`}
                        >
                          <FiWifi className="w-4 h-4" />
                          Online
                        </Button>
                        <Button 
                          variant={currentUser.status === 3 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateUserStatus(3)}
                          disabled={statusUpdating}
                          className={`flex items-center gap-2 ${currentUser.status === 3 ? "bg-warning" : ""}`}
                        >
                          <FiWifiOff className="w-4 h-4" />
                          Away
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiUser /> Personal Information
                    </h3>
                    <div className="space-y-4">
                      <InfoField label="First Name" value={currentUser.firstName || '-'} />
                      <InfoField label="Last Name" value={currentUser.lastName || '-'} />
                      <InfoField label="Date of Birth" value={currentUser.dob || '-'} />
                      <InfoField label="Gender" value={currentUser.gender || '-'} />
                      <InfoField label="Blood Group" value={currentUser.bloodGroup || '-'} />
                      <InfoField label="Nationality" value={currentUser.nationality || '-'} />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiMail /> Contact Information
                    </h3>
                    <div className="space-y-4">
                      <InfoField label="Email" value={currentUser.email} />
                      <InfoField label="Phone" value={currentUser.phone || '-'} />
                      <InfoField label="Address" value={currentUser.address || '-'} />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiBriefcase /> Employment Details
                    </h3>
                    <div className="space-y-4">
                      <InfoField label="Employee ID" value={currentUser.employeeId || '-'} />
                      <InfoField label="Position" value={currentUser.position || '-'} />
                      <InfoField label="Department" value={currentUser.department || '-'} />
                      <InfoField label="Salary" value={currentUser.salary || '-'} />
                      <InfoField 
                        label="Joined Date" 
                        value={currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '-'} 
                      />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiDollarSign /> Account Information
                    </h3>
                    <div className="space-y-4">
                      <InfoField label="Username" value={currentUser.username} />
                      <InfoField label="Status" value={getStatusString(currentUser.status)} />
                      <InfoField label="Role" value={currentUser.role} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                id="profile-form"
                className="space-y-8"
              >
                {/* Avatar Update Section */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <Avatar 
                      className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AvatarImage 
                        src={avatarPreview || getAvatarUrl(currentUser.avatar)} 
                        alt={profileData.username} 
                        className="object-cover"
                      />
                      <AvatarFallback className="text-3xl bg-muted">
                        {profileData.firstName?.charAt(0) || profileData.username.charAt(0)}
                        {profileData.lastName?.charAt(0)}
                      </AvatarFallback>
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <div className="bg-background p-2 rounded-full">
                          <FiEdit className="text-foreground text-xl" />
                        </div>
                      </div>
                    </Avatar>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    Click the avatar to change your profile photo
                  </p>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiUser /> Personal Information
                    </h3>
                    <div className="space-y-4">
                      <FormField 
                        label="First Name"
                        icon={<FiUser className="text-muted-foreground" />}
                        value={profileData.firstName || ''}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        disabled={isUploading}
                        error={errors.firstName}
                        required
                      />
                      <FormField 
                        label="Last Name"
                        icon={<FiUser className="text-muted-foreground" />}
                        value={profileData.lastName || ''}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        disabled={isUploading}
                        error={errors.lastName}
                        required
                      />
                      <FormField 
                        label="Date of Birth"
                        icon={<FiCalendar className="text-muted-foreground" />}
                        type="date"
                        value={profileData.dob || ''}
                        onChange={(e) => handleChange('dob', e.target.value)}
                        disabled={isUploading}
                        error={errors.dob}
                        tip="Format: YYYY-MM-DD"
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                          <FiDroplet className="text-muted-foreground" /> Blood Group
                        </label>
                        <Select
                          value={profileData.bloodGroup || ''}
                          onValueChange={(value) => handleChange('bloodGroup', value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger className="bg-input border-border focus:border-primary focus:ring-primary">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map(group => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormField 
                        label="Gender"
                        icon={<FiUser className="text-muted-foreground" />}
                        value={profileData.gender || ''}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        disabled={isUploading}
                      />
                      <FormField 
                        label="Nationality"
                        icon={<FiGlobe className="text-muted-foreground" />}
                        value={profileData.nationality || ''}
                        onChange={(e) => handleChange('nationality', e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiMail /> Contact Information
                    </h3>
                    <div className="space-y-4">
                      <FormField 
                        label="Email"
                        icon={<FiMail className="text-muted-foreground" />}
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        disabled={isUploading}
                        error={errors.email}
                        required
                        tip="Must be a valid email address"
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                          <FiPhone className="text-muted-foreground" /> Phone Number
                        </label>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-input border border-r-0 rounded-l-md text-foreground">
                            {BANGLADESH_CODE}
                          </div>
                          <Input
                            value={phoneNumber}
                            onChange={handlePhoneNumberChange}
                            placeholder="1234567890"
                            disabled={isUploading}
                            className={cn(
                              "bg-input border-l-0 rounded-l-none",
                              errors.phone && "border-destructive"
                            )}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <FiAlertCircle className="w-4 h-4" /> {errors.phone}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          Format: {BANGLADESH_CODE} followed by 10 digits
                        </p>
                      </div>
                      <FormField 
                        label="Address"
                        icon={<FiMapPin className="text-muted-foreground" />}
                        value={profileData.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiBriefcase /> Employment Details
                    </h3>
                    <div className="space-y-4">
                      <FormField 
                        label="Employee ID"
                        icon={<FiBriefcase className="text-muted-foreground" />}
                        value={profileData.employeeId || ''}
                        onChange={(e) => handleChange('employeeId', e.target.value)}
                        disabled={true}
                        tip="Contact admin to change"
                      />
                      <FormField 
                        label="Position"
                        icon={<FiBriefcase className="text-muted-foreground" />}
                        value={profileData.position || ''}
                        onChange={(e) => handleChange('position', e.target.value)}
                        disabled={true}
                        tip="Contact admin to change"
                      />
                      <FormField 
                        label="Department"
                        icon={<FiBriefcase className="text-muted-foreground" />}
                        value={profileData.department || ''}
                        onChange={(e) => handleChange('department', e.target.value)}
                        disabled={true}
                        tip="Contact admin to change"
                      />
                      <FormField 
                        label="Salary"
                        icon={<FiDollarSign className="text-muted-foreground" />}
                        value={profileData.salary || ''}
                        onChange={(e) => handleChange('salary', e.target.value)}
                        disabled={true}
                        tip="Contact admin to change"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-card p-5 rounded-xl">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                      <FiDollarSign /> Account Information
                    </h3>
                    <div className="space-y-4">
                      <FormField 
                        label="Username"
                        icon={<FiUser className="text-muted-foreground" />}
                        value={profileData.username}
                        disabled={true}
                      />
                      <FormField 
                        label="Role"
                        icon={<FiBriefcase className="text-muted-foreground" />}
                        value={profileData.role}
                        disabled={true}
                      />
                      <FormField 
                        label="Status"
                        icon={<FiUser className="text-muted-foreground" />}
                        value={getStatusString(profileData.status)}
                        disabled={true}
                      />
                      
                      {/* Delete Account Button */}
                      <div className="pt-4 mt-6 border-t border-border">
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => setShowDeleteModal(true)}
                          disabled={isDeleting}
                          type="button"
                        >
                          <FiTrash2 className="mr-2" /> Delete My Account
                        </Button>
                        <p className="mt-2 text-xs text-destructive text-center">
                          Warning: This action is irreversible and will permanently delete your account
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-background rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
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
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground mr-2"></div>
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

// Info Field Component
const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
    <div className="w-40 text-sm font-medium text-muted-foreground">{label}</div>
    <div className="flex-1 text-foreground font-medium">{value}</div>
  </div>
);

// Form Field Component
const FormField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  error?: string;
  tip?: string;
  required?: boolean;
}> = ({ label, icon, value, onChange, disabled = false, type = 'text', error, tip, required }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-foreground flex items-center gap-2">
      {icon} {label} {required && <span className="text-destructive">*</span>}
    </label>
    <Input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "bg-input border-border focus:border-primary focus:ring-primary",
        disabled && "bg-muted",
        error && "border-destructive"
      )}
    />
    {error && (
      <p className="text-destructive text-sm flex items-center gap-1">
        <FiAlertCircle className="w-4 h-4" /> {error}
      </p>
    )}
    {tip && !error && (
      <p className="text-muted-foreground text-xs">{tip}</p>
    )}
  </div>
);

export default ProfileTab;