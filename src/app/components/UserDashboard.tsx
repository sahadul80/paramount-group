// components/user/UserDashboard.tsx
"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs } from './ui/tabs';
import { User, Message, Group } from '@/types/users';
import DesktopTabs from './user/DesktopTabs';
import MobileBottomNav from './user/MobileBottomNav';
import TabContent from './user/TabContent';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

export type TabValue = 'profile' | 'users' | 'inbox' | 'groups';

type EventType = 'user' | 'message' | 'group' | 'initial' | 'heartbeat';
interface SSEEvent {
  type: EventType;
  data: any;
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tabData, setTabData] = useState({
    profile: { loaded: true, loading: false },
    users: { loaded: false, loading: false },
    inbox: { loaded: false, loading: false },
    groups: { loaded: false, loading: false }
  });
  const [retryCount, setRetryCount] = useState(0);
  const [tabLoadingProgress, setTabLoadingProgress] = useState(0);
  
  // Use refs to store the latest state and handlers
  const usersRef = useRef(users);
  const messagesRef = useRef(messages);
  const groupsRef = useRef(groups);
  const activeTabRef = useRef(activeTab);
  const currentUserRef = useRef(currentUser);

  // Update refs when state changes
  useEffect(() => {
    usersRef.current = users;
    messagesRef.current = messages;
    groupsRef.current = groups;
    activeTabRef.current = activeTab;
    currentUserRef.current = currentUser;
  }, [users, messages, groups, activeTab, currentUser]);

  // SSE connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/user/stream');

      eventSource.onmessage = (event) => {
        try {
          const parsedData: SSEEvent = JSON.parse(event.data);
          
          switch (parsedData.type) {
            case 'user':
              handleUserEvent(parsedData.data);
              break;
            case 'message':
              handleMessageEvent(parsedData.data);
              break;
            case 'group':
              handleGroupEvent(parsedData.data);
              break;
            case 'initial':
              handleInitialData(parsedData.data);
              break;
            case 'heartbeat':
              // Just keep the connection alive, no action needed
              break;
            default:
              console.warn('Unknown SSE event type:', parsedData.type);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // Close the current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Try to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        setRetryCount(prev => prev + 1);
        
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
        
        toast.error("Connection Error! Real-time updates disconnected. Trying to reconnect...");
      };

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setRetryCount(0); // Reset retry count on successful connection
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [retryCount]);

  // Event handlers that use refs to access latest state
  const handleUserEvent = useCallback((data: any) => {
    if (data.action === 'created' || data.action === 'updated') {
      setUsers(prev => {
        const existing = prev.find(u => u.username === data.user.username);
        if (existing) {
          return prev.map(u => u.username === data.user.username ? data.user : u);
        }
        return [...prev, data.user];
      });
      
      // Update current user if the updated user is the current user
      if (currentUserRef.current && data.user.username === currentUserRef.current.username) {
        setCurrentUser(data.user);
      }
    } else if (data.action === 'deleted') {
      setUsers(prev => prev.filter(u => u.username !== data.username));
    }
  }, []);

  const handleMessageEvent = useCallback((data: any) => {
    if (data.action === 'created') {
      setMessages(prev => [data.message, ...prev]);
      if (activeTabRef.current !== 'inbox') {
        toast.message(`New Message From: ${data.message.from}`);
      }
    } else if (data.action === 'updated') {
      setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
    } else if (data.action === 'deleted') {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }
  }, []);

  const handleGroupEvent = useCallback((data: any) => {
    if (data.action === 'created') {
      setGroups(prev => [...prev, data.group]);
    } else if (data.action === 'updated') {
      setGroups(prev => prev.map(g => g.id === data.group.id ? data.group : g));
    } else if (data.action === 'deleted') {
      setGroups(prev => prev.filter(g => g.id !== data.groupId));
    }
  }, []);

  const handleInitialData = useCallback((data: any) => {
    if (data.users) setUsers(data.users);
    if (data.messages) setMessages(data.messages);
    if (data.groups) setGroups(data.groups);
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const username = localStorage.getItem("user");
        if (!username) throw new Error('No user found in local storage');
        const response = await fetch('/api/user/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (!response.ok) throw new Error('Failed to fetch current user');
        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error("Failed to load user data");
      }
    };
    fetchCurrentUser();
  }, []);

  // Tab loading progress animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (Object.values(tabData).some(tab => tab.loading)) {
      // Start progress animation when any tab is loading
      progressInterval = setInterval(() => {
        setTabLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    } else {
      // Reset progress when loading is complete
      setTabLoadingProgress(0);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [tabData]);

  // Refresh data when tab changes
  useEffect(() => {
    const refreshTabData = async () => {
      setTabData(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], loading: true } }));
      
      try {
        switch (activeTab) {
          case 'users':
            await fetchUsers();
            break;
          case 'inbox':
            await fetchMessages();
            break;
          case 'groups':
            await fetchGroups();
            break;
          case 'profile':
            // For profile tab, refresh the current user data
            await fetchCurrentUser();
            break;
        }
        setTabData(prev => ({ ...prev, [activeTab]: { loaded: true, loading: false } }));
      } catch (error) {
        setTabData(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], loading: false } }));
      }
    };
    
    refreshTabData();
  }, [activeTab]);

  // Fetch current user function
  const fetchCurrentUser = async () => {
    try {
      const username = localStorage.getItem("user");
      if (!username) throw new Error('No user found in local storage');
      const response = await fetch('/api/user/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!response.ok) throw new Error('Failed to fetch current user');
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error fetching current user:', error);
      toast.error("Failed to load user data");
    }
  };

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
      toast.error("Failed to load users");
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/user/messages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const messagesData = await response.json();
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error("Failed to load messages");
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/user/groups');
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const groupsData = await response.json();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to load groups");
    }
  };

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
      
      toast.success("User has been activated successfully!");
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error("Approval Failed! Please try again later");
    }
  };

  // Update user
  const updateUser = async (username: string, updateData: Partial<User>): Promise<User[]> => {
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
      }

      // Fetch updated users list
      await fetchUsers();
      
      toast.success("User information has been updated");

      return users;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Error updating user!");
      throw error;
    }
  };

  // Update user profile
  const handleProfileUpdate = async (updatedUser: User) => {
    try {
      // Ensure username exists
      if (!updatedUser.username) {
        throw new Error("User does not have a username");
      }
      
      const updatedUsers = await updateUser(updatedUser.username, updatedUser);
      
      // Find the updated user in the returned array
      const latestUser = updatedUsers.find(u => u.username === updatedUser.username);
      
      if (latestUser) {
        setCurrentUser(latestUser);
      }

      return true;
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Update Failed! Could not update profile");
      return false;
    }
  };  

  // Handle user deletion
  const handleUserDeleted = (username: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.username !== username));
    toast(`User ${username} has been removed`);
  };

  // Send message function
  const sendMessage = async (toUsername: string, content: string) => {
    try {
      const response = await fetch('/api/user/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: toUsername,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [newMessage, ...prev]);
      
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  // Mobile bottom navigation unread badge count
  const unreadMessages = messages.filter(msg => !msg.read);

  // Check if any tab is currently loading
  const isTabLoading = Object.values(tabData).some(tab => tab.loading);

  // Loading state for initial user
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="">

      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as TabValue)}
        className="space-y-4 relative"
      >
        {/* Make DesktopTabs sticky */}
        <div className="sticky top-20 z-10 bg-background pt-2 pb-2">
          <DesktopTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadCount={unreadMessages.length}
          />
        </div>

        <AnimatePresence>
          {isTabLoading && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 origin-left"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${tabLoadingProgress}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always render content, but show overlay when loading */}
        <div className="relative">
          <TabContent
            key={activeTab}
            activeTab={activeTab}
            tabData={tabData}
            users={users}
            messages={messages}
            groups={groups}
            currentUser={currentUser}
            onApproveUser={approveUser}
            onUpdateUser={updateUser}
            onUserDeleted={handleUserDeleted}
            setMessages={setMessages}
            setGroups={setGroups}
            setCurrentUser={setCurrentUser}
            handleProfileUpdate={handleProfileUpdate}
          />

          {tabData[activeTab].loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 dark:bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 animate-spin border-4 border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </Tabs>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadCount={unreadMessages.length} 
      />
    </div>
  );
}