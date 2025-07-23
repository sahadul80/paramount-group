import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import UserProfileModal from './UserProfileModal';
import { User } from '@/types/users';
import { FiMail } from 'react-icons/fi';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

// Define status tab values type
type StatusTabValue = 'all' | 'pending' | 'active' | 'inactive' | 'away' | 'offline' | 'online';

interface UsersTabProps {
  users: User[];
  loading: boolean;
  onApprove: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, loading, onApprove, onUpdateUser }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusTabValue>('all');
  
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
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter users by status for each tab (only when not searching)
  const getUsersByStatus = (status: number) => {
    return filteredUsers.filter(user => user.status === status);
  };

  const statusFilters = [
    { value: 'pending', status: 1, label: 'Pending', variant: 'warning' as const },
    { value: 'active', status: 2, label: 'Active', variant: 'success' as const },
    { value: 'inactive', status: 0, label: 'Inactive', variant: 'destructive' as const },
    { value: 'away', status: 3, label: 'Away', variant: 'secondary' as const },
    { value: 'offline', status: 4, label: 'Offline', variant: 'outline' as const },
    { value: 'online', status: 5, label: 'Online', variant: 'default' as const },
  ];

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

  return (
    <Card className="fixed w-auto max-h-[80vh] overflow-auto shadow-sm">
      <CardHeader>
        <div className='flex flex-col sm:flex-row justify-between gap-4'>
          <div className='flex flex-col'>
            <CardTitle className='text-md sm:text-xl'>User Directory</CardTitle>
            <CardDescription>All users in the system</CardDescription>
          </div>
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </CardHeader>
      
      <CardContent className="mb-20">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Show search results as a single list when search term exists */}
            {searchTerm && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    Search Results for "{searchTerm}" 
                    <span className="text-muted-foreground ml-2">
                      ({filteredUsers.length} {filteredUsers.length === 1 ? 'match' : 'matches'})
                    </span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <Card key={user.username} className="hover:shadow-md transition-shadow h-full">
                        <CardHeader className="flex flex-row items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.username} />
                            <AvatarFallback>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View
                          </Button>
                          
                          {user.status === 1 && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => onApprove(user.username)}
                            >
                              Approve
                            </Button>
                          )}
                          
                          <Button variant="secondary" size="sm">Message</Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No users found matching your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Show status tabs only when not searching */}
            {!searchTerm && (
              <Tabs 
                value={activeStatus} 
                onValueChange={(value: string) => setActiveStatus(value as any)}
                className="w-full"
              >
                {/* Desktop Tabs */}
                <TabsList className="hidden md:flex flex-row justify-between gap-1">
                  <TabsTrigger value="all" className="text-xs md:text-sm">
                    All
                    <span className="ml-1 text-xs">({filteredUsers.length})</span>
                  </TabsTrigger>
                  {statusFilters.map(filter => (
                    <TabsTrigger 
                      key={filter.value} 
                      value={filter.value}
                      className="text-xs md:text-sm"
                    >
                      {filter.label}
                      <span className="ml-1 text-xs">({getUsersByStatus(filter.status).length})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* Mobile Filter Dropdown */}
                <div className="md:hidden w-full">
                  <Select 
                    value={activeStatus}
                    onValueChange={(value: StatusTabValue) => setActiveStatus(value)}
                  >
                    <SelectTrigger className="w-full text-left">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-black/10">
                      <SelectItem value="all">
                        All ({filteredUsers.length})
                      </SelectItem>
                      {statusFilters.map(filter => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label} ({getUsersByStatus(filter.status).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* All Users Tab */}
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-3 mt-4">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        // User card - same as in other tabs
                        <Card key={user.username} className="flex flex-col justify-between hover:shadow-lg transition-shadow h-full">
                          <CardHeader className="flex flex-row items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                View
                              </Button>
                              
                              {user.status === 1 && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => onApprove(user.username)}
                                >
                                  Approve
                                </Button>
                              )}
                              
                              <Button><FiMail /></Button>
                            </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Status Tabs */}
                {statusFilters.map(filter => (
                  <TabsContent key={filter.value} value={filter.value}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
                      {getUsersByStatus(filter.status).length > 0 ? (
                        getUsersByStatus(filter.status).map(user => (
                          <Card key={user.username} className="flex flex-col justify-between hover:shadow-lg transition-shadow h-full">
                            <CardHeader className="flex flex-row items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                View
                              </Button>
                              
                              {user.status === 1 && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => onApprove(user.username)}
                                >
                                  Approve
                                </Button>
                              )}
                              
                              <Button><FiMail /></Button>
                            </CardFooter>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">
                            {`No ${filter.label.toLowerCase()} users found`}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}
      </CardContent>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdateUser={onUpdateUser} />
      )}
    </Card>
  );
};

export default UsersTab;