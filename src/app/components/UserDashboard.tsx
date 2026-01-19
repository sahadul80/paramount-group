"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  User, 
  Message, 
  Group, 
  SSEEvent, 
  UserEventData, 
  MessageEventData, 
  GroupEventData, 
  InitialData,
  TabValue,
  TabState
} from "@/types/users";
import MobileBottomNav from "./user/MobileBottomNav";
import TabContent from "./user/TabContent";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FiUser, 
  FiUsers, 
  FiInbox, 
  FiFolder
} from "react-icons/fi";
import ParamountLoader from "./Loader";
import { userApi, messageApi, groupApi, sseApi } from "@/app/lib/api";

interface TabData {
  [key: string]: TabState;
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("profile");
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  
  const [tabData, setTabData] = useState<TabData>({
    profile: { loaded: true, loading: false },
    users: { loaded: false, loading: false },
    inbox: { loaded: false, loading: false },
    groups: { loaded: false, loading: false },
  });

  const [retryCount, setRetryCount] = useState(0);
  const [tabLoadingProgress, setTabLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refs to keep state fresh inside callbacks
  const usersRef = useRef(users);
  const messagesRef = useRef(messages);
  const groupsRef = useRef(groups);
  const activeTabRef = useRef(activeTab);
  const currentUserRef = useRef(currentUser);
  const selectedUsernameRef = useRef(selectedUsername);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    usersRef.current = users;
    messagesRef.current = messages;
    groupsRef.current = groups;
    activeTabRef.current = activeTab;
    currentUserRef.current = currentUser;
    selectedUsernameRef.current = selectedUsername;
  }, [users, messages, groups, activeTab, currentUser, selectedUsername]);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        toast.error("Failed to load your profile");
      }
    };
    
    fetchCurrentUser();
  }, []);

  /** ----------------------------- SSE HANDLER ----------------------------- **/
  useEffect(() => {
    const cleanup = sseApi.connect({
      onOpen: () => {
        console.log("SSE connection established");
        setRetryCount(0);
      },
      onMessage: (event: SSEEvent) => handleSSEEvent(event),
      onError: () => {
        console.error("SSE error, reconnecting...");
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        setRetryCount(prev => prev + 1);
        toast.error("Connection lost! Reconnecting...");
        return delay;
      }
    });

    return cleanup;
  }, [retryCount]);

  /** ----------------------------- SSE EVENT HANDLER ----------------------------- **/
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "user":
        handleUserEvent(event.data as UserEventData);
        break;
      case "message":
        handleMessageEvent(event.data as MessageEventData);
        break;
      case "group":
        handleGroupEvent(event.data as GroupEventData);
        break;
      case "initial":
        handleInitialData(event.data as InitialData);
        break;
      case "heartbeat":
        // Handle heartbeat if needed
        break;
    }
  }, []);

  /** ----------------------------- EVENT HANDLERS ----------------------------- **/
  const handleUserEvent = useCallback((data: UserEventData) => {
    if (["created", "updated"].includes(data.action) && data.user) {
      setUsers(prev => {
        const userExists = prev.some(u => u.username === data.user?.username);
        const updatedUsers = userExists
          ? prev.map(u => u.username === data.user?.username ? data.user! : u)
          : [...prev, data.user!];
        
        // Update selected user if it's the one being updated
        if (selectedUsernameRef.current === data.user?.username) {
          // This will trigger the selected user to be updated from the users list
        }
        
        // Update currentUser if it's the current user being updated
        if (currentUserRef.current?.username === data.user?.username) {
          setCurrentUser(data.user!);
        }
        
        return updatedUsers;
      });
    } else if (data.action === "deleted" && data.username) {
      setUsers(prev => {
        const filteredUsers = prev.filter(u => u.username !== data.username);
        
        // Clear selected user if it was deleted
        if (selectedUsernameRef.current === data.username) {
          setSelectedUsername(null);
        }
        
        return filteredUsers;
      });
    }
  }, []);

  const handleMessageEvent = useCallback((data: MessageEventData) => {
    if (data.action === "created" && data.message) {
      setMessages(prev => [data.message!, ...prev]);
      if (activeTabRef.current !== "inbox") {
        toast.message(`New Message From: ${data.message?.from}`);
      }
    } else if (data.action === "updated" && data.message) {
      setMessages(prev =>
        prev.map(m => (m.id === data.message?.id ? data.message! : m))
      );
    } else if (data.action === "deleted" && data.messageId) {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }
  }, []);

  const handleGroupEvent = useCallback((data: GroupEventData) => {
    if (data.action === "created" && data.group) {
      setGroups(prev => [...prev, data.group!]);
    } else if (data.action === "updated" && data.group) {
      setGroups(prev =>
        prev.map(g => (g.id === data.group?.id ? data.group! : g))
      );
    } else if (data.action === "deleted" && data.groupId) {
      setGroups(prev => prev.filter(g => g.id !== data.groupId));
    }
  }, []);

  const handleInitialData = useCallback((data: InitialData) => {
    if (data.users) setUsers(data.users);
    if (data.messages) setMessages(data.messages);
    if (data.groups) setGroups(data.groups);
  }, []);

  /** ----------------------------- RESPONSIVENESS ----------------------------- **/
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await userApi.getAllUsers();
      setIsLoading(false);
      
      if (result) {
        setUsers(result);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Failed to load users");
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const result = await messageApi.getMessages();
      if (result) {
        setMessages(result);
      } else {
        toast.error("Failed to fetch messages");
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast.error("Failed to load messages");
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const result = await groupApi.getGroups();
      if (result) {
        setGroups(result);
      } else {
        toast.error("Failed to fetch groups");
      }
    } catch (err) {
      console.error("Fetch groups error:", err);
      toast.error("Failed to load groups");
    }
  }, []);

  /** ----------------------------- TAB REFRESH ----------------------------- **/
  useEffect(() => {
    // Create a new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const refreshTab = async () => {
      const tabKey = activeTab;
      
      // Skip if already loading
      if (tabData[tabKey]?.loading) return;
      
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], loading: true },
      }));

      try {
        // Check if the component is still mounted and request not aborted
        if (signal.aborted) return;

        switch (activeTab) {
          case "users":
            await fetchUsers();
            break;
          case "inbox":
            await fetchMessages();
            break;
          case "groups":
            await fetchGroups();
            break;
          case "profile":
            await fetchUsers();
            break;
        }

        // Check again before updating state
        if (!signal.aborted) {
          setTabData(prev => ({
            ...prev,
            [tabKey]: { loaded: true, loading: false },
          }));
        }
      } catch (error: any) {
        // Only log and show toast if it's not an abort error
        if (error.name !== 'AbortError') {
          console.error(`Failed to refresh ${activeTab} tab:`, error);
          if (!signal.aborted) {
            setTabData(prev => ({
              ...prev,
              [tabKey]: { ...prev[tabKey], loading: false },
            }));
          }
        }
      }
    };

    refreshTab();

    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [activeTab, fetchUsers, fetchMessages, fetchGroups]);

  /** ----------------------------- PROGRESS BAR ----------------------------- **/
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (Object.values(tabData).some(t => t.loading)) {
      interval = setInterval(
        () =>
          setTabLoadingProgress(prev =>
            prev >= 100 ? 100 : prev + 10
          ),
        100
      );
    } else {
      setTabLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [tabData]);

  /** ----------------------------- USER ACTIONS ----------------------------- **/
  const approveUser = async (username: string) => {
    try {
      setIsLoading(true);
      const result = await userApi.updateUserStatus(username, 2);
      setIsLoading(false);
      
      if (result) {
        setUsers(prev =>
          prev.map(u =>
            u.username === username ? { ...u, status: 2 } : u
          )
        );
        toast.success("User activated successfully!");
      } else {
        toast.error("Approval failed");
      }
    } catch (error) {
      console.error("Approve user error:", error);
      toast.error("Approval failed, try again later");
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedUser: User) => {
    try {
      if (!updatedUser.username) throw new Error("Invalid user");
      
      const result : User = await userApi.updateUser(updatedUser.username, updatedUser);
      if (result) {
        setUsers(prev =>
          prev.map(u =>
            u.username === updatedUser.username ? result : u
          )
        );
        
        // Update currentUser state
        setCurrentUser(result);
        return true;
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast.error("Profile update failed");
      return false;
    }
  };

  const handleUserUpdate = async (username: string, updatedUser: Partial<User>) => {
    try {
      if (!username) throw new Error("Invalid user");
      
      const result = await userApi.updateUser(username, updatedUser);
      if (result) {
        setUsers(prev =>
          prev.map(u =>
            u.username === username ? { ...u, ...updatedUser } : u
          )
        );
        
        // Update currentUser if it's the current user
        if (currentUser?.username === username) {
          setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null);
        }
        
        return result;
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast.error("User update failed");
      throw new Error("Update failed");
    }
  };

  const handleUserDeleted = (username: string) => {
    setUsers(prev => prev.filter(u => u.username !== username));
    toast(`User ${username} removed`);
  };

  const sendMessage = async (to: string, content: string) => {
    try {
      const result = await messageApi.sendMessage(to, content);
      if (result) {
        setMessages(prev => [result, ...prev]);
        toast.success("Message sent!");
      } else {
        throw new Error("Send failed");
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  // Get selected user from users list
  const selectedUser = selectedUsername 
    ? users.find(u => u.username === selectedUsername) || null
    : null;

  /** ----------------------------- UNREAD + LOADING ----------------------------- **/
  const unreadMessages = messages.filter(m => !m.read);
  const isTabLoading = Object.values(tabData).some(t => t.loading);

  /** ----------------------------- RENDER ----------------------------- **/
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ParamountLoader />
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-screen overflow-hidden bg-background text-foreground">
      <AnimatePresence>
        {isTabLoading && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-1 bg-secondary/30 z-50 origin-left backdrop-blur-sm"
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

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TabValue)}
        className="flex flex-col max-h-[94vh]"
      >
        {/* Desktop Tabs Header */}
        <div className="sticky top-0 z-30 hidden md:block bg-background/80 backdrop-blur-md">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 mb-2">
            <TabsTrigger 
              value="profile" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200 hover:bg-accent"
            >
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200 hover:bg-accent"
            >
              <FiUsers className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inbox" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200 hover:bg-accent"
            >
              <div className="relative">
                <FiInbox className="w-4 h-4" />
                {unreadMessages.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages.length}
                  </span>
                )}
              </div>
              <span>Inbox</span>
            </TabsTrigger>
            <TabsTrigger 
              value="groups" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200 hover:bg-accent"
            >
              <FiFolder className="w-4 h-4" />
              <span>Groups</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-card shadow-lg h-full flex flex-col overflow-hidden mb-10"
        >
          <div className="flex-1 overflow-auto">
            {isLoading ? <ParamountLoader /> : (
              <TabContent
                activeTab={activeTab}
                tabData={tabData}
                users={users}
                messages={messages}
                groups={groups}
                currentUser={currentUser}
                selectedUser={selectedUser}
                onApproveUser={approveUser}
                onUpdateUser={handleUserUpdate}
                onUserDeleted={handleUserDeleted}
                setMessages={setMessages}
                setGroups={setGroups}
                setCurrentUser={setCurrentUser}
                setSelectedUsername={setSelectedUsername}
                handleProfileUpdate={handleProfileUpdate}
                sendMessage={sendMessage}
              />
            )}
          </div>
        </motion.div>
      </Tabs>
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/80 backdrop-blur-md border-t border-border">
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCount={unreadMessages.length}
        />
      </div>
    </div>
  );
}