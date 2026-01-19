import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
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
  FiEdit, 
  FiTrash2,
  FiSave,
  FiLoader,
  FiEdit2,
  FiInfo
} from 'react-icons/fi';
import { cn } from '@/app/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => Promise<User>;
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
  { value: 'erp', label: 'ERP Management' },
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'HR & Admin Management' },
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      setIsAdmin(role?.toLowerCase() === 'admin');
    }
  }, []);

  const handleChange = (field: keyof User, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("You don't have permission to update this user.");
      return;
    }

    setIsSaving(true);
    
    try {
      const updatedUser = await onUpdateUser(user.username!, formData); // Added non-null assertion
      if (updatedUser) {
        setEditMode(false);
        toast.success("User profile has been updated successfully");
      } else {
        toast.error("Update Failed! Could not update profile.");
      }
    } catch (error) {
      toast.error("Update Failed! Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusString = (status: number | undefined) => {
    if (status === undefined) return 'Unknown';
    return statusOptions.find(opt => opt.value === status)?.label || 'Unknown';
  };

  const getStatusColor = (status: number | undefined) => {
    switch (status) {
      case 0: return 'bg-destructive text-destructive-foreground';
      case 1: return 'bg-warning text-warning-foreground';
      case 2: return 'bg-success text-success-foreground';
      case 3: return 'bg-secondary text-secondary-foreground';
      case 4: return 'bg-muted text-muted-foreground';
      case 5: return 'bg-primary text-primary-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const handleDeleteUser = async () => {
    if (!isAdmin) {
      toast.error("You don't have permission to delete this user.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      onUserDeleted(user.username!); // Added non-null assertion
      toast.warning(`User "${user.username}" has been deleted successfully.`);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Error! Failed to delete user. Please try again.");
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

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return '-';
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      
      <DialogContent className="max-w-xl sm:max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl">
        {/* Profile header */}
        <DialogHeader className="bg-gradient-to-r from-primary to-secondary p-4 flex flex-row items-center text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-24 h-24 sm:w-32 sm:h-32"
          >
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-full">
              <AvatarImage 
                src={getAvatarUrl(user.avatar)}
                alt={user.username}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {(user.firstName?.charAt(0) || user.username?.charAt(0) || '').toUpperCase()}
                {(user.lastName?.charAt(0) || '').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex justify-center -mt-1">
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
          
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <DialogTitle className="text-lg sm:text-xl font-bold drop-shadow-md">
                {user.firstName} {user.lastName}
              </DialogTitle>
              <p className="mt-1 text-sm sm:text-base">@{user.username}</p>
              
              <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-1 md:gap-2">
                <Badge variant="secondary" className="bg-background/20 backdrop-blur-sm">
                  {user.role || 'No role'}
                </Badge>
                {user.department && (
                  <Badge variant="secondary" className="bg-background/20 backdrop-blur-sm">
                    {user.department}
                  </Badge>
                )}
              </div>
            </motion.div>
        </DialogHeader>
        <div className="flex justify-end gap-2 p-4 mt-2">
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
                className="bg-foreground hover:bg-background rounded-lg p-2"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <>
                    <FiInfo className="mr-1" />
                    <span className='text-xs sm:text-sm'>View</span>
                  </>
                ) : (
                  <>
                    <FiEdit className="mr-1" />
                    <span className='text-xs sm:text-sm'>Edit</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
        {/* Content */}
        <div className="px-4 max-h-[55vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {!editMode ? (
              <motion.div
                key="view"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 md:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <FiUser className="w-4 h-4" />
                      <h3 className="font-semibold text-foreground">Personal Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">First Name</div>
                        <div className="w-2/3 text-foreground font-medium">{user.firstName || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Last Name</div>
                        <div className="w-2/3 text-foreground font-medium">{user.lastName || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Date of Birth</div>
                        <div className="w-2/3 text-foreground font-medium">{formatDate(user.dob)}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Gender</div>
                        <div className="w-2/3 text-foreground font-medium">{user.gender || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Blood Group</div>
                        <div className="w-2/3 text-foreground font-medium">{user.bloodGroup || '-'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <FiMail className="w-4 h-4" />
                      <h3 className="font-semibold text-foreground">Contact Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Email</div>
                        <div className="w-2/3 text-foreground font-medium">
                          <a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a>
                        </div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Phone</div>
                        <div className="w-2/3 text-foreground font-medium">
                          {user.phone ? (
                            <a href={`tel:${user.phone}`} className="hover:underline">{user.phone}</a>
                          ) : '-'}
                        </div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Address</div>
                        <div className="w-2/3 text-foreground font-medium">{user.address || '-'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Employment Details */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <FiBriefcase className="w-4 h-4" />
                      <h3 className="font-semibold text-foreground">Employment Details</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Employee ID</div>
                        <div className="w-2/3 text-foreground font-medium">{user.employeeId || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Position</div>
                        <div className="w-2/3 text-foreground font-medium">{user.position || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Department</div>
                        <div className="w-2/3 text-foreground font-medium">{user.department || '-'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Joined Date</div>
                        <div className="w-2/3 text-foreground font-medium">{formatDate(user.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Information */}
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <FiDollarSign className="w-4 h-4" />
                      <h3 className="font-semibold text-foreground">Account Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Username</div>
                        <div className="w-2/3 text-foreground font-medium">{user.username}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Status</div>
                        <div className="w-2/3 text-foreground font-medium">{getStatusString(user.status)}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Role</div>
                        <div className="w-2/3 text-foreground font-medium">{user.role || 'No role'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-1/3 text-sm font-medium text-muted-foreground">Salary</div>
                        <div className="w-2/3 text-foreground font-medium">{user.salary ? `$${user.salary}` : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 border-1 border-border rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-border">
                  <div className="p-2 sm:p-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <FiBriefcase className="text-primary" />
                      Employment Details
                    </h3>

                    <div className="space-y-1 sm:space-y-3">
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
                          type="number"
                          value={formData.salary || ''}
                          onChange={(e) => handleChange('salary', e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 sm:p-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <FiDollarSign className="text-primary" />
                      Account Information
                    </h3>

                    <div className="space-y-1 sm:space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1 md:mb-2">Role</label>
                        <Select
                          value={formData.role?.toString() || ''}
                          onValueChange={(value) => handleChange('role', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-full h-10">
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
                          onValueChange={(value) => handleChange('status', parseInt(value))}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value.toString()} className="border border-border hover:cursor-pointer hover:font-bold">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons for edit mode */}
                {isAdmin && editMode && (
                  <div className="sticky bottom-0 flex justify-center p-3 border-t border-border gap-2 mt-4">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteUser}
                      disabled={isDeleting || isSaving}
                      className="text-text hover:shadow-full hover:font-bold"
                      type="button"
                    >
                      {isDeleting ? (
                        <>
                          <FiLoader className='animate-spin mr-1'/>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FiTrash2 className="mr-1" /> Delete Account
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
                          <FiLoader className='animate-spin mr-1'/>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="mr-1" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;