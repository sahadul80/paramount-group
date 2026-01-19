import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GroupsTab from './GroupsTab';
import InboxTab from './InboxTab';
import ProfileTab from './ProfileTab';
import UsersTab from './UsersTab';
import { TabValue, User, Group, Message } from '@/types/users';
import ParamountLoader from '../Loader';

interface TabState {
  loaded: boolean;
  loading: boolean;
}

interface TabData {
  [key: string]: TabState;
}

interface TabContentProps {
  activeTab: TabValue;
  tabData: TabData;
  users: User[];
  messages: Message[];
  groups: Group[];
  currentUser: User | null; // Changed: Allow null
  selectedUser: User | null;
  onApproveUser: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => Promise<User>;
  onUserDeleted: (username: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>; // Changed: Allow null
  setSelectedUsername: React.Dispatch<React.SetStateAction<string | null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
  sendMessage?: (to: string, content: string) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  tabData,
  users,
  messages,
  groups,
  currentUser,
  selectedUser,
  onApproveUser,
  onUpdateUser,
  onUserDeleted,
  setMessages,
  setGroups,
  setCurrentUser,
  setSelectedUsername,
  handleProfileUpdate,
  sendMessage
}) => {
  // Memoize handlers to prevent unnecessary re-renders
  const handleUserSelect = React.useCallback((username: string) => {
    setSelectedUsername(username);
  }, [setSelectedUsername]);

  const handleUserDeselect = React.useCallback(() => {
    setSelectedUsername(null);
  }, [setSelectedUsername]);

  // Get the current tab state safely with memoization
  const tabState = useMemo(() => {
    return tabData[activeTab] || { loaded: false, loading: false };
  }, [tabData, activeTab]);

  // Memoize data to prevent unnecessary re-renders of child components
  const memoizedUsers = useMemo(() => users, [users]);
  const memoizedMessages = useMemo(() => messages, [messages]);
  const memoizedGroups = useMemo(() => groups, [groups]);

  // Function to render the correct tab content
  const renderTabContent = useMemo(() => {
    if (tabState.loading) {
      return <ParamountLoader />;
    }

    // Return early if currentUser is null (shouldn't happen since parent component checks)
    if (!currentUser) {
      return (
        <div className="flex items-center justify-center h-full">
          <ParamountLoader />
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser} 
            handleProfileUpdate={handleProfileUpdate}
          />
        );

      case 'users':
        return (
          <UsersTab 
            users={memoizedUsers} 
            loading={tabState.loading}
            selectedUser={selectedUser}
            onApprove={onApproveUser}
            onUpdateUser={onUpdateUser}
            onUserDeleted={onUserDeleted}
            onUserSelect={handleUserSelect}
            onUserDeselect={handleUserDeselect}
          />
        );

      case 'inbox':
        return (
          <InboxTab 
            messages={memoizedMessages} 
            setMessages={setMessages} 
            loading={tabState.loading}
            currentUser={currentUser}
            users={memoizedUsers}
            sendMessage={sendMessage}
          />
        );

      case 'groups':
        return (
          <GroupsTab 
            groups={memoizedGroups} 
            setGroups={setGroups} 
            loading={tabState.loading}
            users={memoizedUsers} 
            currentUser={currentUser}
          />
        );

      default:
        return <TabNotFound />;
    }
  }, [
    activeTab,
    tabState.loading,
    currentUser,
    memoizedUsers,
    memoizedMessages,
    memoizedGroups,
    selectedUser,
    setCurrentUser,
    setMessages,
    setGroups,
    handleProfileUpdate,
    onApproveUser,
    onUpdateUser,
    onUserDeleted,
    handleUserSelect,
    handleUserDeselect,
    sendMessage
  ]);

  return (
    <div className="min-h-[94vh] w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {renderTabContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// TabNotFound Component
const TabNotFound: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-full py-[30vh]">
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
        <span className="text-2xl font-bold text-muted-foreground">404</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground">Tab Not Found</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        The tab you're looking for doesn't exist or has been removed.
        Please select a valid tab from the navigation.
      </p>
    </div>
  </div>
);

export default TabContent;