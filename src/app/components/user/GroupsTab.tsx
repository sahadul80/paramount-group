import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

interface Group {
  id: number;
  name: string;
  members: string[];
  createdBy: string;
}

interface User {
  username: string;
  email: string;
  role: string;
  status: number;
  avatar?: string;
}

interface GroupsTabProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  loading: boolean;
  users: User[];
  currentUser: User;
}

const GroupsTab: React.FC<GroupsTabProps> = ({ groups, setGroups, loading, users, currentUser }) => {
  const [newGroup, setNewGroup] = useState<{ name: string; members: string[] }>({
    name: '',
    members: []
  });

  const toggleGroupMember = (username: string) => {
    if (newGroup.members.includes(username)) {
      setNewGroup({
        ...newGroup,
        members: newGroup.members.filter(m => m !== username)
      });
    } else {
      setNewGroup({
        ...newGroup,
        members: [...newGroup.members, username]
      });
    }
  };

  const createGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name || newGroup.members.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }
    const newGrp: Group = {
      id: groups.length + 1,
      name: newGroup.name,
      members: [...newGroup.members, currentUser.username],
      createdBy: currentUser.username
    };
    setGroups([newGrp, ...groups]);
    setNewGroup({ name: '', members: [] });
    alert('Group created successfully!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
      <Card className="lg:w-2/3">
        <CardHeader>
          <CardTitle className='text-xl sm:text-2xl'>Your Groups</CardTitle>
          <CardDescription>Groups you're part of</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map(group => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription className="text-xs">Created by: {group.createdBy}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {group.members.map(member => (
                        <Badge key={member} variant="secondary" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:w-1/3">
        <CardHeader>
          <CardTitle className='text-xl sm:text-2xl'>Create New Group</CardTitle>
          <CardDescription>Start a new group conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Group Name</label>
              <input 
                type="text" 
                placeholder="Enter group name"
                value={newGroup.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroup({...newGroup, name: e.target.value})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Add Members</label>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto text-sm">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  users
                    .filter(user => user.username !== currentUser.username)
                    .map(user => (
                      <div 
                        key={user.username} 
                        className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${newGroup.members.includes(user.username) ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => toggleGroupMember(user.username)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        {newGroup.members.includes(user.username) && (
                          <span className="ml-auto text-green-500">✓</span>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto border border-border">
                Create Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupsTab;
