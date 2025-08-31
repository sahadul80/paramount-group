// components/user/TabContent.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabsContent } from '../ui/tabs';
import GroupsTab from './GroupsTab';
import InboxTab from './InboxTab';
import ProfileTab from './ProfileTab';
import UsersTab from './UsersTab';
import { TabValue } from '../UserDashboard';
import { User, Group, Message } from '@/types/users';

interface TabContentProps {
  activeTab: TabValue;
  tabLoading?: boolean;
  tabData: any;
  users: User[];
  messages: Message[];
  groups: Group[];
  currentUser: User | null;
  onApproveUser: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => Promise<User[]>;
  onUserDeleted: (username: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleProfileUpdate: (updatedUser: User) => Promise<boolean>;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  tabData,
  users,
  messages,
  groups,
  currentUser,
  onApproveUser,
  onUpdateUser,
  onUserDeleted,
  setMessages,
  setGroups,
  setCurrentUser,
  handleProfileUpdate
}) => {
  return (
    <div className="min-h-[60vh]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <TabsContent value="profile">
              <ProfileTab 
                currentUser={currentUser!} 
                setCurrentUser={setCurrentUser} 
                handleProfileUpdate={handleProfileUpdate} 
              />
            </TabsContent>
          )}
          
          {activeTab === 'users' && (
            <TabsContent value="users">
              {tabData.users.loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <UsersTab 
                  users={users} 
                  loading={tabData.users.loading} 
                  onApprove={onApproveUser}
                  onUpdateUser={onUpdateUser}
                  onUserDeleted={onUserDeleted}
                />
              )}
            </TabsContent>
          )}
          
          {activeTab === 'inbox' && (
            <TabsContent value="inbox">
              {tabData.inbox.loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <InboxTab 
                  messages={messages} 
                  setMessages={setMessages} 
                  loading={tabData.inbox.loading} 
                  currentUser={currentUser!} // Add non-null assertion here
                  users={users} 
                />
              )}
            </TabsContent>
          )}
          
          {activeTab === 'groups' && (
            <TabsContent value="groups">
              {tabData.groups.loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <GroupsTab 
                  groups={groups} 
                  setGroups={setGroups} 
                  loading={tabData.groups.loading} 
                  users={users} 
                  currentUser={currentUser!} // Add non-null assertion here
                />
              )}
            </TabsContent>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabContent;