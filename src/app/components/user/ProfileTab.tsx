import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { User } from '@/types/users';

interface ProfileTabProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  currentUser, 
  setCurrentUser, 
  handleProfileUpdate 
}) => {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<User>({ ...currentUser });

  const getStatusString = (status: number) => {
    switch (status) {
      case 0: return 'inactive';
      case 1: return 'pending';
      case 2: return 'active';
      case 3: return 'away';
      case 4: return 'offline';
      default: return 'online';
    }
  };

  const handleChange = (field: keyof User, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = () => {
    setProfileData({ ...currentUser }); // Reset to current data
    setEditMode(true);
  };

  const handleCancel = () => {
    setProfileData({ ...currentUser }); // Reset to original data
    setEditMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call parent's update handler with profileData
    const success = await handleProfileUpdate(profileData);
    
    if (success) {
      // Only update local state if API call succeeded
      setCurrentUser(profileData);
      setEditMode(false);
    }
  };

  return (
    <Card className="w-auto max-h-[75vh] overflow-auto shadow-sm">
        <div className="flex justify-between">
      <CardHeader>
        <CardTitle className='text-xl sm:text-2xl'>My Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      </div>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex flex-row justify-start">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-grow">
                    <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold px-2">{currentUser.username}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm px-2">{currentUser.email}</p>
                        <Badge variant={currentUser.status === 0 ? 'success' : 'warning'}>
                        {currentUser.role} • {getStatusString(currentUser.status)}
                        </Badge>
                    </div>
                </div>
            </div>
            </div>              
            {!editMode ? (
                <Button variant="outline" onClick={handleEditClick}>Edit Profile</Button>
            ) : (
                <div className="flex justify-center gap-3">
                <Button variant="default" type="button" onClick={handleCancel}>
                Cancel
                </Button>
                <Button variant="outline" type="submit">
                Save Changes
                </Button>
            </div>
            )}
        </div>

        {!editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6">
            {currentUser.firstName && currentUser.lastName && (
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <p className="text-sm">{currentUser.firstName} {currentUser.lastName}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <p className="text-sm">{currentUser.email}</p>
            </div>
            {currentUser.address && (
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <p className="text-sm">{currentUser.address}</p>
            </div>)}
            {currentUser.phone && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <p className="text-sm">{currentUser.phone}</p>
            </div>)}
            {currentUser.department && (
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <p className="text-sm">{currentUser.department}</p>
            </div>)}
            {currentUser.position && (
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <p className="text-sm">{currentUser.position}</p>
            </div>)}
            {currentUser.gender && (
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <p className="text-sm">{currentUser.gender}</p>
            </div>)}
            {currentUser.employeeId && (
            <div>
              <label className="block text-sm font-medium mb-1">Employee ID</label>
              <p className="text-sm">{currentUser.employeeId}</p>
            </div>)}
            {currentUser.nationality && (
            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <p className="text-sm">{currentUser.nationality}</p>
            </div>)}
            {currentUser.dob && (
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <p className="text-sm">{currentUser.dob}</p>
            </div>)}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <p className="text-sm">{currentUser.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <p className="text-sm">{getStatusString(currentUser.status)}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input type="text" value={profileData.username} disabled className="text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <Input type="text" value={profileData.employeeId || ''} disabled className="text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input
                  type="text"
                  value={profileData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input
                  type="text"
                  value={profileData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <Input 
                  type="date"
                  value={profileData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood Group</label>
                <Input 
                  type="select"
                  value={profileData.bloodGroup || ''}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  type="text"
                  value={profileData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  type="text"
                  value={profileData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <Input
                  type="text"
                  value={profileData.gender || ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <Input
                  type="text"
                  value={profileData.nationality || ''}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <Input type="text" value={profileData.department || ''} disabled className="text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <Input type="text" value={profileData.position || ''} disabled className="text-sm" />
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileTab;