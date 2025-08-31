// components/user/UsersTab.tsx
"use client"
import React, { useState } from 'react';
import { 
  FiUser, FiUsers, FiClock, FiActivity, 
  FiWifi, FiWifiOff, FiCoffee, FiSearch, 
  FiMail, FiBookmark
} from 'react-icons/fi';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import UserProfileModal from './UserProfileModal';
import { User } from '@/types/users';
import { motion, AnimatePresence } from 'framer-motion';

type StatusTabValue = 'all' | 'pending' | 'active';
type PresenceTabValue = 'online' | 'offline' | 'away';

interface UsersTabProps {
  users: User[];
  loading: boolean;
  onApprove: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => Promise<User[]>;
  onUserDeleted: (username: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ users, loading, onApprove, onUpdateUser, onUserDeleted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<StatusTabValue>('all');
  const [activePresenceTab, setActivePresenceTab] = useState<PresenceTabValue>('online');

  const getStatusString = (status: number) => {
    switch(status){
      case 0: return 'inactive';
      case 1: return 'pending';
      case 2: return 'active';
      case 3: return 'away';
      case 4: return 'offline';
      case 5: return 'online';
      default: return 'unknown';
    }
  }

  const getBadgeVariant = (status: number) => {
    switch(status){
      case 0: return 'destructive';
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'secondary';
      case 4: return 'outline';
      case 5: return 'success';
      default: return 'default';
    }
  }

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term)
    );
  });

  const getUsersForTab = () => {
    if (searchTerm) return filteredUsers;

    switch(activeMainTab){
      case 'pending': 
        return users.filter(u => u.status === 1);
      case 'active':
        switch(activePresenceTab){
          case 'online': return users.filter(u => u.status === 5);
          case 'offline': return users.filter(u => u.status === 4);
          case 'away': return users.filter(u => u.status === 3);
          default: return users.filter(u => u.status === 2 || u.status === 3 || u.status === 4 || u.status === 5);
        }
      default: 
        return users;
    }
  }

  const currentUsers = getUsersForTab();
  const pendingCount = users.filter(u => u.status === 1).length;
  const onlineCount = users.filter(u => u.status === 5).length;
  const offlineCount = users.filter(u => u.status === 4).length;
  const awayCount = users.filter(u => u.status === 3).length;
  const activeCount = users.filter(u => u.status === 2 || u.status === 3 || u.status === 4 || u.status === 5).length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i:number) => ({ opacity: 1, y:0, transition: { delay: i*0.05, duration:0.3 } })
  }

  const UserCard = ({ user, index, showApprove = false }: { user: User, index: number, showApprove?: boolean }) => (
    <motion.div key={user.username} variants={cardVariants} initial="hidden" animate="visible" custom={index}>
      <Card 
        onClick={() => setSelectedUser(user)} 
        className="flex flex-col justify-between hover:shadow-md transition-shadow h-full border border-gray-200 dark:border-gray-700"
      >
        <CardHeader className="flex flex-row items-center space-x-3">
          <Avatar className="border-2 border-indigo-500">
            <AvatarImage src={user.avatar || ""} alt={user.username}/>
            <AvatarFallback className="bg-indigo-100 text-indigo-800">
              {user.firstName?.charAt(0) || user.username.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{user.firstName} {user.lastName}</CardTitle>
            <CardDescription className="text-xs">@{user.username}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">{user.role}</Badge>
            <Badge variant={getBadgeVariant(user.status)} className="text-xs">{getStatusString(user.status)}</Badge>
            {user.department && <Badge variant="outline" className="text-xs">{user.department}</Badge>}
          </div>
          <div className="mt-3 space-y-1 text-xs">
            {user.position && <p className="text-gray-600 dark:text-gray-400">Position: {user.position}</p>}
            {user.employeeId && <p className="text-gray-600 dark:text-gray-400">ID: {user.employeeId}</p>}
            <p className="text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-2">
          <Button size="sm" className="flex items-center"><FiMail/> Send</Button>
          {showApprove && user.status === 1 && (
            <Button 
              size="sm" 
              variant="default" 
              className="bg-green-100 hover:bg-green-200 text-green-800" 
              onClick={e => { e.stopPropagation(); onApprove(user.username); }}
            >
              <FiBookmark/> Approve
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <Card className="overflow-auto shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col">
            <CardTitle className="text-md sm:text-xl">User Directory</CardTitle>
            <CardDescription>Manage all users in the system</CardDescription>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-2 top-5 transform -translate-y-1/2 text-gray-400"/>
            <Input 
              placeholder="Search users..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
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
            {searchTerm ? (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, i) => (
                    <UserCard key={user.username} user={user} index={i} showApprove={true} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">No users found</div>
                )}
              </div>
            ) : (
              <Tabs value={activeMainTab} onValueChange={v => setActiveMainTab(v as StatusTabValue)}>
                <div className="sticky top-20 z-20 bg-transparent pt-2 pb-2">
                  <TabsList className="flex bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <TabsTrigger value="all" className="flex-1 flex justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FiUsers className="mr-1"/> All <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-1">{users.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1 flex justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FiClock className="mr-1"/> Pending <span className="ml-1 text-xs bg-amber-100 text-amber-800 rounded-full px-1">{pendingCount}</span>
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex-1 flex justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FiActivity className="mr-1"/> Active <span className="ml-1 text-xs bg-green-100 text-green-800 rounded-full px-1">{activeCount}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.length > 0 ? (
                      users.map((user, i) => (
                        <UserCard key={user.username} user={user} index={i} />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">No users found</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.filter(u => u.status === 1).length > 0 ? (
                      users.filter(u => u.status === 1).map((user, i) => (
                        <UserCard key={user.username} user={user} index={i} showApprove={true} />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">No pending users</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="active" className="mt-4">
                  <Tabs value={activePresenceTab} onValueChange={v => setActivePresenceTab(v as PresenceTabValue)} className="mb-4">
                    <TabsList className="flex justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
                      <TabsTrigger value="online" className="flex-1 flex items-center justify-center data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/50">
                        <FiWifi className="mr-1"/> Online <span className="ml-1 text-xs rounded-full">{onlineCount}</span>
                      </TabsTrigger>
                      <TabsTrigger value="offline" className="flex-1 flex items-center justify-center data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 dark:data-[state=active]:bg-gray-800">
                        <FiWifiOff className="mr-1"/> Offline <span className="ml-1 text-xs rounded-full">{offlineCount}</span>
                      </TabsTrigger>
                      <TabsTrigger value="away" className="flex-1 flex items-center justify-center data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/50">
                        <FiCoffee className="mr-1"/> Away <span className="ml-1 text-xs rounded-full">{awayCount}</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user, i) => (
                        <UserCard key={user.username} user={user} index={i} />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">No {activePresenceTab} users found</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </CardContent>

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
}

export default UsersTab;