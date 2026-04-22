'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, User } from '@/types/users';
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
import { Skeleton } from '../ui/skeleton';

// ==================== TIME UTILITIES ====================
const TimeUtils = {
  normalizeTimeString: (timeValue?: string | Date | null): string => {
    if (!timeValue || timeValue === '--:--') return '--:--';
    let timeStr: string;
    if (typeof timeValue !== 'string') {
      try { timeStr = timeValue.toISOString(); } catch { return '--:--'; }
    } else { timeStr = timeValue; }
    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (timeStr.includes('T')) timeStr = timeStr.split('T')[1];
    if (timeStr.includes(' ')) { const parts = timeStr.split(' '); if (parts.length > 1) timeStr = parts[1]; }
    timeStr = timeStr.replace(/[Z+-].*$/, '').replace(/\.\d+$/, '');
    const match = timeStr.match(/\d{1,2}:\d{2}/);
    if (match) {
      const [h, m] = match[0].split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    return '--:--';
  },
  formatTime12h: (timeValue?: string | Date | null): string => {
    const normalized = TimeUtils.normalizeTimeString(timeValue);
    if (normalized === '--:--') return '--:--';
    const [hours, minutes] = normalized.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  },
  formatTimeForTable: (timeValue?: string | Date | null): string => {
    const normalized = TimeUtils.normalizeTimeString(timeValue);
    if (normalized === '--:--') return '--:--';
    const [hours, minutes] = normalized.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')}${ampm}`;
  },
  calculateHoursWithOvertime: (checkInTime?: string | Date | null, checkOutTime?: string | Date | null): { regular: number; overtime: number } => {
    if (!checkInTime || !checkOutTime) return { regular: 0, overtime: 0 };
    const getMinutes = (t: string | Date): number => {
      const f = TimeUtils.formatTime12h(t);
      const m = f.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const a = m[3].toUpperCase();
      if (a === 'PM' && h !== 12) h += 12;
      if (a === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    };
    const inMin = getMinutes(checkInTime);
    const outMin = getMinutes(checkOutTime);
    if (inMin === 0 || outMin === 0) return { regular: 0, overtime: 0 };
    let total = outMin - inMin;
    if (total > 4 * 60) total -= 60; // deduct lunch
    const regular = Math.min(total, 9 * 60);
    const overtime = Math.max(total - 9 * 60, 0);
    return { regular: regular / 60, overtime: overtime / 60 };
  },
};

const DateUtils = {
  formatDate: (date: Date, format: string): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    switch (format) {
      case 'yyyy-MM-dd': return `${year}-${month}-${day}`;
      case 'PPP': return `${monthNames[date.getMonth()]} ${day}, ${year}`;
      case 'LLL dd, y': return `${monthShort[date.getMonth()]} ${day}, ${year}`;
      case 'MMMM yyyy': return `${monthNames[date.getMonth()]} ${year}`;
      case 'MMM dd': return `${monthShort[date.getMonth()]} ${day}`;
      case 'EEEE': return dayNames[date.getDay()];
      case 'EEE': return dayShort[date.getDay()];
      case 'MMM dd, yyyy': return `${monthShort[date.getMonth()]} ${day}, ${year}`;
      default: return date.toLocaleDateString();
    }
  },
};

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
const getStartOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

interface AttendanceViewerProps { currentUser?: User; }
type DateRange = { from?: Date; to?: Date };
type ViewMode = 'day' | 'week' | 'month' | 'custom';
type ExportType = 'detailed' | 'summary';

const AttendanceViewer: React.FC<AttendanceViewerProps> = ({ currentUser }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ from: getStartOfWeek(new Date()), to: getEndOfWeek(new Date()) });
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('detailed');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { if (currentUser) setSelectedUser(currentUser.username); }, [currentUser]);
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
      } catch (err) { console.error(err); toast.error('Failed to load users'); }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      // Guard: custom mode requires both dates
      if (viewMode === 'custom' && (!dateRange.from || !dateRange.to)) {
        setAttendanceData([]);
        setLoading(false);
        return;
      }

      try {
        let url = '/api/user/attendance/get?';
        const params = new URLSearchParams();
        if (selectedUser !== 'all') params.append('username', selectedUser);
        if (viewMode === 'day') {
          params.append('date', DateUtils.formatDate(selectedDate, 'yyyy-MM-dd'));
        } else if (viewMode === 'custom') {
          // Both dates are guaranteed to exist here because of the guard above
          params.append('startDate', DateUtils.formatDate(dateRange.from!, 'yyyy-MM-dd'));
          params.append('endDate', DateUtils.formatDate(dateRange.to!, 'yyyy-MM-dd'));
        } else {
          let start: Date, end: Date;
          if (viewMode === 'week') {
            start = getStartOfWeek(selectedDate);
            end = getEndOfWeek(selectedDate);
          } else {
            start = getStartOfMonth(selectedDate);
            end = getEndOfMonth(selectedDate);
          }
          params.append('startDate', DateUtils.formatDate(start, 'yyyy-MM-dd'));
          params.append('endDate', DateUtils.formatDate(end, 'yyyy-MM-dd'));
        }
        url += params.toString();
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch attendance data');
        const data = await response.json();
        setAttendanceData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load attendance data');
        toast.error('Failed to load attendance records');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedUser, viewMode, selectedDate, dateRange]);

  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(r => r.status === 'present').length;
    const absent = attendanceData.filter(r => r.status === 'absent').length;
    const late = attendanceData.filter(r => r.status === 'late').length;
    const totalHours = attendanceData.reduce((sum, r) => sum + TimeUtils.calculateHoursWithOvertime(r.checkIn, r.checkOut).regular, 0);
    return {
      totalRecords: total,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      presentPercentage: total ? (present / total) * 100 : 0,
      avgHours: total ? totalHours / total : 0,
    };
  }, [attendanceData]);

  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      const user = users.find(u => u.username === record.userName);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase() : record.userName.toLowerCase();
      const dept = user?.department?.toLowerCase() || '';
      const pos = user?.position?.toLowerCase() || '';
      const q = searchQuery.toLowerCase();
      return userName.includes(q) || dept.includes(q) || pos.includes(q) || record.date.includes(q) || record.status.includes(q);
    });
  }, [attendanceData, users, searchQuery]);

  interface UserSummary { user: User; records: AttendanceRecord[]; totalDays: number; presentDays: number; absentDays: number; lateDays: number; totalHours: number; avgHours: number; }
  const userSummary = useMemo<Record<string, UserSummary>>(() => {
    const summary: Record<string, UserSummary> = {};
    filteredData.forEach(record => {   // ← FIXED: use filteredData instead of attendanceData
      if (!summary[record.userName]) {
        const user = users.find(u => u.username === record.userName);
        summary[record.userName] = {
          user: user || { username: record.userName, firstName: '', lastName: '', email: '', role: '', status: 0, createdAt: '' },
          records: [], totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, totalHours: 0, avgHours: 0
        };
      }
      const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
      const s = summary[record.userName];
      s.records.push(record);
      s.totalDays++;
      s.totalHours += hours.regular;
      if (record.status === 'present') s.presentDays++;
      else if (record.status === 'absent') s.absentDays++;
      else if (record.status === 'late') s.lateDays++;
    });
    Object.values(summary).forEach(s => s.avgHours = s.totalDays ? s.totalHours / s.totalDays : 0);
    return summary;
  }, [filteredData, users]);   // ← FIXED: dependency updated

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
    if (mode === 'day') setSelectedDate(now);
    else if (mode === 'week') setDateRange({ from: getStartOfWeek(now), to: getEndOfWeek(now) });
    else if (mode === 'month') setDateRange({ from: getStartOfMonth(now), to: getEndOfMonth(now) });
    else if (mode === 'custom' && (!dateRange.from || !dateRange.to)) setDateRange({ from: getStartOfWeek(now), to: getEndOfWeek(now) });
  };

  const handleExportCSV = () => {
    if (exportType === 'detailed' && filteredData.length === 0) { toast.error('No data to export'); return; }
    if (exportType === 'summary' && Object.keys(userSummary).length === 0) { toast.error('No summary data to export'); return; }
    let headers: string[], rows: string[][];
    if (exportType === 'detailed') {
      headers = ['Employee','Date','Check In','Check Out','Status','Regular Hours','Overtime','Check In Location','Check Out Location'];
      rows = filteredData.map(record => {
        const user = users.find(u => u.username === record.userName);
        const name = user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName;
        const inLoc = record.checkInLocation?.address || 'N/A';
        const outLoc = record.checkOutLocation?.address || 'N/A';
        const hrs = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
        return [`"${name}"`, record.date, TimeUtils.formatTimeForTable(record.checkIn), TimeUtils.formatTimeForTable(record.checkOut), record.status, hrs.regular.toFixed(2), hrs.overtime.toFixed(2), `"${inLoc}"`, `"${outLoc}"`];
      });
    } else {
      headers = ['Employee','Present','Absent','Late','Total Days','Avg Hours','Attendance Rate (%)'];
      rows = Object.entries(userSummary).map(([uname, s]) => {
        const name = `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || uname;
        const rate = s.totalDays ? (s.presentDays / s.totalDays) * 100 : 0;
        return [`"${name}"`, s.presentDays.toString(), s.absentDays.toString(), s.lateDays.toString(), s.totalDays.toString(), s.avgHours.toFixed(2), rate.toFixed(2)];
      });
    }
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${exportType}-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${exportType} attendance data exported`);
  };

  const handleRecordClick = (record: AttendanceRecord) => { setSelectedRecord(record); setShowDetailsDialog(true); };
  const handleResetFilters = () => {
    setSearchQuery('');
    setViewMode('week');
    setSelectedDate(new Date());
    setDateRange({ from: getStartOfWeek(new Date()), to: getEndOfWeek(new Date()) });
    if (!currentUser) setSelectedUser('all');
  };
  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    if (viewMode === 'week') setDateRange({ from: getStartOfWeek(today), to: getEndOfWeek(today) });
    else if (viewMode === 'month') setDateRange({ from: getStartOfMonth(today), to: getEndOfMonth(today) });
    else if (viewMode === 'custom') setDateRange({ from: getStartOfWeek(today), to: getEndOfWeek(today) });
  };

  if (loading) {
    return (
      <div className="space-y-2 px-2 md:px-0">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
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
    <TooltipProvider>
      <div className="space-y-2 px-2 md:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">Attendance Tracker</h2>
            <p className="text-sm text-muted-foreground">View and manage employee attendance records</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={exportType} onValueChange={(v: ExportType) => setExportType(v)}>
              <SelectTrigger className="h-8 w-20 text-sm">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} size="sm" className="h-8 gap-1 text-sm">
              <FiDownload className="w-3 h-3" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card><CardContent className="p-2"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-lg font-bold">{stats.totalRecords}</p></div><FiUsers className="w-6 h-6 text-primary/20" /></div></CardContent></Card>
          <Card><CardContent className="p-2"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Present</p><p className="text-lg font-bold">{stats.presentPercentage.toFixed(1)}%</p></div><FiCheckCircle className="w-6 h-6 text-green-500/20" /></div></CardContent></Card>
          <Card><CardContent className="p-2"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avg Hours</p><p className="text-lg font-bold">{stats.avgHours.toFixed(1)}h</p></div><FiClock className="w-6 h-6 text-blue-500/20" /></div></CardContent></Card>
          <Card><CardContent className="p-2"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Late</p><p className="text-lg font-bold">{stats.lateCount}</p></div><FiTrendingUp className="w-6 h-6 text-yellow-500/20" /></div></CardContent></Card>
        </div>

        {/* Main Card with Filters */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-sm flex items-center gap-1 font-medium"><FiFilter className="w-4 h-4" />Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-1 items-center">
              {/* Search */}
              <div className="relative col-span-1">
                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>

              {/* User Filter (hidden if currentUser) */}
              {!currentUser && (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Employee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map(u => <SelectItem key={u.username} value={u.username} className="text-sm">{u.firstName} {u.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {/* View Mode */}
              {isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 w-full justify-start text-sm"><FiCalendar className="mr-1 h-4 w-4" /><span className="capitalize">{viewMode}</span></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleViewModeChange('day')} className="text-sm">Day</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewModeChange('week')} className="text-sm">Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewModeChange('month')} className="text-sm">Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewModeChange('custom')} className="text-sm">Custom</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Select value={viewMode} onValueChange={(v: ViewMode) => handleViewModeChange(v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="View" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Date Selection - compact */}
              {viewMode === 'day' && (
                <Input type="date" value={DateUtils.formatDate(selectedDate, 'yyyy-MM-dd')} onChange={(e) => { const d = new Date(e.target.value + 'T00:00'); if (!isNaN(d.getTime())) setSelectedDate(d); }} className="h-8 text-sm col-span-1" />
              )}
              {viewMode === 'custom' && (
                <div className="flex gap-1 col-span-2">
                  <Input type="date" value={dateRange.from ? DateUtils.formatDate(dateRange.from, 'yyyy-MM-dd') : ''} onChange={(e) => setDateRange(p => ({ ...p, from: e.target.value ? new Date(e.target.value + 'T00:00') : undefined }))} className="h-8 text-sm flex-1" placeholder="From" />
                  <Input type="date" value={dateRange.to ? DateUtils.formatDate(dateRange.to, 'yyyy-MM-dd') : ''} onChange={(e) => setDateRange(p => ({ ...p, to: e.target.value ? new Date(e.target.value + 'T00:00') : undefined }))} className="h-8 text-sm flex-1" placeholder="To" />
                </div>
              )}
              {viewMode === 'week' && (
                <div className="flex items-center gap-1 col-span-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setDate(nd.getDate() - 7); setSelectedDate(nd); setDateRange({ from: getStartOfWeek(nd), to: getEndOfWeek(nd) }); }}><FiChevronLeft className="h-4 w-4" /></Button>
                  <div className="text-center flex-1 min-w-0"><p className="text-sm font-medium truncate">W{getWeekNumber(dateRange.from || new Date())}</p><p className="text-xs text-muted-foreground truncate">{DateUtils.formatDate(dateRange.from || new Date(), 'MMM dd')} - {DateUtils.formatDate(dateRange.to || new Date(), 'MMM dd')}</p></div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setDate(nd.getDate() + 7); setSelectedDate(nd); setDateRange({ from: getStartOfWeek(nd), to: getEndOfWeek(nd) }); }}><FiChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
              {viewMode === 'month' && (
                <div className="flex items-center gap-1 col-span-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setMonth(nd.getMonth() - 1); setSelectedDate(nd); setDateRange({ from: getStartOfMonth(nd), to: getEndOfMonth(nd) }); }}><FiChevronLeft className="h-4 w-4" /></Button>
                  <div className="text-center flex-1"><p className="text-sm font-medium truncate">{DateUtils.formatDate(selectedDate, 'MMMM yyyy')}</p></div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const nd = new Date(selectedDate); nd.setMonth(nd.getMonth() + 1); setSelectedDate(nd); setDateRange({ from: getStartOfMonth(nd), to: getEndOfMonth(nd) }); }}><FiChevronRight className="h-4 w-4" /></Button>
                </div>
              )}

              {/* Action Buttons - compact row */}
              <div className="flex justify-end gap-1 col-span-1">
                <Button variant="outline" size="sm" className="h-8 text-sm px-2" onClick={handleGoToToday}><FiRefreshCw className="w-3 h-3 mr-1" />Today</Button>
                <Button variant="ghost" size="sm" className="h-8 text-sm px-2" onClick={handleResetFilters}>Reset</Button>
              </div>
            </div>
          </CardContent>

          {/* Tabs */}
          <Tabs defaultValue="detailed" className="w-full">
            <div className="px-3">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="detailed" className="text-sm">Detailed</TabsTrigger>
                <TabsTrigger value="summary" className="text-sm">Summary</TabsTrigger>
              </TabsList>
            </div>

            {/* Detailed Tab */}
            <TabsContent value="detailed">
              <CardContent className="p-0">
                <div className="rounded-md border-t overflow-hidden">
                  <div className="max-h-100 overflow-y-auto">
                    <Table className="min-w-full">
                      <TableHeader className="sticky top-0 bg-background z-10 border-b">
                        <TableRow>
                          <TableHead className="text-sm px-3 py-2">Employee</TableHead>
                          <TableHead className="text-sm px-3 py-2">Date</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">In</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">Out</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">Status</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">Hours</TableHead>
                          {!isMobile && <TableHead className="text-sm px-3 py-2">Locations</TableHead>}
                          <TableHead className="text-right text-sm px-3 py-2">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length === 0 ? (
                          <TableRow><TableCell colSpan={isMobile ? 7 : 8} className="text-center py-4 text-sm text-muted-foreground">No records found</TableCell></TableRow>
                        ) : (
                          filteredData.map((record) => {
                            const user = users.find(u => u.username === record.userName);
                            const hours = TimeUtils.calculateHoursWithOvertime(record.checkIn, record.checkOut);
                            return (
                              <TableRow key={record.id} className="hover:bg-muted/50">
                                <TableCell className="px-3 py-2">
                                  <div className="flex items-center gap-1 min-w-25">
                                    {user?.avatar ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"><FiUser className="w-3 h-3 text-primary" /></div>}
                                    <span className="text-sm truncate" title={user ? `${user.firstName} ${user.lastName}` : record.userName}>{user ? `${user.firstName || ''} ${user.lastName || ''}` : record.userName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-3 py-2 text-sm">{DateUtils.formatDate(new Date(record.date), 'MMM dd')} <span className="text-muted-foreground">{DateUtils.formatDate(new Date(record.date), 'EEE')}</span></TableCell>
                                <TableCell className="whitespace-nowrap px-3 py-2 text-center text-sm">{TimeUtils.formatTimeForTable(record.checkIn)}</TableCell>
                                <TableCell className="whitespace-nowrap px-3 py-2 text-center text-sm">{TimeUtils.formatTimeForTable(record.checkOut)}</TableCell>
                                <TableCell className="px-3 py-2 text-center">{getStatusBadge(record.status)}</TableCell>
                                <TableCell className="whitespace-nowrap px-3 py-2 text-center text-sm">
                                  {hours.regular.toFixed(1)}h
                                  {hours.overtime > 0 && <span className="text-amber-600 text-xs ml-1">+{hours.overtime.toFixed(1)}h</span>}
                                </TableCell>
                                {!isMobile && (
                                  <TableCell className="max-w-50 px-3 py-2">
                                    <div className="space-y-1">
                                      {record.checkInLocation && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground truncate cursor-help">
                                              <FiMapPin className="w-3 h-3 shrink-0" />
                                              <span className="truncate">In: {record.checkInLocation.address?.split(',')[0]}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-xs">
                                            <p className="text-sm wrap-break-words">In: {record.checkInLocation.address}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {record.checkOutLocation && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground truncate cursor-help">
                                              <FiMapPin className="w-3 h-3 shrink-0" />
                                              <span className="truncate">Out: {record.checkOutLocation.address?.split(',')[0]}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-xs">
                                            <p className="text-sm wrap-break-words">Out: {record.checkOutLocation.address}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {!record.checkInLocation && !record.checkOutLocation && (
                                        <span className="text-sm text-muted-foreground">N/A</span>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                                <TableCell className="text-right px-3 py-2">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRecordClick(record)}>
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
                </div>
              </CardContent>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <CardContent className="p-0">
                <div className="rounded-md border-t overflow-hidden">
                  <div className="max-h-100 overflow-y-auto">
                    <Table className="min-w-full">
                      <TableHeader className="sticky top-0 bg-background z-10 border-b">
                        <TableRow>
                          <TableHead className="text-sm px-3 py-2">Employee</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">P</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">A</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">L</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">Days</TableHead>
                          <TableHead className="text-sm px-3 py-2 text-center">Avg H</TableHead>
                          <TableHead className="text-sm px-3 py-2">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(userSummary).map(([username, s]) => (
                          <TableRow key={username}>
                            <TableCell className="px-3 py-2">
                              <div className="flex items-center gap-1 min-w-25">
                                {s.user.avatar ? <img src={s.user.avatar} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"><FiUser className="w-3 h-3 text-primary" /></div>}
                                <span className="text-sm truncate" title={`${s.user.firstName} ${s.user.lastName}`}>{s.user.firstName} {s.user.lastName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-3 py-2 text-sm font-medium text-green-700">{s.presentDays}</TableCell>
                            <TableCell className="text-center px-3 py-2 text-sm font-medium text-red-700">{s.absentDays}</TableCell>
                            <TableCell className="text-center px-3 py-2 text-sm font-medium text-yellow-700">{s.lateDays}</TableCell>
                            <TableCell className="text-center px-3 py-2 text-sm">{s.totalDays}</TableCell>
                            <TableCell className="text-center px-3 py-2 text-sm">{s.avgHours.toFixed(1)}h</TableCell>
                            <TableCell className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <div className="w-16 bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${s.totalDays ? (s.presentDays / s.totalDays) * 100 : 0}%` }} /></div>
                                <span className="text-sm whitespace-nowrap">{s.totalDays ? ((s.presentDays / s.totalDays) * 100).toFixed(0) : '0'}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
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
            <DialogHeader><DialogTitle className="text-base">Attendance Details</DialogTitle><DialogDescription className="text-sm">Complete information about this attendance record</DialogDescription></DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  {(() => {
                    const user = users.find(u => u.username === selectedRecord.userName);
                    return (<>
                      {user?.avatar ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FiUser className="w-5 h-5 text-primary" /></div>}
                      <div className="min-w-0 flex-1"><h3 className="text-base font-semibold truncate">{user ? `${user.firstName || ''} ${user.lastName || ''}` : selectedRecord.userName}</h3><p className="text-sm text-muted-foreground truncate">{user?.position} • {user?.department}</p></div>
                    </>);
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-muted-foreground">Date</span><p className="text-sm">{DateUtils.formatDate(new Date(selectedRecord.date), 'EEE, MMM dd, yyyy')}</p></div>
                  <div><span className="text-xs text-muted-foreground">Status</span><div className="mt-1">{getStatusBadge(selectedRecord.status)}</div></div>
                  <div><span className="text-xs text-muted-foreground">Check In</span><div className="flex items-center gap-1 mt-1"><FiClock className="w-4 h-4" /><span className="text-sm">{TimeUtils.formatTime12h(selectedRecord.checkIn)}</span></div>{selectedRecord.checkInLocation && <p className="text-xs text-muted-foreground mt-1 truncate" title={selectedRecord.checkInLocation.address}>{selectedRecord.checkInLocation.address}</p>}</div>
                  <div><span className="text-xs text-muted-foreground">Check Out</span><div className="flex items-center gap-1 mt-1"><FiClock className="w-4 h-4" /><span className="text-sm">{TimeUtils.formatTime12h(selectedRecord.checkOut)}</span></div>{selectedRecord.checkOutLocation && <p className="text-xs text-muted-foreground mt-1 truncate" title={selectedRecord.checkOutLocation.address}>{selectedRecord.checkOutLocation.address}</p>}</div>
                  <div className="col-span-2"><span className="text-xs text-muted-foreground">Total Hours</span><p className="text-base font-bold mt-1">{(() => { const h = TimeUtils.calculateHoursWithOvertime(selectedRecord.checkIn, selectedRecord.checkOut); return `${h.regular.toFixed(1)}h` + (h.overtime > 0 ? ` (+${h.overtime.toFixed(1)}h OT)` : ''); })()}</p></div>
                </div>
                {selectedRecord.notes && <div><span className="text-xs text-muted-foreground">Notes</span><p className="text-sm mt-1">{selectedRecord.notes}</p></div>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AttendanceViewer;