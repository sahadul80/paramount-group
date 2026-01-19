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
      <div className="flex justify-between overflow-x-auto w-full border border-border">
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
        <Button
          variant={activeTab === 'inbox' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('inbox')}
          className="rounded-lg gap-1 hover:cursor-pointer"
        >
          <div className='flex flex-col items-center '>
            <FiInbox  />
            <span className="text-xs">Inbox</span>
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-4 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === 'groups' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('groups')}
          className="rounded-lg gap-1 hover:cursor-pointer"
        >
          <div className='flex flex-col items-center '>
            <FiGitMerge  />
            <span className="text-xs">Groups</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default MobileBottomNav;