import React, { useState } from 'react';
import { 
  FiUser, FiUsers, FiClock, FiActivity, 
  FiWifi, FiWifiOff, FiCoffee, FiSearch, 
  FiMail,
  FiBookmark
} from 'react-icons/fi';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import UserProfileModal from './UserProfileModal';
import { User } from '@/types/users';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// Define status tab values type
type StatusTabValue = 'all' | 'pending' | 'active';
type PresenceTabValue = 'online' | 'offline' | 'away';

interface UsersTabProps {
  users: User[];
  loading: boolean;
  onApprove: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => void;
  onUserDeleted: (username: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, loading, onApprove, onUpdateUser, onUserDeleted }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<StatusTabValue>('all');
  const [activePresenceTab, setActivePresenceTab] = useState<PresenceTabValue>('online');
  
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

  // Filter users based on search term only
  const filteredUsers = users.filter(user => {
    // Check if user has required properties
    const hasUsername = user.username && typeof user.username === 'string';
    const hasEmail = user.email && typeof user.email === 'string';
    const hasRole = user.role && typeof user.role === 'string';
    
    // Create safe versions of properties
    const safeUsername = hasUsername ? user.username.toLowerCase() : '';
    const safeEmail = hasEmail ? user.email.toLowerCase() : '';
    const safeRole = hasRole ? user.role.toLowerCase() : '';
    const safeFirstName = user.firstName ? user.firstName.toLowerCase() : '';
    const safeLastName = user.lastName ? user.lastName.toLowerCase() : '';
    
    const safeSearchTerm = searchTerm.toLowerCase();
    
    return (
      safeUsername.includes(safeSearchTerm) ||
      safeEmail.includes(safeSearchTerm) ||
      safeRole.includes(safeSearchTerm) ||
      safeFirstName.includes(safeSearchTerm) ||
      safeLastName.includes(safeSearchTerm)
    );
  });

  // Determine badge variant based on status
  const getBadgeVariant = (status: number) => {
    switch (status) {
      case 0: return 'destructive';
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'secondary';
      case 4: return 'outline';
      default: return 'default';
    }
  };

  // Filter users for main tabs
  const getUsersForTab = () => {
    if (searchTerm) return filteredUsers;
    
    switch (activeMainTab) {
      case 'pending':
        return filteredUsers.filter(user => user.status === 1);
      case 'active':
        // Filter by presence tab when in active main tab
        switch (activePresenceTab) {
          case 'online':
            return filteredUsers.filter(user => user.status === 5);
          case 'offline':
            return filteredUsers.filter(user => user.status === 4);
          case 'away':
            return filteredUsers.filter(user => user.status === 3);
          default:
            return filteredUsers.filter(user => user.status === 6);
        }
      default:
        return filteredUsers;
    }
  };

  const currentUsers = getUsersForTab();
  const pendingCount = users.filter(user => user.status === 1).length;
  const onboardedCount = users.filter(user => user.status === 2).length;
  const onlineCount = users.filter(user => user.status === 5).length;
  const offlineCount = users.filter(user => user.status === 4).length;
  const awayCount = users.filter(user => user.status === 3).length;
  const activeCount = onlineCount+offlineCount+awayCount;

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <Card className="max-h-[80vh] max-w-[85vw] overflow-auto shadow-sm">
      <CardHeader>
        <div className='flex flex-col sm:flex-row justify-between gap-4'>
          <div className='flex flex-col'>
            <CardTitle className='text-md sm:text-xl'>User Directory</CardTitle>
            <CardDescription>Manage all users in the system</CardDescription>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-2 top-5 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Show search results as a single list when search term exists */}
            {searchTerm && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center">
                    <FiSearch className="mr-2" />
                    Search Results for "{searchTerm}" 
                    <span className="text-muted-foreground ml-2">
                      ({filteredUsers.length} {filteredUsers.length === 1 ? 'match' : 'matches'})
                    </span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <motion.div
                        key={user.username}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                      >
                        <Card 
                          className="flex flex-col justify-between hover:shadow-md transition-shadow h-full border border-gray-200 dark:border-gray-700"
                          onClick={() => setSelectedUser(user)}
                        >
                          <CardHeader className="flex flex-row items-center space-x-3">
                            <Avatar className="border-2 border-indigo-500">
                              <AvatarImage
                                src={
                                  user.avatar?.includes("googleapis.com/drive/v3/files/")
                                    ? `/api/image-proxy?url=${user.avatar}`
                                    : user.avatar
                                }
                                alt={user.username} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-800">
                                {user.firstName?.charAt(0) || user.username.charAt(0)}
                                {user.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {user.firstName} {user.lastName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                @{user.username}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-4">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {user.role}
                              </Badge>
                              <Badge variant={getBadgeVariant(user.status)} className="text-xs">
                                {getStatusString(user.status)}
                              </Badge>
                              {user.department && (
                                <Badge variant="outline" className="text-xs">
                                  {user.department}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 space-y-1 text-xs">
                              {user.position && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Position: {user.position}
                                </p>
                              )}
                              {user.employeeId && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  ID: {user.employeeId}
                                </p>
                              )}
                              <p className="text-gray-500">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between p-4">
                            <Button size="sm" className="flex items-center">
                              Send <FiMail />
                            </Button>                          
                            {user.status === 1 && (
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApprove(user.username);
                                }}
                                className="bg-green-100 hover:bg-green-200 text-green-800"
                              >
                                <FiBookmark/> Approve
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No users found matching your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Show tabs only when not searching */}
            {!searchTerm && (
              <Tabs 
                value={activeMainTab} 
                onValueChange={(value: string) => setActiveMainTab(value as StatusTabValue)}
                className="w-full"
              >
                {/* Main Tabs */}
                <TabsList className="flex bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="mr-1"><FiUsers /></span> 
                    <span>All</span>
                    <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-1">
                      {users.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="mr-1"><FiClock /></span> 
                    <span>Pending</span>
                    <span className="ml-1 text-xs bg-amber-100 text-amber-800 rounded-full px-1">
                      {pendingCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active" 
                    className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="mr-1"><FiActivity /></span> 
                    <span>Active</span>
                    <span className="ml-1 text-xs bg-green-100 text-green-800 rounded-full px-1">
                      {activeCount}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* All Users Tab */}
                <TabsContent value="all">
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user, index) => (
                        <motion.div
                          key={user.username}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          custom={index}
                        >
                          <Card 
                            onClick={() => setSelectedUser(user)} 
                            className="flex flex-col justify-between hover:shadow-lg transition-shadow h-full border border-gray-200 dark:border-gray-700"
                          >
                            <CardHeader className="flex flex-row items-center space-x-3">
                                <Avatar className="border-2 border-indigo-500">
                                  <AvatarImage src={
                                    user.avatar?.includes("googleapis.com/drive/v3/files/")
                                    ? `/api/image-proxy?url=${user.avatar}`
                                    : user.avatar
                                  }
                                  alt={user.username} />
                                  <AvatarFallback className="bg-indigo-100 text-indigo-800">
                                    {user.firstName?.charAt(0) || user.username.charAt(0)}
                                    {user.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base">
                                    {user.firstName} {user.lastName}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    @{user.username}
                                  </CardDescription>
                                </div>
                              </CardHeader>
                              <CardContent className="px-4 pb-4">
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <Badge variant={getBadgeVariant(user.status)} className="text-xs">
                                    {getStatusString(user.status)}
                                  </Badge>
                                  {user.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {user.department}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-3 space-y-1 text-xs">
                                  {user.position && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      Position: {user.position}
                                    </p>
                                  )}
                                  {user.employeeId && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      ID: {user.employeeId}
                                    </p>
                                  )}
                                  <p className="text-gray-500">
                                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </CardContent>
                              <CardFooter className="flex justify-between p-2">
                                <Button size="sm" className="flex items-center">
                                  Send <FiMail />
                                </Button>                              
                                {user.status === 1 && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApprove(user.username);
                                    }}
                                    className="bg-green-100 hover:bg-green-200 text-green-800"
                                  >
                                    <FiBookmark/>Approve
                                  </Button>
                                )}
                              </CardFooter>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Pending Users Tab */}
                <TabsContent value="pending">
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user, index) => (
                        <motion.div
                          key={user.username}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          custom={index}
                        >
                          <Card 
                            onClick={() => setSelectedUser(user)} 
                            className="flex flex-col justify-between hover:shadow-lg transition-shadow h-full border border-amber-200 dark:border-amber-800"
                          >
                            <CardHeader className="flex flex-row items-center space-x-3">
                                <Avatar className="border-2 border-amber-500">
                                  <AvatarImage src={
                                    user.avatar?.includes("googleapis.com/drive/v3/files/")
                                    ? `/api/image-proxy?url=${user.avatar}`
                                    : user.avatar
                                  }
                                  alt={user.username} />
                                  <AvatarFallback className="bg-amber-100 text-amber-800">
                                    {user.firstName?.charAt(0) || user.username.charAt(0)}
                                    {user.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base">
                                    {user.firstName} {user.lastName}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    @{user.username}
                                  </CardDescription>
                                </div>
                              </CardHeader>
                              <CardContent className="px-4 pb-4">
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <Badge variant="warning" className="text-xs">
                                    Pending Approval
                                  </Badge>
                                  {user.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {user.department}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-3 space-y-1 text-xs">
                                  {user.position && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      Position: {user.position}
                                    </p>
                                  )}
                                  {user.employeeId && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      ID: {user.employeeId}
                                    </p>
                                  )}
                                  <p className="text-gray-500">
                                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </CardContent>
                              <CardFooter className="flex justify-between p-2">                              
                              <Button size="sm" className="flex items-center">
                                  Send <FiMail />
                                </Button>                              
                                {user.status === 1 && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApprove(user.username);
                                    }}
                                    className="bg-green-100 hover:bg-green-200 text-green-800"
                                  >
                                    <FiBookmark/>Approve
                                  </Button>
                                )}
                              </CardFooter>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No pending users</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Active Users Tab with Presence Subtabs */}
                <TabsContent value="active">
                  <div className="mt-4">
                    <Tabs 
                      value={activePresenceTab} 
                      onValueChange={(value: string) => setActivePresenceTab(value as PresenceTabValue)}
                      className="mb-6"
                    >
                      <TabsList className="flex justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
                        <TabsTrigger 
                          value="online" 
                          className="flex w-full items-center px-4 py-2 rounded-md data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/50"
                        >
                          <FiWifi />
                          Online
                          <span className="text-xs rounded-full">
                            {onlineCount}
                          </span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="offline" 
                          className="flex w-full items-center py-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 dark:data-[state=active]:bg-gray-800"
                        >
                          <FiWifiOff />
                          Offline
                          <span className="text-xs rounded-full">
                            {offlineCount}
                          </span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="away" 
                          className="flex w-full items-center px-4 py-2 rounded-md data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/50"
                        >
                          <FiCoffee />
                          Away
                          <span className="text-xs rounded-full">
                            {awayCount}
                          </span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentUsers.length > 0 ? (
                        currentUsers.map((user, index) => (
                          <motion.div
                            key={user.username}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={index}
                          >
                            <Card 
                              onClick={() => setSelectedUser(user)} 
                              className="flex flex-col justify-between hover:shadow-lg transition-shadow h-full border border-green-200 dark:border-green-800"
                            >
                              <CardHeader className="flex flex-row items-center space-x-3">
                                <Avatar className="border-2 border-green-500">
                                  <AvatarImage src={
                                    user.avatar?.includes("googleapis.com/drive/v3/files/")
                                    ? `/api/image-proxy?url=${user.avatar}`
                                    : user.avatar
                                  }
                                  alt={user.username} />
                                  <AvatarFallback className="bg-green-100 text-green-800">
                                    {user.firstName?.charAt(0) || user.username.charAt(0)}
                                    {user.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base">
                                    {user.firstName} {user.lastName}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    @{user.username}
                                  </CardDescription>
                                </div>
                              </CardHeader>
                              <CardContent className="px-4 pb-4">
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <Badge variant={getBadgeVariant(user.status)} className="text-xs">
                                    {getStatusString(user.status)}
                                  </Badge>
                                  {user.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {user.department}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-3 space-y-1 text-xs">
                                  {user.position && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      Position: {user.position}
                                    </p>
                                  )}
                                  {user.employeeId && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                      ID: {user.employeeId}
                                    </p>
                                  )}
                                  <p className="text-gray-500">
                                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </CardContent>
                              <CardFooter className="flex justify-between p-2">
                              <Button size="sm" className="flex items-center">
                                  Send <FiMail />
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">
                            {`No ${activePresenceTab} users found`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </CardContent>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onUpdateUser={onUpdateUser} 
            onUserDeleted={onUserDeleted}
          />
        )}
      </AnimatePresence>
    </Card>
  );
};

export default UsersTab;