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
import { FiLoader } from 'react-icons/fi';

interface TabContentProps {
  activeTab: TabValue;
  tabLoading?: boolean;
  tabData: any;
  users: User[];
  messages: Message[];
  groups: Group[];
  currentUser: User;
  onApproveUser: (username: string) => void;
  onUpdateUser: (username: string, updateData: Partial<User>) => Promise<User[]>;
  onUserDeleted: (username: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User|null>>;
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
    <div className="min-h-[94vh]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <TabsContent value="profile">{
              tabData.currentUser?.loading ? (
                <div className="flex justify-center items-center h-full">
                  <FiLoader className="animate-spin h-16 w-16"/>
                </div>
              ) : (
                <ProfileTab 
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser} 
                  handleProfileUpdate={handleProfileUpdate}
                />
              )
            }
            </TabsContent>
          )}
          
          {activeTab === 'users' && (
            <TabsContent value="users">
              {tabData.users.loading ? (
                <div className="flex justify-center items-center h-full py-[30vh]">
                  <FiLoader className="animate-spin h-16 w-16"/>
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
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2">
                    <FiLoader/>
                  </div>
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
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2">
                    <FiLoader/>
                  </div>
                </div>
              ) : (
                <GroupsTab 
                  groups={groups} 
                  setGroups={setGroups} 
                  loading={tabData.groups.loading} 
                  users={users} 
                  currentUser={currentUser} // Add non-null assertion here
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