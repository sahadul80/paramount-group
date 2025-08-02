"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FiUser, FiUsers, FiMail, FiMessageSquare, FiMenu, FiX } from "react-icons/fi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import GroupsTab from './user/GroupsTab';
import InboxTab from './user/InboxTab';
import ProfileTab from './user/ProfileTab';
import UsersTab from './user/UsersTab';
import { User } from '@/types/users';
import { useToast } from "./ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Group {
  id: number;
  name: string;
  members: string[];
  createdBy: string;
}

type TabValue = 'profile' | 'users' | 'inbox' | 'groups';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tabData, setTabData] = useState({
    users: { loaded: false, loading: false },
    inbox: { loaded: false, loading: false },
    groups: { loaded: false, loading: false }
  });
  const { toast } = useToast();

  // Approve user function
  const approveUser = async (username: string) => {
    try {
      const response = await fetch('/api/user/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          status: 2 // Set to active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      // Update local state
      setUsers(users.map(user => 
        user.username === username ? { ...user, status: 2 } : user
      ));
      
      toast({
        title: "User Approved",
        description: "User has been activated successfully!",
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Approval Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const username = localStorage.getItem("user");
        if (!username) {
          throw new Error('No user found in local storage');
        }
        
        const response = await fetch('/api/user/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }
        
        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Load tab data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      switch (activeTab) {
        case 'users':
          if (!tabData.users.loaded && !tabData.users.loading) {
            setTabData(prev => ({ ...prev, users: { ...prev.users, loading: true }}));
            await fetchUsers();
            setTabData(prev => ({ ...prev, users: { loaded: true, loading: false }}));
          }
          break;
        
        case 'inbox':
          if (!tabData.inbox.loaded && !tabData.inbox.loading) {
            setTabData(prev => ({ ...prev, inbox: { ...prev.inbox, loading: true }}));
            await fetchMessages();
            setTabData(prev => ({ ...prev, inbox: { loaded: true, loading: false }}));
          }
          break;
        
        case 'groups':
          if (!tabData.groups.loaded && !tabData.groups.loading) {
            setTabData(prev => ({ ...prev, groups: { ...prev.groups, loading: true }}));
            await fetchGroups();
            setTabData(prev => ({ ...prev, groups: { loaded: true, loading: false }}));
          }
          break;
      }
    };

    loadTabData();
  }, [activeTab]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user/all');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Data Load Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const messagesData: Message[] = [
        { id: 1, from: 'janedoe', to: 'johndoe', content: 'Can you review the quarterly report?', timestamp: '2023-06-15 10:30', read: true },
        { id: 2, from: 'bobsmith', to: 'johndoe', content: 'Meeting scheduled for tomorrow', timestamp: '2023-06-16 14:15', read: false },
        { id: 3, from: 'alicej', to: 'johndoe', content: 'Supply data has been updated', timestamp: '2023-06-17 09:45', read: true },
        { id: 4, from: 'mikeross', to: 'johndoe', content: 'Demand forecast for next month', timestamp: '2023-06-18 16:20', read: false },
      ];
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Data Load Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const groupsData: Group[] = [
        { id: 1, name: 'Management Team', members: ['johndoe', 'janedoe', 'bobsmith'], createdBy: 'johndoe' },
        { id: 2, name: 'Supply Chain', members: ['johndoe', 'alicej'], createdBy: 'alicej' },
        { id: 3, name: 'Sales Forecast', members: ['johndoe', 'mikeross'], createdBy: 'mikeross' },
      ];
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Data Load Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
    }
  };

  // Update user profile
  const handleProfileUpdate = async (updatedUser: User) => {
    try {
      // Ensure username exists
      if (!updatedUser.username) {
        throw new Error("User does not have a username");
      }
      
      await updateUser(updatedUser.username, updatedUser);
  
      // Fetch latest version from backend
      const response = await fetch('/api/user/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: updatedUser.username }),
      });
  
      if (!response.ok) throw new Error("Failed to refresh current user");
  
      const latestUser = await response.json();
      setCurrentUser(latestUser);
  
      // Update users list
      setUsers(prev => prev.map(u =>
        u.username === latestUser.username ? latestUser : u
      ));
  
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: "Could not update profile",
        variant: "destructive"
      });
      return false;
    }
  };  

  const updateUser = async (username: string, updateData: Partial<User>) => {
    try {
      if (!username) {
        throw new Error("Username is required for update");
      }
      
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          ...updateData
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to update user');
      } else {
        await fetchUsers();
        toast({
          title: "Profile Updated",
          description: "User information has been updated",
        });
      }
  
      return await users;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Handle user deletion
  const handleUserDeleted = (username: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.username !== username));
    toast({
      title: "User Deleted",
      description: `User ${username} has been removed`,
    });
  };

  // Mobile bottom navigation unread badge count
  const unreadMessages = messages.filter(msg => !msg.read);

  // Mobile tab navigation handler
  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Loading state for initial user
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your dashboard...</p>
          <p className="text-sm text-gray-500">Preparing your personalized experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-0 md:py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            User Dashboard
          </motion.h2>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => setActiveTab(value as TabValue)} 
        className="space-y-4"
      >
        {/* Desktop Tabs */}
        <TabsList className={`hidden md:flex w-full gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1`}>
          <TabsTrigger 
            value="profile" 
            className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <span className="mr-2"><FiUser /></span> 
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <span className="mr-2"><FiUsers /></span> 
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="inbox" 
            className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <div className="flex items-center">
              <span className="mr-2"><FiMail /></span>
              <span>Inbox</span>
              {tabData.inbox.loaded && unreadMessages.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{unreadMessages.length}</Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="groups" 
            className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <span className="mr-2"><FiMessageSquare /></span> 
            <span>Groups</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <TabsContent value="profile">
                  <ProfileTab 
                    currentUser={currentUser} 
                    setCurrentUser={setCurrentUser} 
                    handleProfileUpdate={handleProfileUpdate} 
                  />
                </TabsContent>
              )}
              
              {activeTab === 'users' && (
                <TabsContent value="users">
                  {tabData.users.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <UsersTab 
                      users={users} 
                      loading={tabData.users.loading} 
                      onApprove={approveUser}
                      onUpdateUser={updateUser}
                      onUserDeleted={handleUserDeleted}
                    />
                  )}
                </TabsContent>
              )}
              
              {activeTab === 'inbox' && (
                <TabsContent value="inbox">
                  {tabData.inbox.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <InboxTab 
                      messages={messages} 
                      setMessages={setMessages} 
                      loading={tabData.inbox.loading} 
                      currentUser={currentUser} 
                      users={users} 
                    />
                  )}
                </TabsContent>
              )}
              
              {activeTab === 'groups' && (
                <TabsContent value="groups">
                  {tabData.groups.loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <GroupsTab 
                      groups={groups} 
                      setGroups={setGroups} 
                      loading={tabData.groups.loading} 
                      users={users} 
                      currentUser={currentUser} 
                    />
                  )}
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>

      {/* Mobile Bottom Navigation */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 shadow-lg"
      >
        <div className="grid grid-cols-4 gap-1 p-1">
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-xl ${
              activeTab === 'profile' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser className="text-lg mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-xl ${
              activeTab === 'users' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers className="text-lg mb-1" />
            <span className="text-xs">Users</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-xl relative ${
              activeTab === 'inbox' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('inbox')}
          >
            <FiMail className="text-lg mb-1" />
            <span className="text-xs">Inbox</span>
            {tabData.inbox.loaded && unreadMessages.length > 0 && (
              <span className="absolute top-2 right-4 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {unreadMessages.length}
              </span>
            )}
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-xl ${
              activeTab === 'groups' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('groups')}
          >
            <FiMessageSquare className="text-lg mb-1" />
            <span className="text-xs">Groups</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;