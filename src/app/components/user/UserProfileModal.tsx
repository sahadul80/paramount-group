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
  FiLoader,
  FiEdit2,
  FiInfo,
  FiShield
} from 'react-icons/fi';
import { cn } from '@/app/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';
import InfoSection from './InfoSection';

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

  // Format date for display - updated to handle undefined values
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to safely convert values to strings
    const safeValue = (value: any): string => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (React.isValidElement(value)) return '-';
      return String(value);
    };
  
    // Calculate time at company
    const getTenure = () => {
      if (!user.createdAt) return '-';
      const joinDate = new Date(user.createdAt);
      const today = new Date();
      const years = today.getFullYear() - joinDate.getFullYear();
      const months = today.getMonth() - joinDate.getMonth();
      
      if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
      }
      return `${months} month${months > 1 ? 's' : ''}`;
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
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-full">
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
            
            <div className="absolute bottom-4 sm:bottom-0 left-1/2 transform -translate-x-1/2">
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
              <h2 className="text-lg sm:text-xl font-bold drop-shadow-md">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-1 text-sm sm:text-base">@{user.username}</p>
              
              <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-1 md:gap-2">
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
            
            <div className="flex justify-start gap-1">
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
                      <><FiInfo/><span className='text-xs sm:text-sm'>View</span></>
                      ) : (
                      <><FiEdit/><span className='text-xs sm:text-sm'>Edit</span></>
                      )}
                  </Button>
                </motion.div>
              )}
              
              {/* Delete button - only visible to admins and when not in edit mode */}
              {isAdmin && !editMode && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-text rounded-lg p-2"
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                  >
                    <FiTrash2/> 
                    <span className='sm:text-sm text-xs'>Delete</span>
                  </Button>
                </motion.div>
              )}
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-sky-400 text-text text-xs hover:bg-sky-600 rounded-lg p-2"
                >
                  <>
                    <FiMail/> 
                    <span className='text-xs sm:text-sm'>Send</span>
                  </>
                </Button>
              </motion.div>
            </div>
          </div>
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
                  <InfoSection 
                    title="Personal Information"
                    icon={<FiUser className="w-4 h-4" />}
                    fields={[
                      { label: "First Name", value: safeValue(user.firstName ? user.firstName : '-') },
                      { label: "Last Name", value: safeValue(user.lastName ? user.lastName : '-') },
                      { label: "Date of Birth", value: formatDate(user.dob ? user.dob : '-') },
                      { label: "Gender", value: safeValue(user.gender ? user.gender : '-') },
                      { label: "Blood Group", value: user.bloodGroup ? `${user.bloodGroup}` : '-' },
                    ]}
                  />
                  
                  <InfoSection 
                    title="Contact Information"
                    icon={<FiMail className="w-4 h-4" />}
                    fields={[
                      { label: "Email", value: safeValue(user.email), ref:`${user.email ? "mailto" : "#"}` },
                      { label: "Phone", value: safeValue(user.phone ? user.phone : '-'), ref:`${user.phone ? "tel" : "#"}` },
                      { label: "Address", value: safeValue(user.address ? user.address : '-') },
                    ]}
                  />
                  
                  <InfoSection 
                    title="Employment Details"
                    icon={<FiBriefcase className="w-4 h-4" />}
                    fields={[
                      { label: "Employee ID", value: safeValue(user.employeeId ? user.employeeId : '-') },
                      { label: "Position", value: safeValue(user.position ? user.position : '-') },
                      { label: "Department", value: safeValue(user.department ? user.department : '-') },
                      { label: "Joined Date", value: formatDate(user.createdAt) },
                    ]}
                  />
                  
                  <InfoSection 
                    title="Account Information"
                    icon={<FiDollarSign className="w-4 h-4" />}
                    fields={[
                      { label: "Username", value: safeValue(user.username) },
                      { label: "Status", value: getStatusString(user.status) },
                      { label: "Role", value: safeValue(user.role) },
                      { label: "Salary", value: user.salary ? `$${user.salary}` : '-' },
                    ]}
                  />
                </div>
              </motion.div>
            ) : (
              <>
              <motion.form
                    key="edit"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 border-1 border-border rounded-lg">
                      <div className="p-2 sm:p-4 sm:border-r border-border">
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
                              disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 md:mb-2">Position</label>
                            <Input
                              value={formData.position || ''}
                              onChange={(e) => handleChange('position', e.target.value)}
                              disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 md:mb-2">Department</label>
                            <Input
                              value={formData.department || ''}
                              onChange={(e) => handleChange('department', e.target.value)}
                              disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 md:mb-2">Salary</label>
                            <Input
                              value={formData.salary || ''}
                              onChange={(e) => handleChange('salary', e.target.value)}
                              disabled={isSaving} />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-l border-border">
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
                              onValueChange={(value) => handleChange('status', value)}
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
                  </motion.form>
                  </>
            )}
          </AnimatePresence>
        </div>
      
        {/* Delete button - Only shown in edit mode (and only for admins) */}
        {isAdmin && editMode ? (
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
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
          <div className="sticky bottom-0 flex justify-center p-3 border-t border-border gap-2 h-16">
            
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
export const InfoField: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="flex flex-row items-center">
    <div className="w-1/3 text-sm font-medium text-muted-foreground flex justify-start">{label}</div>
      <div className="w-2/3 text-foreground font-medium flex justify-start break-all">{value}</div>
    </div>
);

// Info Ancor Component
export const InfoAncor: React.FC<{ label: string; value: string; ref?: string; }> = ({ label, value, ref }) => (
  <div className="flex flex-row items-center">
    <div className="w-1/3 text-sm font-medium text-muted-foreground flex justify-start">{label}</div>
    <div className="w-2/3 text-foreground font-medium flex justify-start break-all">
      <a href={`${ref}:${value}`}>{value}</a>
    </div>
  </div>
);
export default UserProfileModal;