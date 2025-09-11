'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Task, User } from '@/types/users';
import { FiPlus, FiFilter, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiPause, FiSearch, FiEye, FiCircle } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface TaskManagementProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onNewTask: (task: Task) => void;
  currentUser: User;
  users: User[];
  unreadTaskIds: Set<string>;
  setUnreadTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ 
  tasks, 
  onTaskUpdate, 
  onNewTask, 
  currentUser, 
  users,
  unreadTaskIds,
  setUnreadTaskIds
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: [] as string[],
  });
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const prevTasksRef = useRef<Task[]>([]);

  // Sort tasks by creation date (newest first)
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const markTaskAsRead = (taskId: string) => {
    setUnreadTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const username = user.username.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || username.includes(searchLower);
  });

  const startTimer = (taskId: string) => {
    const startTime = Date.now();
    setActiveTimers(prev => ({ ...prev, [taskId]: startTime }));
    onTaskUpdate(taskId, { startTime: new Date(startTime).toISOString(), status: 'in-progress' });
    markTaskAsRead(taskId);
  };

  const stopTimer = (taskId: string) => {
    const endTime = Date.now();
    const startTime = activeTimers[taskId];
    const timeSpent = startTime ? Math.round((endTime - startTime) / 1000 / 60) : 0;
    
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[taskId];
      return newTimers;
    });
    
    onTaskUpdate(taskId, { 
      status: 'completed', 
      completedAt: new Date(endTime).toISOString(),
      timeSpent: (tasks.find(t => t.id === taskId)?.timeSpent || 0) + timeSpent
    });
    markTaskAsRead(taskId);
  };

  const handleCreateTask = () => {
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      assignedBy: currentUser.username,
      status: 'pending',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString(),
    };
    
    onNewTask(task);
    setNewTask({ 
      title: '', 
      description: '', 
      priority: 'medium', 
      dueDate: '',
      assignedTo: [] 
    });
    setSearchTerm("");
    setIsDialogOpen(false);
  };

  const handleUserSelection = (username: string) => {
    setNewTask(prev => {
      if (prev.assignedTo.includes(username)) {
        return {
          ...prev,
          assignedTo: prev.assignedTo.filter(user => user !== username)
        };
      } else {
        return {
          ...prev,
          assignedTo: [...prev.assignedTo, username]
        };
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-success" />;
      case 'in-progress': return <FiClock className="w-4 h-4 text-warning" />;
      default: return <FiAlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTimeSpent = (minutes: number | undefined) => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Task Management</h3>
          <p className="text-sm text-muted-foreground">Track and manage your assigned tasks</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-auto h-auto">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value='in-progress'>In Progress</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center w-auto h-auto">
                <FiPlus />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Assign a new task to yourself or team members</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Task Title</label>
                  <Input 
                    value={newTask.title} 
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={newTask.description} 
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})} 
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newTask.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input 
                      type="date" 
                      value={newTask.dueDate} 
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign To</label>
                  <div className="relative w-full">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="border rounded-md p-3 mt-2 max-h-40 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      <div className="space-y-2">
                        {filteredUsers.map((user) => (
                          <div key={user.username} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.username}`}
                              checked={newTask.assignedTo.includes(user.username)}
                              onCheckedChange={() => handleUserSelection(user.username)}
                            />
                            <Label htmlFor={`user-${user.username}`} className="text-sm font-normal cursor-pointer flex-1">
                              <div>{user.firstName} {user.lastName}</div>
                              <div className="text-muted-foreground">@{user.username}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                  {newTask.assignedTo.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">
                        Selected: {newTask.assignedTo.length} user(s)
                      </span>
                    </div>
                  )}
                </div>
                
                <Button onClick={handleCreateTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredTasks.map((task) => {
            const isUnread = unreadTaskIds.has(task.id);
            const isAssignedToMe = task.assignedTo && task.assignedTo.includes(currentUser.username);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`border-border ${isUnread && isAssignedToMe ? 'border-l-4 border-l-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        {isUnread && isAssignedToMe && (
                          <FiCircle className="w-3 h-3 text-primary mt-1.5 animate-pulse" />
                        )}
                        <div>
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <CardDescription>{task.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {getStatusIcon(task.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        <div>Assigned: {new Date(task.createdAt).toLocaleDateString()}</div>
                        {task.dueDate && (
                          <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                        )}
                        {task.timeSpent && (
                          <div>Time spent: {formatTimeSpent(task.timeSpent)}</div>
                        )}
                        <div className="mt-1">
                          <span className="font-medium">Assigned to:</span>
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.assignedTo.map(username => {
                                const user = users.find(u => u.username === username);
                                return (
                                  <Badge 
                                    key={username} 
                                    variant="outline" 
                                    className={`text-xs ${username === currentUser.username ? 'bg-primary/10 text-primary' : ''}`}
                                  >
                                    {user ? `${user.firstName} ${user.lastName}` : username}
                                    {username === currentUser.username && ' (You)'}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="ml-1">Unassigned</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {isUnread && isAssignedToMe && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markTaskAsRead(task.id)}
                            className="flex items-center gap-1"
                          >
                            <FiEye className="w-4 h-4" />
                            Mark as read
                          </Button>
                        )}
                        
                        {task.status !== 'completed' && (
                          <>
                            {activeTimers[task.id] ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => stopTimer(task.id)}
                                className="flex items-center gap-1"
                              >
                                <FiPause className="w-4 h-4" />
                                Stop
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => startTimer(task.id)}
                                className="flex items-center gap-1"
                              >
                                <FiPlay className="w-4 h-4" />
                                Start
                              </Button>
                            )}
                            
                            {task.status === 'in-progress' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onTaskUpdate(task.id, { status: 'pending' })}
                              >
                                Pause
                              </Button>
                            )}
                          </>
                        )}
                        
                        {task.status === 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onTaskUpdate(task.id, { status: 'pending' })}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tasks found. {filter !== 'all' ? 'Try changing the filter.' : 'Create your first task!'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskManagement;