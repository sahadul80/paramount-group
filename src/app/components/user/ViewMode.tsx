// components/user/ProfileTab/ViewMode.tsx
import React from 'react';
import { User } from '@/types/users';
import { FiUser, FiMail, FiBriefcase, FiDollarSign, FiWifi, FiWifiOff } from 'react-icons/fi';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { motion } from 'framer-motion';
import InfoSection from './InfoSection';

interface ViewModeProps {
  currentUser: User;
  updateUserStatus: (status: number) => void;
  statusUpdating: boolean;
  getStatusString: (status: number) => string;
}

const ViewMode: React.FC<ViewModeProps> = ({
  currentUser,
  updateUserStatus,
  statusUpdating,
  getStatusString
}) => {
  const [activeInfoTab, setActiveInfoTab] = React.useState('personal');
  
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
      default: return <div className="w-4 h-4 rounded-full bg-current" />;
    }
  };

  return (
    <motion.div
      key="view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* User Info with Avatar */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-2">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-lg">
            <AvatarImage 
              src={currentUser.avatar || ''}
              alt={currentUser.username} 
              className="object-cover"
            />
            <AvatarFallback className="text-2xl bg-muted">
              {currentUser.firstName?.charAt(0) || currentUser.username.charAt(0)}
              {currentUser.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <Badge className={`flex items-center gap-1 ${getStatusColor(currentUser.status)}`}>
              {getStatusIcon(currentUser.status)}
              {getStatusString(currentUser.status)}
            </Badge>
          </div>
        </motion.div>
        
        <div className="text-center md:text-left flex-1">
          <h2 className="text-lg font-bold text-foreground">
            {currentUser.firstName} {currentUser.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
          <a href={`mailto:${currentUser.email}`} className="text-sm text-muted-foreground">{currentUser.email}</a>
          
          <div className="mt-1 flex flex-wrap gap-2 justify-center md:justify-start">
            <Badge variant="default" className="bg-primary">
              {currentUser.role}
            </Badge>
            {currentUser.department && (
              <Badge variant="outline" className="bg-secondary text-secondary-foreground">
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
          <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
            <Button 
              variant={currentUser.status === 5 ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateUserStatus(5)}
              disabled={statusUpdating}
              className={currentUser.status === 5 ? "bg-success hover:bg-success/90" : ""}
            >
              <FiWifi className="w-4 h-4" />
              Online
            </Button>
            <Button 
              variant={currentUser.status === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateUserStatus(3)}
              disabled={statusUpdating}
              className={currentUser.status === 3 ? "bg-warning hover:bg-warning/90" : ""}
            >
              <FiWifiOff className="w-4 h-4" />
              Away
            </Button>
            <Button 
              variant={currentUser.status === 4 ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateUserStatus(4)}
              disabled={statusUpdating}
              className={currentUser.status === 4 ? "bg-muted hover:bg-muted/90" : ""}
            >
              <FiWifiOff className="w-4 h-4" />
              Offline
            </Button>
          </div>
        </div>
      </div>
      
      {/* Info Tabs for Mobile */}
      <div className="md:hidden">
        <Tabs value={activeInfoTab} onValueChange={setActiveInfoTab}>
          <TabsList className="grid grid-cols-4 w-full border border-border rounded-lg text-text text-xs">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-1">
            <InfoSection 
              title="Personal Information"
              icon={<FiUser />}
              fields={[
                { label: "First Name", value: currentUser.firstName || '-' },
                { label: "Last Name", value: currentUser.lastName || '-' },
                { label: "Date of Birth", value: currentUser.dob || '-' },
                { label: "Gender", value: currentUser.gender || '-' },
                { label: "Blood Group", value: currentUser.bloodGroup || '-' },
              ]}
            />
          </TabsContent>
          
          <TabsContent value="contact" className="mt-2">
            <InfoSection 
              title="Contact Information"
              icon={<FiMail />}
              fields={[
                { label: "Email", value: currentUser.email },
                { label: "Phone", value: currentUser.phone || '-' },
                { label: "Address", value: currentUser.address || '-' },
              ]}
            />
          </TabsContent>
          
          <TabsContent value="employment" className="mt-2">
            <InfoSection 
              title="Employment Details"
              icon={<FiBriefcase />}
              fields={[
                { label: "Employee ID", value: currentUser.employeeId || '-' },
                { label: "Position", value: currentUser.position || '-' },
                { label: "Department", value: currentUser.department || '-' },
                { label: "Joined Date", value: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '-' },
              ]}
            />
          </TabsContent>
          <TabsContent value="account" className="mt-2">
            <InfoSection 
              title="Account Information"
              icon={<FiDollarSign />}
              fields={[
                { label: "Username", value: currentUser.username },
                { label: "Status", value: getStatusString(currentUser.status) },
                { label: "Role", value: currentUser.role },
                { label: "Salary", value: currentUser.salary || '-' },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Desktop Info Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 gap-2 mt-2">
        <InfoSection 
          title="Personal Information"
          icon={<FiUser />}
          fields={[
            { label: "First Name", value: currentUser.firstName || '-' },
            { label: "Last Name", value: currentUser.lastName || '-' },
            { label: "Date of Birth", value: currentUser.dob || '-' },
            { label: "Gender", value: currentUser.gender || '-' },
            { label: "Blood Group", value: currentUser.bloodGroup || '-' },
          ]}
        />
        
        <InfoSection 
          title="Contact Information"
          icon={<FiMail />}
          fields={[
            { label: "Email", value: currentUser.email },
            { label: "Phone", value: currentUser.phone || '-' },
            { label: "Address", value: currentUser.address || '-' },
          ]}
        />
        
        <InfoSection 
          title="Employment Details"
          icon={<FiBriefcase />}
          fields={[
            { label: "Employee ID", value: currentUser.employeeId || '-' },
            { label: "Position", value: currentUser.position || '-' },
            { label: "Department", value: currentUser.department || '-' },
            { label: "Salary", value: currentUser.salary || '-' },
            { label: "Joined Date", value: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '-' },
          ]}
        />
        
        <InfoSection 
          title="Account Information"
          icon={<FiDollarSign />}
          fields={[
            { label: "Username", value: currentUser.username },
            { label: "Status", value: getStatusString(currentUser.status) },
            { label: "Role", value: currentUser.role },
          ]}
        />
      </div>
    </motion.div>
  );
};

export default ViewMode;