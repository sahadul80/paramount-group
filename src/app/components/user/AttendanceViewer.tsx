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
  FiUser,
  FiEye,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Time utility functions (unchanged)
const TimeUtils = {
  formatTimeForTable: (timeValue?: string | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    try {
      let hours: number, minutes: number;
      const timeStr = timeValue.trim();
      if (/^\d{2}:\d{2}$/.test(timeStr)) {
        [hours, minutes] = timeStr.split(':').map(Number);
      } else if (timeStr.includes('T') || timeStr.includes(' ')) {
        const timePart = timeStr.split(/[T\s]/)[1] || timeStr;
        const timeMatch = timePart.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
        } else {
          return '--:--';
        }
      } else {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return '--:--';
        hours = date.getHours();
        minutes = date.getMinutes();
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')}${ampm}`;
    } catch {
      return '--:--';
    }
  },

  calculateHoursWithOvertime: (checkInTime?: string, checkOutTime?: string): { regular: number; overtime: number } => {
    if (!checkInTime || !checkOutTime) return { regular: 0, overtime: 0 };
    const getMinutes = (time: string): number => {
      const formatted = TimeUtils.formatTimeForTable(time);
      const match = formatted.match(/(\d+):(\d+)(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const inMinutes = getMinutes(checkInTime);
    const outMinutes = getMinutes(checkOutTime);
    if (inMinutes === 0 || outMinutes === 0) return { regular: 0, overtime: 0 };
    let totalMinutes = outMinutes - inMinutes;
    if (totalMinutes > 4 * 60) totalMinutes -= 60;
    const regularMinutes = Math.min(totalMinutes, 9 * 60);
    const overtimeMinutes = Math.max(totalMinutes - 9 * 60, 0);
    return {
      regular: regularMinutes / 60,
      overtime: overtimeMinutes / 60,
    };
  },
};

interface AttendanceViewerProps {
  currentUser?: User;
}

type DateRange = {
  from?: Date;
  to?: Date;
};

type ViewMode = 'day' | 'week' | 'month' | 'custom';
type ExportType = 'detailed' | 'summary';

// Date helper functions (unchanged)
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
  // State (unchanged)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: getStartOfWeek(new Date()),
    to: getEndOfWeek(new Date())
  });
  
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('detailed');
  const [isMobile, setIsMobile] = useState(false);

  // If currentUser is provided, default to that user
  useEffect(() => {
    if (currentUser) {
      setSelectedUser(currentUser.username);
    }
  }, [currentUser]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/user/attendance/get?';
        const params = new URLSearchParams();
        if (selectedUser !== 'all') params.append('username', selectedUser);
        if (viewMode === 'day') {
          params.append('date', formatDate(selectedDate, 'yyyy-MM-dd'));
        } else if (viewMode === 'custom' && dateRange.from && dateRange.to) {
          params.append('startDate', formatDate(dateRange.from, 'yyyy-MM-dd'));
          params.append('endDate', formatDate(dateRange.to, 'yyyy-MM-dd'));
        } else {
          let startDate: Date, endDate: Date;
          if (viewMode === 'week') {
            startDate = getStartOfWeek(selectedDate);
            endDate = getEndOfWeek(selectedDate);
          } else {
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

  const stats = useMemo(() => {
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.filter(r => r.status === 'absent').length;
    const lateCount = attendanceData.filter(r => r.status === 'late').length;
    const halfDayCount = attendanceData.filter(r => r.status === 'half-day').length;
    const totalHours = attendanceData.reduce((sum, record) => {
      const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
      return sum + hours.regular;
    }, 0);
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

  interface UserSummary {
    user: User;
    records: AttendanceRecord[];
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    avgHours: number;
  }

  const userSummary = useMemo<Record<string, UserSummary>>(() => {
    const summary: Record<string, UserSummary> = {};
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
      const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
      summary[record.userName].records.push(record);
      summary[record.userName].totalDays++;
      summary[record.userName].totalHours += hours.regular;
      switch (record.status) {
        case 'present': summary[record.userName].presentDays++; break;
        case 'absent': summary[record.userName].absentDays++; break;
        case 'late': summary[record.userName].lateDays++; break;
      }
    });
    Object.keys(summary).forEach(userName => {
      const s = summary[userName];
      s.avgHours = s.totalDays > 0 ? s.totalHours / s.totalDays : 0;
    });
    return summary;
  }, [attendanceData, users]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">Present</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5">Absent</Badge>;
      case 'late': return <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">Late</Badge>;
      case 'half-day': return <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5">Half Day</Badge>;
      case 'holiday': return <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5">Holiday</Badge>;
      case 'leave': return <Badge className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5">Leave</Badge>;
      default: return <Badge variant="outline" className="text-xs px-1.5 py-0.5">Unknown</Badge>;
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const now = new Date();
    switch (mode) {
      case 'day': setSelectedDate(now); break;
      case 'week': setDateRange({ from: getStartOfWeek(now), to: getEndOfWeek(now) }); break;
      case 'month': setDateRange({ from: getStartOfMonth(now), to: getEndOfMonth(now) }); break;
      case 'custom':
        if (!dateRange.from || !dateRange.to) {
          setDateRange({ from: getStartOfWeek(now), to: getEndOfWeek(now) });
        }
        break;
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0 && exportType === 'detailed') {
      toast.error('No data to export');
      return;
    }
    if (Object.keys(userSummary).length === 0 && exportType === 'summary') {
      toast.error('No summary data to export');
      return;
    }
    let headers: string[], rows: string[][];
    if (exportType === 'detailed') {
      headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Regular Hours', 'Overtime', 'Location'];
      rows = filteredData.map(record => {
        const user = users.find(u => u.username === record.userName);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName;
        const location = record.checkInLocation?.address || 'N/A';
        const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
        return [
          `"${userName}"`,
          record.date,
          TimeUtils.formatTimeForTable(record.checkIn),
          TimeUtils.formatTimeForTable(record.checkOut),
          record.status,
          hours.regular.toFixed(2),
          hours.overtime.toFixed(2),
          `"${location}"`
        ];
      });
    } else {
      headers = ['Employee', 'Present', 'Absent', 'Late', 'Total Days', 'Avg Hours', 'Attendance Rate (%)'];
      rows = Object.entries(userSummary).map(([username, summary]) => {
        const userName = `${summary.user.firstName || ''} ${summary.user.lastName || ''}`.trim() || username;
        const attendanceRate = summary.totalDays > 0 ? (summary.presentDays / summary.totalDays) * 100 : 0;
        return [
          `"${userName}"`,
          summary.presentDays.toString(),
          summary.absentDays.toString(),
          summary.lateDays.toString(),
          summary.totalDays.toString(),
          summary.avgHours.toFixed(2),
          attendanceRate.toFixed(2)
        ];
      });
    }
    const csvRows = [headers.join(','), ...rows.map(row => row.join(','))];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${exportType}-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${exportType} attendance data exported successfully`);
  };

  const handleRecordClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setViewMode('week');
    setSelectedDate(new Date());
    setDateRange({ from: getStartOfWeek(new Date()), to: getEndOfWeek(new Date()) });
    if (!currentUser) {
      setSelectedUser('all');
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    if (viewMode === 'week') {
      setDateRange({ from: getStartOfWeek(today), to: getEndOfWeek(today) });
    } else if (viewMode === 'month') {
      setDateRange({ from: getStartOfMonth(today), to: getEndOfMonth(today) });
    } else if (viewMode === 'custom') {
      setDateRange({ from: getStartOfWeek(today), to: getEndOfWeek(today) });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-border mx-auto"></div>
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
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4 px-2 md:px-0">
      {/* Header with export dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight">Attendance Tracker</h2>
          <p className="text-xs text-muted-foreground">View and manage employee attendance records</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Export type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="summary">Summary</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} size="sm" className="h-8 gap-1 text-xs">
            <FiDownload className="w-3 h-3" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="col-span-1">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-base font-bold">{stats.totalRecords}</p>
              </div>
              <FiUsers className="w-5 h-5 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Present Rate</p>
                <p className="text-base font-bold">{stats.presentPercentage.toFixed(1)}%</p>
              </div>
              <FiCheckCircle className="w-5 h-5 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Hours/Day</p>
                <p className="text-base font-bold">{stats.avgHours.toFixed(1)}h</p>
              </div>
              <FiClock className="w-5 h-5 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Late Entries</p>
                <p className="text-base font-bold">{stats.lateCount}</p>
              </div>
              <FiTrendingUp className="w-5 h-5 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with integrated filters and tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1"><FiFilter className="w-4 h-4" />Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>

            {/* User Filter - hidden if currentUser is provided */}
            {!currentUser && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.username} value={user.username} className="text-xs">{user.firstName} {user.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View Mode */}
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 w-full justify-start text-xs"><FiCalendar className="mr-2 h-3 w-3" /><span className="capitalize">{viewMode} View</span></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleViewModeChange('day')} className="text-xs">Day View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('week')} className="text-xs">Week View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('month')} className="text-xs">Month View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewModeChange('custom')} className="text-xs">Custom Range</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Select value={viewMode} onValueChange={(value: ViewMode) => handleViewModeChange(value)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="View mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day View</SelectItem>
                  <SelectItem value="week">Week View</SelectItem>
                  <SelectItem value="month">Month View</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Date Selection */}
            {viewMode === 'day' && (
              <Input type="date" value={formatDate(selectedDate, 'yyyy-MM-dd')} onChange={(e) => { const d = new Date(e.target.value + 'T00:00:00'); if (!isNaN(d.getTime())) setSelectedDate(d); }} className="h-8 text-xs" />
            )}
            {viewMode === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input type="date" value={dateRange.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : ''} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined }))} className="h-8 text-xs flex-1" placeholder="From" />
                <Input type="date" value={dateRange.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : ''} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined }))} className="h-8 text-xs flex-1" placeholder="To" />
              </div>
            )}
            {viewMode === 'week' && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setDate(nd.getDate() - 7); setSelectedDate(nd); setDateRange({ from: getStartOfWeek(nd), to: getEndOfWeek(nd) }); }}><FiChevronLeft className="h-3 w-3" /></Button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">W{getWeekNumber(dateRange.from || new Date())}, {selectedDate.getFullYear()}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{formatDate(dateRange.from || new Date(), 'MMM dd')} - {formatDate(dateRange.to || new Date(), 'MMM dd')}</p>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setDate(nd.getDate() + 7); setSelectedDate(nd); setDateRange({ from: getStartOfWeek(nd), to: getEndOfWeek(nd) }); }}><FiChevronRight className="h-3 w-3" /></Button>
              </div>
            )}
            {viewMode === 'month' && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setMonth(nd.getMonth() - 1); setSelectedDate(nd); setDateRange({ from: getStartOfMonth(nd), to: getEndOfMonth(nd) }); }}><FiChevronLeft className="h-3 w-3" /></Button>
                <div className="text-center flex-1 min-w-0"><p className="text-xs font-medium truncate">{formatDate(selectedDate, 'MMMM yyyy')}</p></div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setMonth(nd.getMonth() + 1); setSelectedDate(nd); setDateRange({ from: getStartOfMonth(nd), to: getEndOfMonth(nd) }); }}><FiChevronRight className="h-3 w-3" /></Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleGoToToday}><FiRefreshCw className="w-3 h-3 mr-1" />Today</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleResetFilters}>Reset</Button>
          </div>
        </CardContent>

        {/* Tabs inside the same card */}
        <Tabs defaultValue="detailed" className="w-full">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="detailed" className="text-xs">Detailed</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="detailed">
            <CardContent className="p-0 pt-2">
              <div className="rounded-md border-border overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table className="min-w-full">
                    <thead className="sticky top-0 bg-background z-10 border-b">
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Employee</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Date</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">In</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Out</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Status</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Hours</TableHead>
                        {!isMobile && <TableHead className="whitespace-nowrap text-xs px-2 py-1">Location</TableHead>}
                        <TableHead className="text-right whitespace-nowrap text-xs px-2 py-1">Actions</TableHead>
                      </TableRow>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isMobile ? 7 : 8} className="text-center py-4 text-xs text-muted-foreground">
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((record) => {
                          const user = users.find(u => u.username === record.userName);
                          const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
                          return (
                            <TableRow key={record.id} className="hover:bg-muted/50">
                              <TableCell className="px-2 py-1">
                                <div className="flex items-center gap-1 min-w-[120px]">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt={user.username} className="w-5 h-5 rounded-full flex-shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <FiUser className="w-3 h-3 text-primary" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs truncate">
                                      {user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap px-2 py-1">
                                <div className="text-xs">{formatDate(new Date(record.date), 'MMM dd')}<span className="text-muted-foreground ml-1">{formatDate(new Date(record.date), 'EEE')}</span></div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap px-2 py-1 text-xs">{TimeUtils.formatTimeForTable(record.checkIn)}</TableCell>
                              <TableCell className="whitespace-nowrap px-2 py-1 text-xs">{TimeUtils.formatTimeForTable(record.checkOut)}</TableCell>
                              <TableCell className="px-2 py-1"><div className="min-w-[60px]">{getStatusBadge(record.status)}</div></TableCell>
                              <TableCell className="whitespace-nowrap px-2 py-1 text-xs">
                                {hours.regular.toFixed(1)}h
                                {hours.overtime > 0 && <span className="text-amber-600 text-[10px] ml-1">+{hours.overtime.toFixed(1)}h</span>}
                              </TableCell>
                              {!isMobile && (
                                <TableCell className="max-w-[120px] px-2 py-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate cursor-help">
                                          <FiMapPin className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">{record.checkInLocation?.address ? record.checkInLocation.address.split(',')[0] : 'N/A'}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="max-w-xs">
                                        <p className="text-xs break-words">{record.checkInLocation?.address || 'No location data'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                              )}
                              <TableCell className="text-right px-2 py-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRecordClick(record)}>
                                  <FiEye className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="summary">
            <CardContent className="p-0 pt-2">
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table className="min-w-full">
                    <thead className="sticky top-0 bg-background z-10 border-b">
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Employee</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1 text-center">P</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1 text-center">A</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1 text-center">L</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1 text-center">Days</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1 text-center">Avg H</TableHead>
                        <TableHead className="whitespace-nowrap text-xs px-2 py-1">Rate</TableHead>
                      </TableRow>
                    </thead>
                    <tbody>
                      {Object.entries(userSummary).map(([username, summary]) => (
                        <TableRow key={username}>
                          <TableCell className="px-2 py-1">
                            <div className="flex items-center gap-1 min-w-[120px]">
                              {summary.user.avatar ? (
                                <img src={summary.user.avatar} alt={username} className="w-5 h-5 rounded-full flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <FiUser className="w-3 h-3 text-primary" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{summary.user.firstName} {summary.user.lastName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-2 py-1">
                            <span className="text-xs font-medium text-green-700">{summary.presentDays}</span>
                          </TableCell>
                          <TableCell className="text-center px-2 py-1">
                            <span className="text-xs font-medium text-red-700">{summary.absentDays}</span>
                          </TableCell>
                          <TableCell className="text-center px-2 py-1">
                            <span className="text-xs font-medium text-yellow-700">{summary.lateDays}</span>
                          </TableCell>
                          <TableCell className="text-center px-2 py-1 text-xs">{summary.totalDays}</TableCell>
                          <TableCell className="text-center px-2 py-1 text-xs">{summary.avgHours.toFixed(1)}h</TableCell>
                          <TableCell className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${summary.totalDays > 0 ? (summary.presentDays / summary.totalDays) * 100 : 0}%` }} />
                              </div>
                              <span className="text-xs whitespace-nowrap">{summary.totalDays > 0 ? ((summary.presentDays / summary.totalDays) * 100).toFixed(0) : '0'}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Attendance Details</DialogTitle>
            <DialogDescription className="text-xs">Complete information about this attendance record</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                {(() => {
                  const user = users.find(u => u.username === selectedRecord.userName);
                  return (
                    <>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FiUser className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate">{user ? `${user.firstName || ''} ${user.lastName || ''}` : selectedRecord.userName}</h3>
                        <p className="text-xs text-muted-foreground truncate">{user?.position} • {user?.department}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-muted-foreground">Date</span><p className="text-xs">{formatDate(new Date(selectedRecord.date), 'EEE, MMM dd, yyyy')}</p></div>
                <div><span className="text-xs text-muted-foreground">Status</span><div>{getStatusBadge(selectedRecord.status)}</div></div>
                <div>
                  <span className="text-xs text-muted-foreground">Check In</span>
                  <div className="flex items-center gap-1"><FiClock className="w-3 h-3" /><span className="text-xs">{TimeUtils.formatTimeForTable(selectedRecord.checkIn)}</span></div>
                  {selectedRecord.checkInLocation && <p className="text-[10px] text-muted-foreground truncate">{selectedRecord.checkInLocation.address?.split(',')[0]}</p>}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Check Out</span>
                  <div className="flex items-center gap-1"><FiClock className="w-3 h-3" /><span className="text-xs">{TimeUtils.formatTimeForTable(selectedRecord.checkOut)}</span></div>
                  {selectedRecord.checkOutLocation && <p className="text-[10px] text-muted-foreground truncate">{selectedRecord.checkOutLocation.address?.split(',')[0]}</p>}
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">Total Hours</span>
                  <p className="text-sm font-bold">
                    {(() => { const h = TimeUtils.calculateHoursWithOvertime(selectedRecord.checkIn, selectedRecord.checkOut); return `${h.regular.toFixed(1)}h` + (h.overtime > 0 ? ` (+${h.overtime.toFixed(1)}h OT)` : ''); })()}
                  </p>
                </div>
              </div>
              {selectedRecord.notes && (
                <div><span className="text-xs text-muted-foreground">Notes</span><p className="text-xs mt-1">{selectedRecord.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceViewer;