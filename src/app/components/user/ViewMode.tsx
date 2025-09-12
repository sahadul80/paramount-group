import React from 'react';
import { User } from '@/types/users';
import { 
  FiUser, FiMail, FiBriefcase, FiDollarSign, 
  FiCalendar, FiMapPin, FiDroplet, FiPhone, 
  FiEdit, FiWifi, FiWifiOff, FiClock, FiAward,
  FiActivity, FiStar, FiTrendingUp, FiShield,
  FiInfo
} from 'react-icons/fi';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { motion } from 'framer-motion';
import InfoSection from './InfoSection';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ViewModeProps {
  currentUser: User;
  updateUserStatus: (status: number) => void;
  statusUpdating: boolean;
  getStatusString: (status: number) => string;
  editClick: () => void;
}

const ViewMode: React.FC<ViewModeProps> = ({
  currentUser,
  updateUserStatus,
  statusUpdating,
  getStatusString,
  editClick
}) => {
  const [activeInfoTab, setActiveInfoTab] = React.useState('overview');
  
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-red-100 text-red-800 border-red-200';
      case 1: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 2: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-slate-100 text-slate-800 border-slate-200';
      case 5: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 5: return <FiWifi className="w-3 h-3" />;
      case 3: return <FiClock className="w-3 h-3" />;
      case 4: return <FiWifiOff className="w-3 h-3" />;
      default: return <div className="w-3 h-3 rounded-full bg-current" />;
    }
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
    if (!currentUser.createdAt) return '-';
    const joinDate = new Date(currentUser.createdAt);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center space-y-2 max-w-[100vw]"
    >
      {/* Header Section with Profile and Status */}
      <div className="rounded-2xl border border-border shadow-sm p-4 w-full">
        <div className="flex flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Avatar className="w-20 h-20 sm:w-36 sm:h-36 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={currentUser.avatar || ''}
                  alt={currentUser.username} 
                  className="object-cover"
                />
                <AvatarFallback className="text-xl bg-gradient-to-r from-blue-100 to-purple-100 text-text">
                  {currentUser.firstName?.charAt(0) || currentUser.username.charAt(0)}
                  {currentUser.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1 px-1 text-xs font-xs ${getStatusColor(currentUser.status)}`}
                >
                  {getStatusIcon(currentUser.status)}
                  {getStatusString(currentUser.status)}
                </Badge>
              </div>
            </motion.div>
          </div>
          
          {/* User Info Section */}
          <div className="flex-1">
            <div className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-md sm:text-xl font-bold text-text">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <p className="text-sm text-text mt-1">@{currentUser.username}</p>
                
                <div className="flex flex-wrap gap-2">
                  {currentUser.department && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs w-auto">
                      {currentUser.department}
                    </Badge>
                  )}
                  {currentUser.position && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs w-auto">
                      {currentUser.position}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => editClick()}
                className="border-gray-300 text-text hover:bg-secondary"
              >
                <FiEdit />
                <span>Edit</span>
              </Button>
            </div>
            
            {/* Contact Info */}
            <div className="mt-2 flex flex-col">
                <a 
                    href={`mailto:${currentUser.email}`} 
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-1 max-w-[192px] break-all whitespace-normal"
                >
                    <FiMail />
                    {currentUser.email}
                </a>
                
                {currentUser.phone && (
                    <a
                    href={`tel:${currentUser.phone}`} 
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-1 max-w-[192px] break-all whitespace-normal"
                    >
                    <FiPhone />
                    {currentUser.phone}
                    </a>
                )}
            </div>
            
            {/* Status Selector */}
            <div className="mt-2 flex flex-wrap gap-2">
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    variant={currentUser.status === 5 ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateUserStatus(5)}
                    disabled={statusUpdating}
                    className={`text-xs h-6 w-18 ${currentUser.status === 5 ? "bg-green-600" : "border-gray-300 hover:bg-green-700"}`}
                    >
                    <FiWifi />
                    Online
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className='text-xs'>Available for work</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    variant={currentUser.status === 3 ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateUserStatus(3)}
                    disabled={statusUpdating}
                    className={`text-xs h-6 w-18 ${currentUser.status === 3 ? "bg-yellow-600" : "border-gray-300  hover:bg-yellow-700"}`}
                    >
                    <FiClock />
                    Away
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className='text-xs'>Temporarily unavailable</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Tabs */}
      <div className="rounded-2xl border border-border shadow-full overflow-hidden w-full">
        <Tabs value={activeInfoTab} onValueChange={setActiveInfoTab}>
          <TabsList className="flex justify-between w-full rounded-none border-b border-border text-text p-0 h-10 ">
            <TabsTrigger 
              value="overview" 
              className="flex flex-col rounded-none border-b-4 border-b-transparent data-[state=active]:border-b-blue-600 h-10 text-xs font-xs w-full"
            >
              <FiInfo className="hidden sm:flex"/>
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="personal" 
              className="flex flex-col rounded-none border-b-4 border-b-transparent data-[state=active]:border-b-blue-600 h-10 text-xs font-xs w-full"
            >
              <FiUser className="hidden sm:flex"/>
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="work"
              className="flex flex-col rounded-none border-b-4 border-b-transparent data-[state=active]:border-b-blue-600 h-10 text-xs font-xs w-full"
            >
              <FiBriefcase className="hidden sm:flex"/>
              <span>Work</span>
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="flex flex-col rounded-none border-b-4 border-b-transparent data-[state=active]:border-b-blue-600 h-10 text-xs font-xs w-full"
            >
              <FiShield className="hidden sm:flex"/>
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="p-2 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoSection 
                title="Personal Information"
                icon={<FiUser className="w-4 h-4" />}
                fields={[
                  { label: "First Name", value: safeValue(currentUser.firstName) },
                  { label: "Last Name", value: safeValue(currentUser.lastName) },
                  { label: "Date of Birth", value: formatDate(currentUser.dob) },
                  { label: "Gender", value: safeValue(currentUser.gender) },
                  { label: "Blood Group", value: currentUser.bloodGroup ? `${currentUser.bloodGroup}` : '-' },
                ]}
              />
              
              <InfoSection 
                title="Contact Information"
                icon={<FiMail className="w-4 h-4" />}
                fields={[
                  { label: "Email", value: safeValue(currentUser.email), ref:`${currentUser.email ? "mailto" : "#"}` },
                  { label: "Phone", value: safeValue(currentUser.phone), ref:`${currentUser.phone ? "tel" : "#"}` },
                  { label: "Address", value: safeValue(currentUser.address) },
                ]}
              />
              
              <InfoSection 
                title="Employment Details"
                icon={<FiBriefcase className="w-4 h-4" />}
                fields={[
                  { label: "Employee ID", value: safeValue(currentUser.employeeId) },
                  { label: "Position", value: safeValue(currentUser.position) },
                  { label: "Department", value: safeValue(currentUser.department) },
                  { label: "Joined Date", value: formatDate(currentUser.createdAt) },
                ]}
              />
              
              <InfoSection 
                title="Account Information"
                icon={<FiDollarSign className="w-4 h-4" />}
                fields={[
                  { label: "Username", value: safeValue(currentUser.username) },
                  { label: "Status", value: getStatusString(currentUser.status) },
                  { label: "Role", value: safeValue(currentUser.role) },
                  { label: "Salary", value: currentUser.salary ? `$${currentUser.salary}` : '-' },
                ]}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="personal" className="p-2 sm:p-4">
            <InfoSection 
              title="Personal Details"
              icon={<FiUser className="w-4 h-4" />}
              fields={[
                { label: "First Name", value: safeValue(currentUser.firstName) },
                { label: "Last Name", value: safeValue(currentUser.lastName) },
                { label: "Date of Birth", value: formatDate(currentUser.dob) },
                { label: "Gender", value: safeValue(currentUser.gender) },
                { label: "Blood Group", value: currentUser.bloodGroup ? `${currentUser.bloodGroup}` : '-' },
              ]}
            />
          </TabsContent>
          
          <TabsContent value="work" className="p-2 sm:p-4">
            <InfoSection 
              title="Work Information"
              icon={<FiBriefcase className="w-4 h-4" />}
              fields={[
                { label: "Employee ID", value: safeValue(currentUser.employeeId) },
                { label: "Position", value: safeValue(currentUser.position) },
                { label: "Department", value: safeValue(currentUser.department) },
                { label: "Salary", value: currentUser.salary ? `$${currentUser.salary}` : '-' },
                { label: "Joined Date", value: formatDate(currentUser.createdAt) },
                { label: "Tenure", value: getTenure() },
              ]}
            />
          </TabsContent>
          
          <TabsContent value="account" className="p-2 sm:p-4">
            <InfoSection 
              title="Account Details"
              icon={<FiShield className="w-4 h-4" />}
              fields={[
                { label: "Username", value: safeValue(currentUser.username) },
                { label: "Email", value: safeValue(currentUser.email) },
                { label: "Status", value: getStatusString(currentUser.status) },
                { label: "Role", value: safeValue(currentUser.role) },
                { label: "Account Created", value: formatDate(currentUser.createdAt) },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default ViewMode;