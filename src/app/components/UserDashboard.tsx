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
  const [loading, setLoading] = useState({
    users: true,
    currentUser: true,
    messages: true,
    groups: true
  });

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
      
      alert('User approved successfully!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
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
        const username = localStorage.getItem("user"); // Get username from local storage
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
      } finally {
        setLoading(prev => ({ ...prev, currentUser: false }));
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
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
      } finally {
        setLoading(prev => ({ ...prev, users: false }));
      }
    };

    fetchUsers();
  }, []);

  // Fetch messages (placeholder implementation)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setTimeout(() => {
          const messagesData: Message[] = [
            { id: 1, from: 'janedoe', to: 'johndoe', content: 'Can you review the quarterly report?', timestamp: '2023-06-15 10:30', read: true },
            { id: 2, from: 'bobsmith', to: 'johndoe', content: 'Meeting scheduled for tomorrow', timestamp: '2023-06-16 14:15', read: false },
            { id: 3, from: 'alicej', to: 'johndoe', content: 'Supply data has been updated', timestamp: '2023-06-17 09:45', read: true },
            { id: 4, from: 'mikeross', to: 'johndoe', content: 'Demand forecast for next month', timestamp: '2023-06-18 16:20', read: false },
          ];
          setMessages(messagesData);
          setLoading(prev => ({ ...prev, messages: false }));
        }, 500);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };

    fetchMessages();
  }, []);

  // Fetch groups (placeholder implementation)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setTimeout(() => {
          const groupsData: Group[] = [
            { id: 1, name: 'Management Team', members: ['johndoe', 'janedoe', 'bobsmith'], createdBy: 'johndoe' },
            { id: 2, name: 'Supply Chain', members: ['johndoe', 'alicej'], createdBy: 'alicej' },
            { id: 3, name: 'Sales Forecast', members: ['johndoe', 'mikeross'], createdBy: 'mikeross' },
          ];
          setGroups(groupsData);
          setLoading(prev => ({ ...prev, groups: false }));
        }, 500);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setLoading(prev => ({ ...prev, groups: false }));
      }
    };

    fetchGroups();
  }, []);

  // Update user profile
  const handleProfileUpdate = async (updatedUser: User) => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          dob: updatedUser.dob,
          address: updatedUser.address,
          phone: updatedUser.phone,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          gender: updatedUser.gender,
          department: updatedUser.department,
          position: updatedUser.position,
          employeeId: updatedUser.employeeId,
          nationality: updatedUser.nationality,
          salary: updatedUser.salary,
          bloodGroup: updatedUser.bloodGroup
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      alert('Profile updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
      return false;
    }
  };

  const updateUser = async (username: string, updateData: Partial<User>) => {
    try {
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
      }

      // Update local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.username === username ? { ...user, ...updateData } : user
      ));

      // If the updated user is the current user, update currentUser state
      if (currentUser?.username === username) {
        setCurrentUser(prev => prev ? { ...prev, ...updateData } : null);
      }

      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  // Mobile bottom navigation unread badge count
  const unreadMessages = messages.filter(msg => !msg.read);

  // Mobile tab navigation handler
  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Loading state for initial user
  if (loading.currentUser || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading user dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-0 md:py-4">
      {/* Header */}
      <div className="flex gap-1 flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">User Dashboard</h2>
        <Button 
          variant="outline" 
          className="hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50">
          <div className="flex flex-col space-y-1">
            <Button 
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => handleTabChange('profile')}
            >
              <span className="mr-3"><FiUser /></span> My Profile
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => handleTabChange('users')}
            >
              <span className="mr-3"><FiUsers /></span> All Users
            </Button>
            <Button 
              variant={activeTab === 'inbox' ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => handleTabChange('inbox')}
            >
              <div className="flex items-center">
                <span className="mr-3"><FiMail /></span> 
                Inbox 
                {unreadMessages.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadMessages.length}</Badge>
                )}
              </div>
            </Button>
            <Button 
              variant={activeTab === 'groups' ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => handleTabChange('groups')}
            >
              <span className="mr-3"><FiMessageSquare /></span> Groups
            </Button>
          </div>
        </div>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={(value: string) => setActiveTab(value as TabValue)} 
        className="space-y-4"
      >
        {/* Desktop Tabs */}
        <TabsList className={`hidden md:grid md:grid-cols-4 w-full gap-1`}>
          <TabsTrigger value="profile" className="flex items-center">
            <span className="mr-2 hidden md:inline"><FiUser /></span> My Profile
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <span className="mr-2 hidden md:inline"><FiUsers /></span> All Users
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center">
            <span className="mr-2 hidden md:inline"><FiMail /></span>
            Inbox {unreadMessages.length > 0 && (
              <Badge className="mr-4 bg-red-500 text-white">{unreadMessages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center">
            <span className="mr-2 hidden md:inline"><FiMessageSquare /></span> Groups
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileTab 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            handleProfileUpdate={handleProfileUpdate} 
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersTab 
            users={users} 
            loading={loading.users} 
            onApprove={approveUser}
            onUpdateUser={updateUser}
          />
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox">
          <InboxTab 
            messages={messages} 
            setMessages={setMessages} 
            loading={loading.messages} 
            currentUser={currentUser} 
            users={users} 
          />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <GroupsTab 
            groups={groups} 
            setGroups={setGroups} 
            loading={loading.groups} 
            users={users} 
            currentUser={currentUser} 
          />
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="grid grid-cols-4">
          <button 
            className={`p-2 flex flex-col items-center justify-center text-sm ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="mb-1"><FiUser /></span>
            <span>Profile</span>
          </button>
          <button 
            className={`p-2 flex flex-col items-center justify-center text-sm ${activeTab === 'users' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="mb-1"><FiUsers /></span>
            <span>Users</span>
          </button>
          <button 
            className={`p-2 flex flex-col items-center justify-center text-sm relative ${activeTab === 'inbox' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('inbox')}
          >
            <span className="mb-1"><FiMail /></span>
            <span>Inbox</span>
            {unreadMessages.length > 0 && (
              <span className="absolute top-1 right-12 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {unreadMessages.length}
              </span>
            )}
          </button>
          <button 
            className={`p-2 flex flex-col items-center justify-center text-sm ${activeTab === 'groups' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('groups')}
          >
            <span className="mb-1"><FiMessageSquare /></span>
            <span>Groups</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
