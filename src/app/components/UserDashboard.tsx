import React, { useState, useEffect } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { FiUser, FiUsers, FiMail, FiMessageSquare, FiMenu, FiX } from "react-icons/fi";


// Define TypeScript interfaces
interface User {
  username: string;
  email: string;
  role: string;
  status: number; // Changed from string to number
  createdAt: string;
  avatar: string;
  dob?: string; // New field
  address?: string; // New field
  phone?: string; // New field
}

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newMessage, setNewMessage] = useState<{ to: string; content: string }>({ 
    to: '', 
    content: '' 
  });
  const [newGroup, setNewGroup] = useState<{ name: string; members: string[] }>({ 
    name: '', 
    members: [] 
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState({
    users: true,
    currentUser: true,
    messages: true,
    groups: true
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        user.username === username ? { ...user, status: 0 } : user
      ));
      
      alert('User approved successfully!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  // Helper function to convert status number to string
  const getStatusString = (status: number) => {
    switch (status) {
      case 0: return 'inactive';
      case 1: return 'pending';
      default: return 'active';
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
    // In a real app, you would fetch from your messages API
    const fetchMessages = async () => {
      try {
        // Simulate API call
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
    // In a real app, you would fetch from your groups API
    const fetchGroups = async () => {
      try {
        // Simulate API call
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
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: currentUser.username,
          email: currentUser.email,
          avatar: currentUser.avatar,
          dob: currentUser.dob,
          address: currentUser.address,
          phone: currentUser.phone
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  // Send a new message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.content) {
      alert('Please select a recipient and enter a message');
      return;
    }
    
    // In a real app, this would call your messages API
    const newMsg: Message = {
      id: messages.length + 1,
      from: currentUser?.username || 'currentuser',
      to: newMessage.to,
      content: newMessage.content,
      timestamp: new Date().toLocaleString(),
      read: false
    };
    
    setMessages([newMsg, ...messages]);
    setNewMessage({ to: '', content: '' });
    alert('Message sent successfully!');
  };

  // Create a new group
  const createGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name || newGroup.members.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }
    
    // In a real app, this would call your groups API
    const newGrp: Group = {
      id: groups.length + 1,
      name: newGroup.name,
      members: [...newGroup.members, currentUser?.username || 'currentuser'],
      createdBy: currentUser?.username || 'currentuser'
    };
    
    setGroups([newGrp, ...groups]);
    setNewGroup({ name: '', members: [] });
    alert('Group created successfully!');
  };

  // Toggle group member selection
  const toggleGroupMember = (username: string) => {
    if (newGroup.members.includes(username)) {
      setNewGroup({
        ...newGroup,
        members: newGroup.members.filter(m => m !== username)
      });
    } else {
      setNewGroup({
        ...newGroup,
        members: [...newGroup.members, username]
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter unread messages
  const unreadMessages = messages.filter(msg => !msg.read);

  // Mobile tab navigation handler
  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Loading state
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
    <div className="space-y-2 sm:space-y-6">
      {/* Header */}
      <div className="flex gap-3 flex-row sm:items-center sm:justify-between">
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
        <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50 pt-16">
          <div className="flex flex-col space-y-1 p-4">
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
          <Card className="w-auto max-h-[75vh] overflow-auto shadow-sm">
            <CardHeader>
              <CardTitle className='text-xl sm:text-2xl'>My Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold">{currentUser.username}</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{currentUser.email}</p>
                    <Badge className="mt-1" variant={currentUser.status === 0 ? 'success' : 'warning'}>
                      {currentUser.role} • {getStatusString(currentUser.status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <Input 
                      type="text" 
                      value={currentUser.username} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentUser({...currentUser, username: e.target.value})}
                      disabled
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input 
                      type="email" 
                      value={currentUser.email} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentUser({...currentUser, email: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Input 
                      type="text" 
                      value={currentUser.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentUser({...currentUser, address: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input 
                      type="text" 
                      value={currentUser.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentUser({...currentUser, phone: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Input 
                      type="text" 
                      value={currentUser.role} 
                      disabled
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Input 
                      type="text" 
                      value={getStatusString(currentUser.status)} 
                      disabled
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto hover:cursor-pointer">
                    Update Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="w-auto max-h-[75vh] overflow-auto shadow-sm">
            <CardHeader>
              <div className='flex justify-between'>
                <div className='flex flex-col w-2/3 sm:w-full'>
                  <CardTitle className='text-xl sm:text-2xl'>User Directory</CardTitle>
                  <CardDescription>All users in the system</CardDescription>
                </div>
                <div className="w-1/3 sm:w-full">
                  <Input 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading.users ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 gap-1">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>

                  {/* Pending Users Tab */}
                  <TabsContent value="pending">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                      {filteredUsers
                        .filter(user => user.status === 1)
                        .map(user => (
                          <Card key={user.username} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{user.username}</CardTitle>
                                <CardDescription className="text-xs">{user.email}</CardDescription>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {user.role}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getStatusString(user.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between p-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => approveUser(user.username)}
                              >
                                Approve
                              </Button>
                              <Button variant="secondary" size="sm">Message</Button>
                            </CardFooter>
                          </Card>
                        ))}
                        
                      {filteredUsers.filter(user => user.status === 1).length === 0 && (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No pending users found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Users Tab */}
                  <TabsContent value="active">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                      {filteredUsers
                        .filter(user => user.status === 2)
                        .map(user => (
                          <Card key={user.username} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{user.username}</CardTitle>
                                <CardDescription className="text-xs">{user.email}</CardDescription>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {user.role}
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                  {getStatusString(user.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between p-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                View
                              </Button>
                              <Button variant="secondary" size="sm">Message</Button>
                            </CardFooter>
                          </Card>
                        ))}
                        
                      {filteredUsers.filter(user => user.status === 2).length === 0 && (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No active users found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Inactive Users Tab */}
                  <TabsContent value="inactive">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                      {filteredUsers
                        .filter(user => user.status === 0)
                        .map(user => (
                          <Card key={user.username} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{user.username}</CardTitle>
                                <CardDescription className="text-xs">{user.email}</CardDescription>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {user.role}
                                </Badge>
                                <Badge variant="destructive" className="text-xs">
                                  {getStatusString(user.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                            <CardFooter className="flex justify-between p-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                View
                              </Button>
                              <Button variant="secondary" size="sm">Message</Button>
                            </CardFooter>
                          </Card>
                        ))}
                        
                      {filteredUsers.filter(user => user.status === 0).length === 0 && (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No inactive users found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Profile Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedUser.username}'s Profile</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedUser(null)}
                >
                  <FiX size={20} />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold">{selectedUser.username}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedUser.email}</p>
                  <Badge className="mt-1" variant={selectedUser.status === 0 ? 'outline' : 'destructive'}>
                    {selectedUser.role} • {getStatusString(selectedUser.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input 
                    type="text" 
                    value={selectedUser.username} 
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input 
                    type="email" 
                    value={selectedUser.email} 
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Input 
                    type="text" 
                    value={selectedUser.role} 
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Input 
                    type="text" 
                    value={getStatusString(selectedUser.status)} 
                    disabled
                    className="text-sm"
                  />
                </div>
                {selectedUser.dob && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <Input 
                      type="text" 
                      value={selectedUser.dob} 
                      disabled
                      className="text-sm"
                    />
                  </div>
                )}
                {selectedUser.phone && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input 
                      type="text" 
                      value={selectedUser.phone} 
                      disabled
                      className="text-sm"
                    />
                  </div>
                )}
                {selectedUser.address && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Input 
                      type="text" 
                      value={selectedUser.address} 
                      disabled
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Member since: {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Inbox Tab */}
        <TabsContent value="inbox">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            <Card className="lg:w-1/3">
              <CardHeader>
                <CardTitle className='text-xl sm:text-2xl'>Messages</CardTitle>
                <CardDescription>Your conversations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading.messages ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!message.read ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        onClick={() => {
                          // Mark as read
                          if (!message.read) {
                            setMessages(messages.map(m => 
                              m.id === message.id ? {...m, read: true} : m
                            ));
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">{message.from}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                              {message.content}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{message.timestamp.split(' ')[1]}</span>
                        </div>
                        {!message.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:w-2/3">
              <CardHeader>
                <CardTitle className='text-xl sm:text-2xl'>Compose Message</CardTitle>
                <CardDescription>Send a message to another user</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <select 
                      className="w-full p-2 border rounded-md text-sm"
                      value={newMessage.to}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMessage({...newMessage, to: e.target.value})}
                    >
                      <option value="">Select a user</option>
                      {users
                        .filter(user => user.username !== currentUser.username)
                        .map(user => (
                          <option key={user.username} value={user.username}>
                            {user.username} ({user.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea 
                      className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                      value={newMessage.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage({...newMessage, content: e.target.value})}
                      placeholder="Type your message here..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto">
                      Send Message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            <Card className="flex flex-col lg:flex-row gap-4 md:gap-6 w-full max-h-[75vh] overflow-auto shadow-sm p-4">
              <Card className="lg:w-2/3">
                <CardHeader>
                  <CardTitle className='text-xl sm:text-2xl'>Your Groups</CardTitle>
                  <CardDescription>Groups you're part of</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.groups ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groups.map(group => (
                        <Card key={group.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <CardDescription className="text-xs">Created by: {group.createdBy}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {group.members.map(member => (
                                <Badge key={member} variant="secondary" className="text-xs">
                                  {member}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:w-1/3">
                <CardHeader>
                  <CardTitle className='text-xl sm:text-2xl'>Create New Group</CardTitle>
                  <CardDescription>Start a new group conversation</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createGroup} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Group Name</label>
                      <Input 
                        type="text" 
                        placeholder="Enter group name"
                        value={newGroup.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroup({...newGroup, name: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Add Members</label>
                      <div className="border rounded-md p-3 max-h-75 overflow-y-auto text-sm">
                        {loading.users ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          </div>
                        ) : (
                          users
                            .filter(user => user.username !== currentUser.username)
                            .map(user => (
                              <div 
                                key={user.username} 
                                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${newGroup.members.includes(user.username) ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                onClick={() => toggleGroupMember(user.username)}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar} alt={user.username} />
                                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{user.username}</p>
                                  <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                                {newGroup.members.includes(user.username) && (
                                  <span className="ml-auto text-green-500">✓</span>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto border border-border">
                        Create Group
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="grid grid-cols-4">
          <button 
            className={`p-3 flex flex-col items-center justify-center text-sm ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="mb-1"><FiUser /></span>
            <span>Profile</span>
          </button>
          <button 
            className={`p-3 flex flex-col items-center justify-center text-sm ${activeTab === 'users' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="mb-1"><FiUsers /></span>
            <span>Users</span>
          </button>
          <button 
            className={`p-3 flex flex-col items-center justify-center text-sm relative ${activeTab === 'inbox' ? 'text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('inbox')}
          >
            <span className="mb-1"><FiMail /></span>
            <span>Inbox</span>
            {unreadMessages.length > 0 && (
              <span className="absolute top-2 right-5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {unreadMessages.length}
              </span>
            )}
          </button>
          <button 
            className={`p-3 flex flex-col items-center justify-center text-sm ${activeTab === 'groups' ? 'text-primary' : 'text-gray-500'}`}
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