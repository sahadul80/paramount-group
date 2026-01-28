// components/user/MobileBottomNav.tsx
import React from 'react';
import { FiUser, FiUsers, FiMail, FiMessageSquare, FiInbox, FiGitMerge } from "react-icons/fi";
import { Button } from '../ui/button';
import { TabValue } from '@/types/users';

interface MobileBottomNavProps {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
  unreadCount: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadCount
}) => {
  return (
    <div className="md:hidden flex bottom-0 left-0 right-0 z-40 bg-black/25 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-center gap-4 overflow-x-auto w-full border border-border">
        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          className="rounded-lg gap-1 hover:cursor-pointer"
        >
          <div className='flex flex-col items-center '>
            <FiUser  />
            <span className="text-xs">Profile</span>
          </div>
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className="rounded-lg gap-1 hover:cursor-pointer"
        >
          <div className='flex flex-col items-center '>
            <FiUsers  />
            <span className="text-xs">Users</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default MobileBottomNav;