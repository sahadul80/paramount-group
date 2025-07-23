import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { User } from '@/types/users';
import { FiMail, FiPhone, FiUser, FiBriefcase, FiDollarSign, FiDroplet } from 'react-icons/fi';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  user, 
  onClose, 
  onUpdateUser 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ ...user });

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(user.username, formData);
    onClose();
  };

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

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-auto max-h-[90vh] sm:max-w-auto md:max-w-lg rounded-lg flex flex-col overflow-auto">
        <DialogHeader className="px-4 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl">User Profile</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            View and edit user details
          </DialogDescription>
        </DialogHeader>
        
        {/* Mobile-friendly profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 px-4 sm:px-0">
          <Avatar className="w-16 h-16 sm:w-24 sm:h-24">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="text-lg sm:text-xl">
              {user.firstName?.charAt(0) || user.username.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold">{user.username}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getStatusString(user.status)}
              </Badge>
            </div>
            
            {/* Mobile action buttons */}
            <div className="flex justify-center sm:hidden gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'View' : 'Edit'}
              </Button>
              <Button size="sm" variant="outline">
                <FiMail /> Message
              </Button>
            </div>
          </div>
        </div>

        {!editMode ? (
          <div className="mt-2 space-y-4 px-4 sm:px-0">
            <div className="grid grid-cols-2 gap-4">
              <ProfileField 
                label="First Name" 
                value={user.firstName || '-'} 
                icon={<FiUser className="text-gray-500" />}
              />
              <ProfileField 
                label="Last Name" 
                value={user.lastName || '-'} 
                icon={<FiUser className="text-gray-500" />}
              />
              <ProfileField 
                label="Email" 
                value={user.email} 
                icon={<FiMail className="text-gray-500" />}
              />
              <ProfileField 
                label="Phone" 
                value={user.phone || '-'} 
                icon={<FiPhone className="text-gray-500" />}
              />
              <ProfileField 
                label="Department" 
                value={user.department || '-'} 
                icon={<FiBriefcase className="text-gray-500" />}
              />
              <ProfileField 
                label="Position" 
                value={user.position || '-'} 
                icon={<FiBriefcase className="text-gray-500" />}
              />
              <ProfileField 
                label="Employee ID" 
                value={user.employeeId || '-'} 
                icon={<FiBriefcase className="text-gray-500" />}
              />
              <ProfileField 
                label="Blood Group" 
                value={user.bloodGroup || '-'} 
                icon={<FiDroplet className="text-gray-500" />}
              />
              <ProfileField 
                label="Salary" 
                value={user.salary || '-'} 
                icon={<FiDollarSign className="text-gray-500" />}
              />
              <ProfileField 
                label="Joined Date" 
                value={new Date(user.createdAt).toLocaleDateString()} 
                icon={<FiDollarSign className="text-gray-500" />}
              />
            </div>
          </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.firstName+' '+formData.lastName} disabled className="text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={formData.email} disabled className="text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={formData.phone} disabled className="text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood Group</label>
                <Input
                  value={formData.bloodGroup} disabled className="text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <Input
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <Input
                  value={formData.position || ''}
                  onChange={(e) => handleChange('position', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <Input
                  value={formData.employeeId || ''}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salary</label>
                <Input
                  value={formData.salary || ''}
                  onChange={(e) => handleChange('salary', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="default" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button variant="outline" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Mobile-friendly profile field component
const ProfileField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ 
  label, 
  value,
  icon 
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-gray-500">{icon}</div>
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
        {label}
      </label>
      <p className="text-sm sm:text-base">{value}</p>
    </div>
  </div>
);

// Mobile-friendly input field component
const InputField: React.FC<{
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  icon: React.ReactNode;
}> = ({ label, value, onChange, disabled = false, icon }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2">
      {icon} {label}
    </label>
    <Input
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="text-sm sm:text-base px-3 py-2 h-10"
    />
  </div>
);

export default UserProfileModal;