'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord } from '@/types/users';
import { User } from '@/types/users';
import {
  FiCalendar,
  FiFilter,
  FiDownload,
  FiSearch,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiBarChart2,
  FiUser,
  FiEye,
  FiMapPin,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

interface AttendanceViewerProps {
  currentUser?: User;
}

type DateRange = {
  from?: Date;
  to?: Date;
};

type ViewMode = 'day' | 'week' | 'month' | 'custom';

// Date helper functions - defined at the top to avoid hoisting issues
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

const formatDate = (date: Date, format: string): string => {
  // Simple date formatting function
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  switch (format) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'PPP':
      return `${monthNames[date.getMonth()]} ${day}, ${year}`;
    case 'LLL dd, y':
      return `${monthShortNames[date.getMonth()]} ${day}, ${year}`;
    case 'MMMM yyyy':
      return `${monthNames[date.getMonth()]} ${year}`;
    case 'MMM dd':
      return `${monthShortNames[date.getMonth()]} ${day}`;
    case 'EEEE':
      return dayNames[date.getDay()];
    case 'MMMM dd, yyyy':
      return `${monthNames[date.getMonth()]} ${day}, ${year}`;
    case 'MMM dd, yyyy':
      return `${monthShortNames[date.getMonth()]} ${day}, ${year}`;
    default:
      return date.toLocaleDateString();
  }
};

// cn utility function for conditional classes
const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

const AttendanceViewer: React.FC<AttendanceViewerProps> = ({ currentUser }) => {
  // State
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: getStartOfWeek(new Date()),
    to: getEndOfWeek(new Date())
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Dialog state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/user/all');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  // Fetch attendance data based on filters
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = '/api/user/attendance/get?';
        const params = new URLSearchParams();

        // Add user filter
        if (selectedUser !== 'all') {
          params.append('username', selectedUser);
        }

        // Add date range filter based on view mode
        if (viewMode === 'day') {
          const formattedDate = formatDate(selectedDate, 'yyyy-MM-dd');
          params.append('date', formattedDate);
        } else if (viewMode === 'custom' && dateRange.from && dateRange.to) {
          params.append('startDate', formatDate(dateRange.from, 'yyyy-MM-dd'));
          params.append('endDate', formatDate(dateRange.to, 'yyyy-MM-dd'));
        } else {
          // For week and month, calculate date range
          let startDate: Date;
          let endDate: Date;

          if (viewMode === 'week') {
            startDate = getStartOfWeek(selectedDate);
            endDate = getEndOfWeek(selectedDate);
          } else { // month
            startDate = getStartOfMonth(selectedDate);
            endDate = getEndOfMonth(selectedDate);
          }

          params.append('startDate', formatDate(startDate, 'yyyy-MM-dd'));
          params.append('endDate', formatDate(endDate, 'yyyy-MM-dd'));
        }

        url += params.toString();
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch attendance data');
        const data = await response.json();
        setAttendanceData(data);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError('Failed to load attendance data');
        toast.error('Failed to load attendance records');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedUser, viewMode, selectedDate, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.filter(r => r.status === 'absent').length;
    const lateCount = attendanceData.filter(r => r.status === 'late').length;
    const halfDayCount = attendanceData.filter(r => r.status === 'half-day').length;

    const totalHours = attendanceData.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const avgHours = totalRecords > 0 ? totalHours / totalRecords : 0;

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      presentPercentage: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
      avgHours
    };
  }, [attendanceData]);

  // Filter by search query
  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      const user = users.find(u => u.username === record.userName);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase() : record.userName.toLowerCase();
      const department = user?.department?.toLowerCase() || '';
      const position = user?.position?.toLowerCase() || '';

      const searchLower = searchQuery.toLowerCase();
      return (
        userName.includes(searchLower) ||
        department.includes(searchLower) ||
        position.includes(searchLower) ||
        record.date.includes(searchLower) ||
        record.status.includes(searchLower)
      );
    });
  }, [attendanceData, users, searchQuery]);

  // Group by user for summary view
  const userSummary = useMemo(() => {
    const summary: Record<string, {
      user: User;
      records: AttendanceRecord[];
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalHours: number;
      avgHours: number;
    }> = {};

    attendanceData.forEach(record => {
      if (!summary[record.userName]) {
        const user = users.find(u => u.username === record.userName);
        summary[record.userName] = {
          user: user || { username: record.userName, firstName: '', lastName: '', email: '', role: '', status: 0, createdAt: '' },
          records: [],
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          totalHours: 0,
          avgHours: 0
        };
      }

      summary[record.userName].records.push(record);
      summary[record.userName].totalDays++;
      summary[record.userName].totalHours += record.totalHours || 0;

      switch (record.status) {
        case 'present':
          summary[record.userName].presentDays++;
          break;
        case 'absent':
          summary[record.userName].absentDays++;
          break;
        case 'late':
          summary[record.userName].lateDays++;
          break;
      }
    });

    // Calculate averages
    Object.keys(summary).forEach(userName => {
      const userSummaryData = summary[userName];
      userSummaryData.avgHours = userSummaryData.totalDays > 0 
        ? userSummaryData.totalHours / userSummaryData.totalDays 
        : 0;
    });

    return summary;
  }, [attendanceData, users]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Late</Badge>;
      case 'half-day':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Half Day</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Holiday</Badge>;
      case 'leave':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Leave</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format time
  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    return time;
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    
    const now = new Date();
    switch (mode) {
      case 'day':
        setSelectedDate(now);
        break;
      case 'week':
        setDateRange({
          from: getStartOfWeek(now),
          to: getEndOfWeek(now)
        });
        break;
      case 'month':
        setDateRange({
          from: getStartOfMonth(now),
          to: getEndOfMonth(now)
        });
        break;
      // custom range stays as is
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['User', 'Date', 'Check In', 'Check Out', 'Status', 'Total Hours', 'Location'];
    const csvRows = [
      headers.join(','),
      ...filteredData.map(record => {
        const user = users.find(u => u.username === record.userName);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName;
        const location = record.checkInLocation?.address || 'N/A';
        
        return [
          `"${userName}"`,
          record.date,
          formatTime(record.checkIn),
          formatTime(record.checkOut),
          record.status,
          record.totalHours?.toFixed(2) || '0',
          `"${location.split(',')[0]}"`
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Attendance data exported successfully');
  };

  // Handle record click for details
  const handleRecordClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedUser('all');
    setSearchQuery('');
    setViewMode('week');
    setSelectedDate(new Date());
    setDateRange({
      from: getStartOfWeek(new Date()),
      to: getEndOfWeek(new Date())
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-border w-full">
        <CardContent className="py-10">
          <div className="text-center text-red-600">
            <FiXCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Tracker</h2>
          <p className="text-muted-foreground">
            View and manage employee attendance records
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <FiDownload className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <FiUsers className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Rate</p>
                <p className="text-2xl font-bold">{stats.presentPercentage.toFixed(1)}%</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Hours/Day</p>
                <p className="text-2xl font-bold">{stats.avgHours.toFixed(1)}h</p>
              </div>
              <FiClock className="w-8 h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late Entries</p>
                <p className="text-2xl font-bold">{stats.lateCount}</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FiFilter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User Filter */}
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => handleViewModeChange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Selection based on view mode */}
            {viewMode === 'day' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {formatDate(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            {viewMode === 'custom' && (
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from, "LLL dd, y")} -{" "}
                          {formatDate(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        formatDate(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => {
                      setDateRange(range || { from: undefined, to: undefined });
                      if (range?.from && range?.to) {
                        setShowDatePicker(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            {viewMode === 'week' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setSelectedDate(newDate);
                    setDateRange({
                      from: getStartOfWeek(newDate),
                      to: getEndOfWeek(newDate)
                    });
                  }}
                >
                  <FiArrowDown className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1">
                  <p className="text-sm font-medium">
                    Week {getWeekNumber(dateRange.from || new Date())}, {selectedDate.getFullYear()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(dateRange.from || new Date(), 'MMM dd')} - {formatDate(dateRange.to || new Date(), 'MMM dd')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setSelectedDate(newDate);
                    setDateRange({
                      from: getStartOfWeek(newDate),
                      to: getEndOfWeek(newDate)
                    });
                  }}
                >
                  <FiArrowUp className="h-4 w-4" />
                </Button>
              </div>
            )}

            {viewMode === 'month' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                    setDateRange({
                      from: getStartOfMonth(newDate),
                      to: getEndOfMonth(newDate)
                    });
                  }}
                >
                  <FiArrowDown className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1">
                  <p className="text-sm font-medium">
                    {formatDate(selectedDate, 'MMMM yyyy')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                    setDateRange({
                      from: getStartOfMonth(newDate),
                      to: getEndOfMonth(newDate)
                    });
                  }}
                >
                  <FiArrowUp className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Showing {filteredData.length} records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No attendance records found for the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((record) => {
                        const user = users.find(u => u.username === record.userName);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {user?.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FiUser className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">
                                    {user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user?.position || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{formatDate(new Date(record.date), 'MMM dd, yyyy')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(new Date(record.date), 'EEEE')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FiClock className="w-4 h-4 text-muted-foreground" />
                                {formatTime(record.checkIn)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FiClock className="w-4 h-4 text-muted-foreground" />
                                {formatTime(record.checkOut)}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {record.totalHours ? record.totalHours.toFixed(1) + 'h' : 'N/A'}
                                {record.overtimeHours && record.overtimeHours > 0 && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    +{record.overtimeHours.toFixed(1)}h OT
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <FiMapPin className="w-4 h-4" />
                                      {record.checkInLocation?.address 
                                        ? record.checkInLocation.address.split(',')[0]
                                        : 'N/A'}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      {record.checkInLocation?.address || 'No location data'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordClick(record)}
                              >
                                <FiEye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Employee Summary</CardTitle>
              <CardDescription>
                Attendance summary for each employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Total Days</TableHead>
                      <TableHead>Avg. Hours/Day</TableHead>
                      <TableHead>Attendance Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(userSummary).map(([username, summary]) => (
                      <TableRow key={username}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {summary.user.avatar ? (
                              <img
                                src={summary.user.avatar}
                                alt={username}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <FiUser className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {summary.user.firstName} {summary.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {summary.user.position || summary.user.department || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-800 font-medium">{summary.presentDays}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-800 font-medium">{summary.absentDays}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-yellow-800 font-medium">{summary.lateDays}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{summary.totalDays}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{summary.avgHours.toFixed(1)}h</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${summary.totalDays > 0 ? (summary.presentDays / summary.totalDays) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {summary.totalDays > 0 
                                ? ((summary.presentDays / summary.totalDays) * 100).toFixed(1)
                                : '0'
                              }%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Complete information about this attendance record
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {(() => {
                  const user = users.find(u => u.username === selectedRecord.userName);
                  return (
                    <>
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-16 h-16 rounded-full"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <FiUser className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {user ? `${user.firstName || ''} ${user.lastName || ''}` : selectedRecord.userName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.position} • {user?.department}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Attendance Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Date</h4>
                  <p className="text-lg">
                    {formatDate(new Date(selectedRecord.date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Status</h4>
                  <div>{getStatusBadge(selectedRecord.status)}</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Check In</h4>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-5 h-5" />
                    <span className="text-lg">{formatTime(selectedRecord.checkIn)}</span>
                  </div>
                  {selectedRecord.checkInLocation && (
                    <p className="text-sm text-muted-foreground">
                      <FiMapPin className="inline w-4 h-4 mr-1" />
                      {selectedRecord.checkInLocation.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Check Out</h4>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-5 h-5" />
                    <span className="text-lg">{formatTime(selectedRecord.checkOut)}</span>
                  </div>
                  {selectedRecord.checkOutLocation && (
                    <p className="text-sm text-muted-foreground">
                      <FiMapPin className="inline w-4 h-4 mr-1" />
                      {selectedRecord.checkOutLocation.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Total Hours</h4>
                  <p className="text-2xl font-bold">
                    {selectedRecord.totalHours?.toFixed(1) || '0'} hours
                  </p>
                </div>

                {selectedRecord.overtimeHours && selectedRecord.overtimeHours > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Overtime</h4>
                    <p className="text-lg text-yellow-600">
                      +{selectedRecord.overtimeHours.toFixed(1)} hours
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-muted-foreground">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Location Map Preview */}
              {(selectedRecord.checkInLocation || selectedRecord.checkOutLocation) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Locations</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecord.checkInLocation && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">Check-in Location</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedRecord.checkInLocation.address}
                        </p>
                        <p className="text-xs mt-1">
                          Coordinates: {selectedRecord.checkInLocation.lat.toFixed(6)}, {selectedRecord.checkInLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                    {selectedRecord.checkOutLocation && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">Check-out Location</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedRecord.checkOutLocation.address}
                        </p>
                        <p className="text-xs mt-1">
                          Coordinates: {selectedRecord.checkOutLocation.lat.toFixed(6)}, {selectedRecord.checkOutLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceViewer;