// components/user/UsersTab.tsx
"use client";
import React, { useState } from "react";
import {
  FiUsers,
  FiClock,
  FiActivity,
  FiWifi,
  FiWifiOff,
  FiCoffee,
  FiSearch,
  FiMail,
  FiBookmark,
  FiUser,
} from "react-icons/fi";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import UserProfileModal from "./UserProfileModal";
import { User } from "@/types/users";
import { motion, AnimatePresence } from "framer-motion";

type StatusTabValue = "all" | "pending" | "active";
type PresenceTabValue = "online" | "offline" | "away";

interface UsersTabProps {
  users: User[];
  loading: boolean;
  onApprove: (username: string) => void;
  onUpdateUser: (
    username: string,
    updateData: Partial<User>
  ) => Promise<User[]>;
  onUserDeleted: (username: string) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  onApprove,
  onUpdateUser,
  onUserDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeMainTab, setActiveMainTab] =
    useState<StatusTabValue>("all");
  const [activePresenceTab, setActivePresenceTab] =
    useState<PresenceTabValue>("online");

  const getStatusString = (status: number) => {
    switch (status) {
      case 0:
        return "inactive";
      case 1:
        return "pending";
      case 2:
        return "active";
      case 3:
        return "away";
      case 4:
        return "offline";
      case 5:
        return "online";
      default:
        return "unknown";
    }
  };

  const getBadgeVariant = (status: number) => {
    switch (status) {
      case 0:
        return "destructive";
      case 1:
        return "warning";
      case 2:
        return "success";
      case 3:
        return "secondary";
      case 4:
        return "outline";
      case 5:
        return "success";
      default:
        return "default";
    }
  };

  const filteredUsers = users.filter((user) => {
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
    // Search overrides tabs
    if (searchTerm) return filteredUsers;

    switch (activeMainTab) {
      case "pending":
        return users.filter((u) => u.status === 1);
      case "active":
        switch (activePresenceTab) {
          case "online":
            return users.filter((u) => u.status === 5);
          case "offline":
            return users.filter((u) => u.status === 4);
          case "away":
            return users.filter((u) => u.status === 3);
          default:
            return users.filter((u) => [2, 3, 4, 5].includes(u.status));
        }
      default:
        return users;
    }
  };

  const currentUsers = getUsersForTab();
  const pendingCount = users.filter((u) => u.status === 1).length;
  const onlineCount = users.filter((u) => u.status === 5).length;
  const offlineCount = users.filter((u) => u.status === 4).length;
  const awayCount = users.filter((u) => u.status === 3).length;
  const activeCount = users.filter((u) =>
    [2, 3, 4, 5].includes(u.status)
  ).length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.28 },
    }),
  };

  const UserCard = ({
    user,
    index,
    showApprove = false,
  }: {
    user: User;
    index: number;
    showApprove?: boolean;
  }) => (
    <motion.div
      key={user.username}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <Card
        onClick={() => setSelectedUser(user)}
        className="flex flex-col justify-between hover:shadow-2xl transition-shadow h-full cursor-pointer bg-background border border-border"
      >
        <CardHeader className="flex flex-row items-center space-x-2 p-4">
          <Avatar className="border-2 border-primary">
            <AvatarImage src={user.avatar || ""} alt={user.username} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {(user.firstName?.charAt(0) || user.username.charAt(0)) ||
                ""}
              {user.lastName?.charAt(0) || ""}
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

        <CardContent className="px-3 pb-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {user.role}
            </Badge>
            <Badge
              variant={getBadgeVariant(user.status)}
              className="text-xs"
            >
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
              <p className="text-muted-foreground">
                Position: {user.position}
              </p>
            )}
            {user.employeeId && (
              <p className="text-muted-foreground">ID: {user.employeeId}</p>
            )}
            <p className="text-muted-foreground">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between p-2">
          <Button size="sm" variant="outline" className="flex items-center text-xs">
            <FiMail />
            <span className="hidden md:inline text-xs ml-1">Message</span>
          </Button>

          {user.status === 1 && (
            <Button
              size="sm"
              variant="default"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(user.username);
              }}
            >
              <FiBookmark className="mr-1" />
              <span className="hidden md:inline text-xs">Approve</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <Card className="w-full h-full flex flex-col border-0 bg-card min-h-0">
      <CardContent className="flex-1 p-2 md:p-4 lg:p-4 min-h-0">
        <div className="sticky top-0 z-10 bg-secondary rounded-lg -mr-2 md:-mr-4 -ml-2 md:-ml-4 -mt-4 md:-mt-6">
        <div className="p-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <CardTitle className="text-lg md:text-xl">User Directory</CardTitle>
            <CardDescription className="hidden md:flex text-muted-foreground">
              Manage all users in the system
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main status tabs (remain in the sticky block) */}
        <div className="mt-2">
          <Tabs
            value={activeMainTab}
            onValueChange={(v) => setActiveMainTab(v as StatusTabValue)}
            className="border border-border rounded-lg"
          >
            <TabsList className="flex bg-muted rounded-lg text-text">
              <TabsTrigger
                value="all"
                className="flex-1 flex justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiUsers className="mr-1 h-4 w-4" /> All
                <span className="text-xs bg-muted-foreground/10 rounded-full px-2 py-0.5">
                  {users.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="pending"
                className="flex-1 flex justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiClock className="mr-1 h-4 w-4" /> Pending
                <span className="text-xs bg-warning/10 text-warning rounded-full px-2 py-0.5">
                  {pendingCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="active"
                className="flex-1 flex justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiActivity className="mr-1 h-4 w-4" /> Active
                <span className="text-xs bg-success/10 text-success rounded-full px-2 py-0.5">
                  {activeCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Presence submenu tabs (also inside the same sticky block) */}
        {activeMainTab === "active" && !searchTerm && (
        <div className="mt-1 border border-border rounded-lg">
          <Tabs
            value={activePresenceTab}
            onValueChange={(v) =>
              setActivePresenceTab(v as PresenceTabValue)
            }
          >
            <TabsList className="flex justify-between bg-muted rounded-lg text-text">
              <TabsTrigger
                value="online"
                className="flex-1 flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiWifi className="mr-1 h-4 w-4" /> Online
                <span className="ml-1 text-xs bg-success/10 text-success rounded-full px-2 py-0.5">
                  {onlineCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="offline"
                className="flex-1 flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiWifiOff className="mr-1 h-4 w-4" /> Offline
                <span className="ml-1 text-xs bg-muted-foreground/10 rounded-full px-2 py-0.5">
                  {offlineCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="away"
                className="flex-1 flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FiCoffee className="mr-1 h-4 w-4" /> Away
                <span className="ml-1 text-xs bg-warning/10 text-warning rounded-full px-2 py-0.5">
                  {awayCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        )}
        </div>
        </div>
        {loading ? (
          <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 w-full h-1 bg-secondary/30 z-50 origin-left backdrop-blur-sm"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${loading}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 mb-12 md:mb-0 lg:mb-0">
            {currentUsers.length > 0 ? (
              currentUsers.map((user, i) => (
                <UserCard
                  key={user.username}
                  user={user}
                  index={i}
                  showApprove={activeMainTab === "pending"}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No users found"
                  : activeMainTab === "pending"
                  ? "No pending users"
                  : activeMainTab === "active"
                  ? `No ${activePresenceTab} users found`
                  : "No users found"}
              </div>
            )}
          </div>
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
};

export default UsersTab;
