// components/user/DesktopTabs.tsx
import React from 'react';
import { FiUser, FiUsers, FiMail, FiMessageSquare } from "react-icons/fi";
import { TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from "../ui/badge";
import { TabValue } from '../UserDashboard';

interface DesktopTabsProps {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
  unreadCount: number;
}

const DesktopTabs: React.FC<DesktopTabsProps> = ({
  activeTab,
  setActiveTab,
  unreadCount
}) => {
  return (
    <TabsList className="hidden md:flex w-full gap-1 rounded-xl p-1">
      <TabsTrigger 
        value="profile" 
        className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        onClick={() => setActiveTab('profile')}
      >
        <span className="mr-2"><FiUser /></span> 
        <span>Profile</span>
      </TabsTrigger>
      <TabsTrigger 
        value="users" 
        className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        onClick={() => setActiveTab('users')}
      >
        <span className="mr-2"><FiUsers /></span> 
        <span>Users</span>
      </TabsTrigger>
      <TabsTrigger 
        value="inbox" 
        className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        onClick={() => setActiveTab('inbox')}
      >
        <div className="flex items-center">
          <span className="mr-2"><FiMail /></span>
          <span>Inbox</span>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
          )}
        </div>
      </TabsTrigger>
      <TabsTrigger 
        value="groups" 
        className="flex-1 flex items-center justify-center py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        onClick={() => setActiveTab('groups')}
      >
        <span className="mr-2"><FiMessageSquare /></span> 
        <span>Groups</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default DesktopTabs;