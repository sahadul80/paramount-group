import React, { useState } from 'react';
import { Button } from "../ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { User } from '@/types/users';
import { 
  FiMail, 
  FiPhone, 
  FiUser, 
  FiBriefcase, 
  FiDollarSign, 
  FiDroplet, 
  FiEdit, 
  FiTrash2,
  FiX,
  FiSave,
  FiWatch,
  FiFramer,
  FiUserX,
  FiLoader
} from 'react-icons/fi';
import { cn } from '@/app/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => void;
  onUserDeleted: (username: string) => void;
}

const statusOptions = [
  { value: 0, label: 'Inactive' },
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Away' },
  { value: 4, label: 'Offline' },
  { value: 5, label: 'Online' },
];

const roleOptions = [
  { value: 'erp', label: 'ERP Manangement' },
  { value: 'demand', label: 'Demand Entry' },
  { value: 'admin', label: 'HR&Admin Management' },
];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  user, 
  onClose, 
  onUpdateUser,
  onUserDeleted
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ ...user });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // case-insensitive admin check
  const isAdmin = localStorage.getItem('role') === 'admin';

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // only admins can submit updates
    if (!isAdmin) {
      toast.error("You don't have permission to update this user.");
      return;
    }

    setIsSaving(true);
    
    try {
      await onUpdateUser(user.username, formData);
      setEditMode(false);
      toast.success("User profile has been updated successfully");
    } catch (error) {
      toast.error("Update Failed! Could not update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusString = (status: number) => {
    return statusOptions.find(opt => opt.value === status)?.label || 'Unknown';
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-destructive text-destructive-foreground';
      case 1: return 'bg-warning text-warning-foreground';
      case 2: return 'bg-success text-success-foreground';
      case 3: return 'bg-secondary text-secondary-foreground';
      case 4: return 'bg-muted text-muted-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const handleDeleteUser = async () => {
    // extra guard: do nothing if not admin
    if (!isAdmin) {
      toast.error("You don't have permission to delete this user.");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast.warning(`User "${user.username}" has been deleted successfully. You can no longer access the system. GOODBYE!!!`);

      onUserDeleted(user.username);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Error!!! Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getAvatarUrl = (url: string | undefined) => {
    if (!url) return '';
    return url.includes("googleapis.com/drive/v3/files/")
      ? `/api/image-proxy?url=${encodeURIComponent(url)}`
      : url;
  };

  return (
    <motion.div
      key="view"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: .8, opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="space-y-4 md:space-y-6"
    >
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogHeader><DialogTitle></DialogTitle></DialogHeader>
      <DialogContent className="max-w-xl sm:max-w-[90vw] max-h-[90vh] rounded-xl p-0 overflow-hidden shadow-2xl">
        {/* Profile header */}
        <div className="p-4 flex flex-row gap-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Avatar className="w-32 h-32 border-4 border-background shadow-full">
              <AvatarImage 
                src={getAvatarUrl(user.avatar)}
                alt={user.username}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {user.firstName?.charAt(0) || user.username?.charAt(0)}
                {user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-2 py-0.5 md:px-3 md:py-1 rounded-full font-medium shadow-md",
                  getStatusColor(user.status)
                )}
              >
                {getStatusString(user.status)}
              </Badge>
            </div>
          </motion.div>
          
          <div className="justify-start">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-bold drop-shadow-md">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-1 text-sm md:text-base">@{user.username}</p>
              
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1 md:gap-2">
                <Badge variant="secondary" className="bg-background/20 backdrop-blur-sm">
                  {user.role}
                </Badge>
                {user.department && (
                  <Badge variant="secondary" className="bg-background/20 backdrop-blur-sm">
                    {user.department}
                  </Badge>
                )}
              </div>
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {/* Edit button - only visible to admins */}
              {isAdmin && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-background hover:bg-background/80 rounded-full"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <FiUserX/> 
                    {editMode ? 'View' : 'Edit'}
                  </Button>
                </motion.div>
              )}
              
              {/* Delete button - only visible to admins and when not in edit mode */}
              {isAdmin && !editMode && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-text rounded-full"
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                  >
                    <FiTrash2/> 
                    Delete
                  </Button>
                </motion.div>
              )}
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-background hover:bg-background/80 rounded-full"
                >
                  <FiMail/> 
                  Message
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      
        {/* Content */}
        <div className="px-4 pb-4 max-h-[75vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {!editMode ? (
              <motion.div
                key="view"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.2 }}
                exit={{ opacity: 0 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 sm:mb-0">
                  <InfoCard 
                    title="Personal Information" 
                    icon={<FiUser className="text-primary" />}
                  >
                    <InfoField label="First Name" value={user.firstName || '-'} />
                    <InfoField label="Last Name" value={user.lastName || '-'} />
                    <InfoField label="Date of Birth" value={user.dob || '-'} />
                    <InfoField label="Gender" value={user.gender || '-'} />
                    <InfoField label="Blood Group" value={user.bloodGroup || '-'} />
                  </InfoCard>
                  
                  <InfoCard 
                    title="Contact Information" 
                    icon={<FiPhone className="text-primary" />}
                  >
                    <InfoAncor label="Email" value={user.email || '-'} ref={`${user.email ? "mailto" : "#"}`} />
                    <InfoAncor label="Phone" value={user.phone || '-'} ref={`${user.phone ? "tel" : "#"}`} />
                    <InfoField label="Address" value={user.address || '-'} />
                  </InfoCard>
                  
                  <InfoCard 
                    title="Employment Details" 
                    icon={<FiBriefcase className="text-primary" />}
                  >
                    <InfoField label="Employee ID" value={user.employeeId || '-'} />
                    <InfoField label="Position" value={user.position || '-'} />
                    <InfoField label="Department" value={user.department || '-'} />
                    <InfoField label="Salary" value={user.salary || '-'} />
                    <InfoField 
                      label="Joined Date" 
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '-'} 
                    />
                  </InfoCard>
                
                  <InfoCard 
                    title="Account Information" 
                    icon={<FiDollarSign className="text-primary" />}
                  >
                    <InfoField label="Username" value={user.username} />
                    <InfoField label="Status" value={getStatusString(user.status)} />
                    <InfoField label="Role" value={user.role} />
                  </InfoCard>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.2 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 border-1 border-border rounded-lg">
                  <div className="p-4 border-r border-border">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <FiBriefcase className="text-primary" /> 
                      Employment Details
                    </h3>
                  
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Employee ID</label>
                        <Input
                          value={formData.employeeId || ''}
                          onChange={(e) => handleChange('employeeId', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Position</label>
                        <Input
                          value={formData.position || ''}
                          onChange={(e) => handleChange('position', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Department</label>
                        <Input
                          value={formData.department || ''}
                          onChange={(e) => handleChange('department', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Salary</label>
                        <Input
                          value={formData.salary || ''}
                          onChange={(e) => handleChange('salary', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-l border-border">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <FiDollarSign className="text-primary" /> 
                      Account Information
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Role</label>
                        <Select
                          value={formData.role?.toString() || ''}
                          onValueChange={(value) => handleChange('role', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(option => (
                              <SelectItem key={option.value} value={option.value} className="border border-border hover:cursor-pointer hover:font-bold">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Status</label>
                        <Select
                          value={formData.status?.toString() || ''}
                          onValueChange={(value) => handleChange('status', value)}
                        >
                          <SelectTrigger className="w-full ">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value.toString()}  className="border border-border hover:cursor-pointer hover:font-bold">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                  </div>
                  
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      
        {/* Delete button - Only shown in edit mode (and only for admins) */}
        {isAdmin && editMode && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
          <div className="sticky bottom-0 flex justify-center p-3 border-t border-border gap-2">
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting || isSaving}
              className="text-text hover:shadow-full hover:font-bold"
            >
              {isDeleting ? (
                <>
                  <FiLoader className='animate-spin'/>
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 /> Delete Account
                </>
              )}
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="text-text hover:shadow-full hover:font-bold"
            >
              {isSaving ? (
                <>
                  <FiLoader className='animate-spin'/>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave /> Save Changes
                </>
              )}
            </Button>
          </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
    </motion.div>
  );
};

// Info Card Component
const InfoCard: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode 
}> = ({ title, icon, children }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
      {icon}
      <h3 className="font-semibold text-foreground text-base md:text-lg">{title}</h3>
    </div>
    <div className="space-y-2">
      {children}
    </div>
  </motion.div>
);

// Info Field Component
const InfoField: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="flex flex-row items-center">
    <div className="w-32 text-sm font-medium text-muted-foreground p-1">{label}</div>
    <div className="text-foreground font-medium text-base break-all">{value}</div>
  </div>
);

// Info Ancor Component
const InfoAncor: React.FC<{ label: string; value: string; ref?: string; }> = ({ label, value, ref }) => (
  <div className="flex flex-row items-center">
    <div className="w-32 text-sm font-medium text-muted-foreground p-1">{label}</div>
    <div className="text-foreground font-medium text-base break-all">
      <a href={`${ref}:${value}`}>{value}</a>
    </div>
  </div>
);
export default UserProfileModal;