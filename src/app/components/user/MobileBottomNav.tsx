// components/user/MobileBottomNav.tsx
import React from 'react';
import { FiUser, FiUsers, FiMail, FiMessageSquare } from "react-icons/fi";
import { TabValue } from '../UserDashboard';

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 shadow-lg">
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
          {unreadCount > 0 && (
            <span className="absolute top-2 right-4 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
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
    </div>
  );
};

export default MobileBottomNav;