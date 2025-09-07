"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Message, Group } from "@/types/users";
import MobileBottomNav from "./user/MobileBottomNav";
import TabContent from "./user/TabContent";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FiUser, 
  FiUsers, 
  FiInbox, 
  FiFolder,
  FiMenu 
} from "react-icons/fi";

export type TabValue = "profile" | "users" | "inbox" | "groups";
type EventType = "user" | "message" | "group" | "initial" | "heartbeat";

interface SSEEvent {
  type: EventType;
  data: any;
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("profile");
  const [isMobile, setIsMobile] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [tabData, setTabData] = useState({
    profile: { loaded: true, loading: false },
    users: { loaded: false, loading: false },
    inbox: { loaded: false, loading: false },
    groups: { loaded: false, loading: false },
  });

  const [retryCount, setRetryCount] = useState(0);
  const [tabLoadingProgress, setTabLoadingProgress] = useState(0);

  // Refs to keep state fresh inside callbacks
  const usersRef = useRef(users);
  const messagesRef = useRef(messages);
  const groupsRef = useRef(groups);
  const activeTabRef = useRef(activeTab);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    usersRef.current = users;
    messagesRef.current = messages;
    groupsRef.current = groups;
    activeTabRef.current = activeTab;
    currentUserRef.current = currentUser;
  }, [users, messages, groups, activeTab, currentUser]);

  /** ----------------------------- SSE HANDLER ----------------------------- **/
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource("/api/user/stream");

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setRetryCount(0);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: SSEEvent = JSON.parse(event.data);
          switch (parsed.type) {
            case "user":
              handleUserEvent(parsed.data);
              break;
            case "message":
              handleMessageEvent(parsed.data);
              break;
            case "group":
              handleGroupEvent(parsed.data);
              break;
            case "initial":
              handleInitialData(parsed.data);
              break;
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      eventSource.onerror = () => {
        console.error("SSE error, reconnecting...");
        eventSource?.close();
        eventSource = null;

        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        setRetryCount((prev) => prev + 1);

        reconnectTimeout = setTimeout(connect, delay);
        toast.error("Connection lost! Reconnecting...");
      };
    };

    connect();
    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [retryCount]);

  /** ----------------------------- EVENT HANDLERS ----------------------------- **/
  const handleUserEvent = useCallback((data: any) => {
    if (["created", "updated"].includes(data.action)) {
      setUsers((prev) =>
        prev.some((u) => u.username === data.user.username)
          ? prev.map((u) =>
              u.username === data.user.username ? data.user : u
            )
          : [...prev, data.user]
      );
      if (
        currentUserRef.current &&
        data.user.username === currentUserRef.current.username
      ) {
        setCurrentUser(data.user);
      }
    } else if (data.action === "deleted") {
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
    }
  }, []);

  const handleMessageEvent = useCallback((data: any) => {
    if (data.action === "created") {
      setMessages((prev) => [data.message, ...prev]);
      if (activeTabRef.current !== "inbox") {
        toast.message(`New Message From: ${data.message.from}`);
      }
    } else if (data.action === "updated") {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message.id ? data.message : m))
      );
    } else if (data.action === "deleted") {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    }
  }, []);

  const handleGroupEvent = useCallback((data: any) => {
    if (data.action === "created") {
      setGroups((prev) => [...prev, data.group]);
    } else if (data.action === "updated") {
      setGroups((prev) =>
        prev.map((g) => (g.id === data.group.id ? data.group : g))
      );
    } else if (data.action === "deleted") {
      setGroups((prev) => prev.filter((g) => g.id !== data.groupId));
    }
  }, []);

  const handleInitialData = useCallback((data: any) => {
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

  /** ----------------------------- FETCH HELPERS ----------------------------- **/
  const fetchCurrentUser = useCallback(async () => {
    try {
      const username = localStorage.getItem("user");
      if (!username) throw new Error("No user in local storage");

      const res = await fetch("/api/user/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to fetch current user");

      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error("Fetch current user error:", err);
      toast.error("Failed to load user data");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/user/all");
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Failed to load users");
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/user/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      setMessages(await res.json());
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast.error("Failed to load messages");
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/user/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      setGroups(await res.json());
    } catch (err) {
      console.error("Fetch groups error:", err);
      toast.error("Failed to load groups");
    }
  }, []);

  /** ----------------------------- TAB REFRESH ----------------------------- **/
  useEffect(() => {
    const refresh = async () => {
      setTabData((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], loading: true },
      }));

      try {
        if (activeTab === "users") await fetchUsers();
        else if (activeTab === "inbox") await fetchMessages();
        else if (activeTab === "groups") await fetchGroups();
        else if (activeTab === "profile") await fetchCurrentUser();

        setTabData((prev) => ({
          ...prev,
          [activeTab]: { loaded: true, loading: false },
        }));
      } catch {
        setTabData((prev) => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], loading: false },
        }));
      }
    };
    refresh();
  }, [activeTab, fetchUsers, fetchMessages, fetchGroups, fetchCurrentUser]);

  /** ----------------------------- PROGRESS BAR ----------------------------- **/
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (Object.values(tabData).some((t) => t.loading)) {
      interval = setInterval(
        () =>
          setTabLoadingProgress((prev) =>
            prev >= 100 ? 100 : prev + 10
          ),
        100
      );
    } else {
      setTabLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [tabData]);

  /** ----------------------------- OTHER ACTIONS ----------------------------- **/
  const approveUser = async (username: string) => {
    try {
      const res = await fetch("/api/user/update-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, status: 2 }),
      });
      if (!res.ok) throw new Error("Approval failed");

      setUsers((prev) =>
        prev.map((u) =>
          u.username === username ? { ...u, status: 2 } : u
        )
      );
      toast.success("User activated successfully!");
    } catch {
      toast.error("Approval failed, try again later");
    }
  };

  const updateUser = async (
    username: string,
    updateData: Partial<User>
  ): Promise<User[]> => {
    try {
      if (!username) throw new Error("Username is required");
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...updateData }),
      });
      if (!res.ok) throw new Error("Update failed");

      await fetchUsers();
      toast.success("User updated successfully!");
      return users;
    } catch (err) {
      toast.error("Error updating user!");
      throw err;
    }
  };

  const handleProfileUpdate = async (updatedUser: User) => {
    try {
      if (!updatedUser.username) throw new Error("Invalid user");
      const updated = await updateUser(
        updatedUser.username,
        updatedUser
      );
      const latest = updated.find(
        (u) => u.username === updatedUser.username
      );
      if (latest) setCurrentUser(latest);
      return true;
    } catch {
      toast.error("Profile update failed");
      return false;
    }
  };

  const handleUserDeleted = (username: string) => {
    setUsers((prev) => prev.filter((u) => u.username !== username));
    toast(`User ${username} removed`);
  };

  const sendMessage = async (to: string, content: string) => {
    try {
      const res = await fetch("/api/user/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, content }),
      });
      if (!res.ok) throw new Error("Send failed");
      const newMsg = await res.json();
      setMessages((prev) => [newMsg, ...prev]);
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to send message");
    }
  };

  /** ----------------------------- UNREAD + LOADING ----------------------------- **/
  const unreadMessages = messages.filter((m) => !m.read);
  const isTabLoading = Object.values(tabData).some((t) => t.loading);

  /** ----------------------------- RENDER ----------------------------- **/
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 w-full h-1 bg-secondary/30 z-50 origin-left backdrop-blur-sm"
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${100}%` }}
          transition={{ duration: 0.15, ease: "linear" }}
        />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col max-h-screen overflow-hidden bg-background">
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
        {/* Desktop Tabs Header - Fixed at the top with backdrop blur */}
        <div className="sticky top-0 z-30 hidden md:block">
          <TabsList className="grid w-full grid-cols-4 bg-transparent p-2 gap-1 text-text">
            <TabsTrigger 
              value="profile" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200"
            >
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200"
            >
              <FiUsers className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inbox" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200"
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
              className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 rounded-lg transition-all duration-200"
            >
              <FiFolder className="w-4 h-4" />
              <span>Groups</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden p-2 mt-2">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-xl shadow-lg h-full flex flex-col overflow-hidden border border-border"
          >
            <div className="flex-1 overflow-auto">
              <TabContent
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
            </div>
          </motion.div>
        </div>

        {/* Mobile Bottom Navigation with backdrop blur */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/80 backdrop-blur-md border-t border-border">
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadCount={unreadMessages.length}
          />
        </div>
      </Tabs>
    </div>
  );
}