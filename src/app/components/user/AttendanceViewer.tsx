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
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AttendanceViewerProps {
  currentUser?: User;
}

type DateRange = {
  from?: Date;
  to?: Date;
};

type ViewMode = 'day' | 'week' | 'month' | 'custom';

// Date helper functions
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Late</Badge>;
      case 'half-day':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Half Day</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Holiday</Badge>;
      case 'leave':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">Leave</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
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
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Attendance Tracker</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            View and manage employee attendance records
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2 w-full sm:w-auto">
          <FiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Records</p>
                <p className="text-lg md:text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <FiUsers className="w-6 h-6 md:w-8 md:h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Present Rate</p>
                <p className="text-lg md:text-2xl font-bold">{stats.presentPercentage.toFixed(1)}%</p>
              </div>
              <FiCheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Avg. Hours/Day</p>
                <p className="text-lg md:text-2xl font-bold">{stats.avgHours.toFixed(1)}h</p>
              </div>
              <FiClock className="w-6 h-6 md:w-8 md:h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Late Entries</p>
                <p className="text-lg md:text-2xl font-bold">{stats.lateCount}</p>
              </div>
              <FiTrendingUp className="w-6 h-6 md:w-8 md:h-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <FiFilter className="w-4 h-4 md:w-5 md:h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* User Filter */}
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="h-10">
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

            {/* View Mode - Mobile dropdown, desktop select */}
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 w-full justify-start">
                    <FiCalendar className="mr-2 h-4 w-4" />
                    <span className="capitalize">{viewMode} View</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleViewModeChange('day')}>
                    Day View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('week')}>
                    Week View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('month')}>
                    Month View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('custom')}>
                    Custom Range
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Select value={viewMode} onValueChange={(value: ViewMode) => handleViewModeChange(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day View</SelectItem>
                  <SelectItem value="week">Week View</SelectItem>
                  <SelectItem value="month">Month View</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Date Selection based on view mode */}
            {viewMode === 'day' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {formatDate(selectedDate, 'MMM dd')}
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
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from, "MMM dd")} -{" "}
                          {formatDate(dateRange.to, "MMM dd")}
                        </>
                      ) : (
                        formatDate(dateRange.from, "MMM dd")
                      )
                    ) : (
                      <span>Pick date range</span>
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
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
            )}

            {viewMode === 'week' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
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
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    W{getWeekNumber(dateRange.from || new Date())}, {selectedDate.getFullYear()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(dateRange.from || new Date(), 'MMM dd')} - {formatDate(dateRange.to || new Date(), 'MMM dd')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
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
                  <FiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {viewMode === 'month' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
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
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formatDate(selectedDate, 'MMM yyyy')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
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
                  <FiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-3 md:mt-4">
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Attendance Records</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Showing {filteredData.length} records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Employee</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Check In</TableHead>
                      <TableHead className="whitespace-nowrap">Check Out</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Hours</TableHead>
                      {!isMobile && <TableHead className="whitespace-nowrap">Location</TableHead>}
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 7 : 8} className="text-center py-8 text-muted-foreground">
                          No attendance records found for the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((record) => {
                        const user = users.find(u => u.username === record.userName);
                        return (
                          <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2 md:gap-3 min-w-[150px]">
                                {user?.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FiUser className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-xs md:text-sm truncate">
                                    {user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName}
                                  </p>
                                  {!isMobile && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {user?.position || 'N/A'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div>
                                <p className="font-medium text-xs md:text-sm">{formatDate(new Date(record.date), 'MMM dd')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(new Date(record.date), 'EEE')}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1 md:gap-2">
                                <FiClock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                <span className="text-xs md:text-sm">{formatTime(record.checkIn)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1 md:gap-2">
                                <FiClock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                                <span className="text-xs md:text-sm">{formatTime(record.checkOut)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[80px]">
                                {getStatusBadge(record.status)}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="font-medium text-xs md:text-sm">
                                {record.totalHours ? record.totalHours.toFixed(1) + 'h' : 'N/A'}
                                {record.overtimeHours && record.overtimeHours > 0 && (
                                  <Badge variant="outline" className="ml-1 md:ml-2 text-xs">
                                    +{record.overtimeHours.toFixed(1)}h OT
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            {!isMobile && (
                              <TableCell className="max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                                        <FiMapPin className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">
                                          {record.checkInLocation?.address 
                                            ? record.checkInLocation.address.split(',')[0]
                                            : 'N/A'}
                                        </span>
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
                            )}
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
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
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">Employee Summary</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Attendance summary for each employee
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Employee</TableHead>
                      <TableHead className="whitespace-nowrap">Present</TableHead>
                      <TableHead className="whitespace-nowrap">Absent</TableHead>
                      <TableHead className="whitespace-nowrap">Late</TableHead>
                      <TableHead className="whitespace-nowrap">Total Days</TableHead>
                      <TableHead className="whitespace-nowrap">Avg Hours</TableHead>
                      <TableHead className="whitespace-nowrap">Attendance Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(userSummary).map(([username, summary]) => (
                      <TableRow key={username}>
                        <TableCell>
                          <div className="flex items-center gap-2 md:gap-3 min-w-[150px]">
                            {summary.user.avatar ? (
                              <img
                                src={summary.user.avatar}
                                alt={username}
                                className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <FiUser className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-xs md:text-sm truncate">
                                {summary.user.firstName} {summary.user.lastName}
                              </p>
                              {!isMobile && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {summary.user.position || summary.user.department || 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <span className="text-green-800 font-medium text-xs md:text-sm">{summary.presentDays}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <span className="text-red-800 font-medium text-xs md:text-sm">{summary.absentDays}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                            <span className="text-yellow-800 font-medium text-xs md:text-sm">{summary.lateDays}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs md:text-sm text-center">{summary.totalDays}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs md:text-sm text-center">{summary.avgHours.toFixed(1)}h</div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${summary.totalDays > 0 ? (summary.presentDays / summary.totalDays) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium whitespace-nowrap">
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
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Attendance Details</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Complete information about this attendance record
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 md:space-y-6">
              {/* Employee Info */}
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-muted rounded-lg">
                {(() => {
                  const user = users.find(u => u.username === selectedRecord.userName);
                  return (
                    <>
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <FiUser className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base md:text-lg font-semibold truncate">
                          {user ? `${user.firstName || ''} ${user.lastName || ''}` : selectedRecord.userName}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {user?.position} • {user?.department}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Attendance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Date</h4>
                  <p className="text-sm md:text-base">
                    {formatDate(new Date(selectedRecord.date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Status</h4>
                  <div>{getStatusBadge(selectedRecord.status)}</div>
                </div>

                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Check In</h4>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-base md:text-lg">{formatTime(selectedRecord.checkIn)}</span>
                  </div>
                  {selectedRecord.checkInLocation && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      <FiMapPin className="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {selectedRecord.checkInLocation.address}
                    </p>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Check Out</h4>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-base md:text-lg">{formatTime(selectedRecord.checkOut)}</span>
                  </div>
                  {selectedRecord.checkOutLocation && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      <FiMapPin className="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {selectedRecord.checkOutLocation.address}
                    </p>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Total Hours</h4>
                  <p className="text-xl md:text-2xl font-bold">
                    {selectedRecord.totalHours?.toFixed(1) || '0'} hours
                  </p>
                </div>

                {selectedRecord.overtimeHours && selectedRecord.overtimeHours > 0 && (
                  <div className="space-y-1 md:space-y-2">
                    <h4 className="font-medium text-sm md:text-base">Overtime</h4>
                    <p className="text-lg text-yellow-600">
                      +{selectedRecord.overtimeHours.toFixed(1)} hours
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Notes</h4>
                  <p className="text-sm md:text-base text-muted-foreground">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Location Map Preview */}
              {(selectedRecord.checkInLocation || selectedRecord.checkOutLocation) && (
                <div className="space-y-1 md:space-y-2">
                  <h4 className="font-medium text-sm md:text-base">Locations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {selectedRecord.checkInLocation && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">Check-in Location</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
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
                        <p className="text-xs text-muted-foreground mt-1 truncate">
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