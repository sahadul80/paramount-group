// components/user/ProfileTab.tsx (main component)
'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { User } from '@/types/users';
import { FiEdit, FiSave, FiX, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import ViewMode from './ViewMode';
import EditMode from './EditMode';

interface ProfileTabProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
}

// Fixed Bangladesh country code
const BANGLADESH_CODE = '+880';

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
  const router = useRouter();

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
      
      setCurrentUser(prev => prev ? { ...prev, status } : null);
      
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

      <Card className="w-full overflow-hidden shadow-lg border-0 h-full flex flex-col mb-8 md:mb-0">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-4">
          <div className="flex flex-row justify-between items-start sm:items-center gap-4">
            <CardHeader className="p-0">
              <CardTitle className='text-xl md:text-2xl text-text'>My Profile</CardTitle>
            </CardHeader>
            {!editMode ? (
              <Button 
                variant="secondary"
                onClick={handleEditClick}
                className="bg-white/20 hover:bg-white/30 text-text border border-border"
              >
                <FiEdit/><span>Edit</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="secondary"
                  form="profile-form"
                  disabled={isUploading}
                  className="bg-secondary text-text hover:bg-white/50 hover:backdrop-blur-lg"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full border-b-2 border-primary mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <FiSave/><span>Save Changes</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                  className="bg-black/10 backdrop-blur-lg text-text hover:shadow-2xl"
                >
                  <FiX/>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-2 md:p-4 flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {!editMode ? (
              <ViewMode 
                currentUser={currentUser}
                updateUserStatus={updateUserStatus}
                statusUpdating={statusUpdating}
                getStatusString={getStatusString}
              />
            ) : (
              <EditMode
                profileData={profileData}
                currentUser={currentUser}
                avatarPreview={avatarPreview}
                avatarFile={avatarFile}
                phoneNumber={phoneNumber}
                errors={errors}
                isUploading={isUploading}
                handleChange={handleFieldChange} // Use the new function instead of setProfileData
                handlePhoneNumberChange={handlePhoneNumberChange}
                handleAvatarChange={handleAvatarChange}
                handleSubmit={handleSubmit}
                setShowDeleteModal={setShowDeleteModal}
                BANGLADESH_CODE={BANGLADESH_CODE}
              />
            )}
          </AnimatePresence>
        </CardContent>

        {/* Fixed buttons for mobile edit mode */}
        {editMode && (
          <CardFooter className="sticky border border-none bottom-0 bg-background border-t p-4">
            <div className="flex gap-2 w-full">
              <Button 
                type="submit"
                form="profile-form"
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        )}
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

export default ProfileTab;