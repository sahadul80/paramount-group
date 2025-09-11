'use client'
import React from 'react';
import { Task, AttendanceRecord, User } from '@/types/users';
import { FiTrendingUp, FiActivity, FiAward, FiTarget } from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { motion } from 'framer-motion';

interface PerformanceMetricsProps {
  tasks: Task[];
  attendance: AttendanceRecord[];
  currentUser: User;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ tasks, attendance, currentUser }) => {
  // Calculate metrics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const presentDays = attendance.filter(record => record.status === 'present').length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  const avgTaskTime = completedTasks > 0 ? Math.round(totalTimeSpent / completedTasks) : 0;
  
  const highPriorityTasks = tasks.filter(task => task.priority === 'high');
  const highPriorityCompleted = highPriorityTasks.filter(task => task.status === 'completed').length;
  const highPriorityCompletionRate = highPriorityTasks.length > 0 ? Math.round((highPriorityCompleted / highPriorityTasks.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">Performance Metrics</h3>
        <p className="text-sm text-muted-foreground">Track your performance and productivity metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Completion */}
        <Card className="border-border bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FiTarget className="w-5 h-5" />
              Task Completion
            </CardTitle>
            <CardDescription>Your task completion rate</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground">
              {completionRate}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {completedTasks} of {totalTasks} tasks completed
            </div>
            
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-border bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FiActivity className="w-5 h-5" />
              Attendance Rate
            </CardTitle>
            <CardDescription>Your attendance record</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground">
              {attendanceRate}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {presentDays} of {totalDays} days present
            </div>
            
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity */}
        <Card className="border-border bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5" />
              Productivity
            </CardTitle>
            <CardDescription>Your work efficiency</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground">
              {avgTaskTime}m
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Average time per task
            </div>
            
            <div className="text-xs text-muted-foreground mt-4">
              Total time spent: {Math.round(totalTimeSpent / 60)}h {totalTimeSpent % 60}m
            </div>
          </CardContent>
        </Card>

        {/* Priority Tasks */}
        <Card className="border-border bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FiAward className="w-5 h-5" />
              Priority Tasks
            </CardTitle>
            <CardDescription>High priority task completion</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground">
              {highPriorityCompletionRate}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {highPriorityCompleted} of {highPriorityTasks.length} high priority tasks
            </div>
            
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-warning h-2 rounded-full transition-all duration-500" 
                style={{ width: `${highPriorityCompletionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Personalized insights based on your performance data</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {completionRate >= 80 ? (
            <div className="p-3 rounded-lg bg-success/10 text-success text-sm">
              🎉 Excellent task completion rate! You're consistently meeting your goals.
            </div>
          ) : completionRate >= 60 ? (
            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
              👍 Good progress! You're on track with most of your tasks.
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              ⚠️ You might be falling behind on tasks. Consider prioritizing your workload.
            </div>
          )}
          
          {attendanceRate >= 90 ? (
            <div className="p-3 rounded-lg bg-success/10 text-success text-sm">
              📅 Perfect attendance! Your consistency is commendable.
            </div>
          ) : attendanceRate >= 75 ? (
            <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">
              📅 Good attendance record. Keep up the consistency!
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              📅 Your attendance needs improvement. Consistent presence helps team coordination.
            </div>
          )}
          
          {avgTaskTime < 120 ? (
            <div className="p-3 rounded-lg bg-success/10 text-success text-sm">
              ⚡ Great efficiency! You're completing tasks quickly while maintaining quality.
            </div>
          ) : avgTaskTime < 240 ? (
            <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">
              ⚡ Solid productivity. You're managing your time effectively.
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
              ⚡ Some tasks are taking longer than expected. Consider breaking them down into smaller steps.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
