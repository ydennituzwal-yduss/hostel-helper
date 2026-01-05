// ============================================================
// WARDEN VIEW COMPONENT
// ============================================================
// This is what wardens see after logging in.
// They have FULL ACCESS including:
// - Full dashboard with all complaints
// - PDF report download
// - Analytics: total, pending vs resolved, escalated, severity breakdown, worker workload
// 
// BEGINNER NOTES:
// - Warden sees everything managers see PLUS analytics
// - Analytics are calculated from the complaints data
// - Uses recharts library for visualizations
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComplaints } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Status, Severity, LEVEL_WORKERS } from '@/types/complaint';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Building, 
  Search, 
  Filter,
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ArrowUpCircle,
  Phone,
  User as UserIcon,
  FileDown,
  Trash2,
  BarChart3,
  PieChartIcon
} from 'lucide-react';

interface WardenViewProps {
  onLogout: () => void;
}

export const WardenView = ({ onLogout }: WardenViewProps) => {
  const { complaints, isLoading, escalateComplaint, resolveComplaint, deleteComplaint } = useComplaints();
  const { toast } = useToast();
  
  // Filter and tab states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  // ============================================================
  // FILTER COMPLAINTS
  // ============================================================
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.hostel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || complaint.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // ============================================================
  // STATISTICS
  // ============================================================
  // IMPORTANT: Pending + Escalated = Unresolved (needs attention)
  // Escalated complaints are NOT resolved - they still need work!
  // ============================================================
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    assigned: complaints.filter((c) => c.status === 'Assigned').length,
    escalated: complaints.filter((c) => c.status === 'Escalated').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    // Unresolved = Pending + Escalated (both need attention)
    unresolved: complaints.filter((c) => c.status === 'Pending' || c.status === 'Escalated').length,
  };

  // ============================================================
  // ANALYTICS DATA
  // ============================================================
  
  // Status breakdown for pie chart
  const statusData = [
    { name: 'Pending', value: stats.pending, color: 'hsl(45, 93%, 47%)' },
    { name: 'Assigned', value: stats.assigned, color: 'hsl(217, 91%, 60%)' },
    { name: 'Escalated', value: stats.escalated, color: 'hsl(25, 95%, 53%)' },
    { name: 'Resolved', value: stats.resolved, color: 'hsl(142, 76%, 36%)' },
  ].filter(d => d.value > 0);

  // Severity breakdown
  const severityData = [
    { name: 'Normal', value: complaints.filter(c => c.severity === 'Normal').length, color: 'hsl(217, 91%, 60%)' },
    { name: 'Quick Attention', value: complaints.filter(c => c.severity === 'Needs Quick Attention').length, color: 'hsl(45, 93%, 47%)' },
    { name: 'Extreme', value: complaints.filter(c => c.severity === 'Extreme').length, color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  // Worker workload
  const workerWorkload = Object.entries(LEVEL_WORKERS).map(([level, worker]) => ({
    name: worker.name.split(' ')[0], // Shortened name
    fullName: worker.name,
    complaints: complaints.filter(c => c.assignedWorkerName === worker.name && c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.assignedWorkerName === worker.name && c.status === 'Resolved').length,
  }));

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const getDaysSinceCreated = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // ============================================================
  // PARSE AVAILABILITY TIME FROM DESCRIPTION
  // ============================================================
  // Availability time is embedded at the start of description
  // Format: [AVAILABILITY: <time>] <actual description>
  // ============================================================
  const parseAvailability = (description: string): { availability: string | null; cleanDescription: string } => {
    const match = description.match(/^\[AVAILABILITY:\s*(.+?)\]\s*/);
    if (match) {
      return {
        availability: match[1],
        cleanDescription: description.replace(match[0], ''),
      };
    }
    return { availability: null, cleanDescription: description };
  };

  const handleEscalate = async (id: string) => {
    try {
      await escalateComplaint(id);
      toast({ title: 'Complaint Escalated', description: 'Escalated to next level.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to escalate.', variant: 'destructive' });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveComplaint(id);
      toast({ title: 'Complaint Resolved', description: 'Marked as resolved.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resolve.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComplaint(id);
      toast({ title: 'Complaint Deleted', description: 'Successfully deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  // ============================================================
  // GENERATE PDF REPORT
  // ============================================================
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Hostel Complaint Report - Warden', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Complaints: ${stats.total}`, 14, 50);
    doc.text(`Pending: ${stats.pending}`, 14, 56);
    doc.text(`Assigned: ${stats.assigned}`, 14, 62);
    doc.text(`Escalated: ${stats.escalated}`, 14, 68);
    doc.text(`Resolved: ${stats.resolved}`, 14, 74);

    // All complaints table
    autoTable(doc, {
      startY: 85,
      head: [['ID', 'Hostel', 'Student', 'Issue', 'Severity', 'Status', 'Level', 'Worker', 'Days']],
      body: complaints.map((c) => [
        c.id,
        c.hostel,
        c.studentName,
        c.issueType,
        c.severity,
        c.status,
        c.level,
        c.assignedWorkerName || '-',
        getDaysSinceCreated(c.createdAt).toString(),
      ]),
      theme: 'striped',
      styles: { fontSize: 6 },
      headStyles: { fillColor: [34, 62, 108] },
    });

    doc.save(`warden-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({ title: 'Report Downloaded', description: 'PDF report saved.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none">Hostel CMS</h1>
                <p className="text-xs text-muted-foreground">Warden Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generatePDF}>
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Tabs for Dashboard and Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
              DASHBOARD TAB
              ============================================================ */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            {/* UPDATED: Added "Unresolved" card that combines Pending + Escalated */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold font-display">{stats.total}</p>
              </Card>

              {/* UNRESOLVED: Pending + Escalated combined - these need attention */}
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Unresolved</span>
                </div>
                <p className="text-2xl font-bold font-display text-destructive">{stats.unresolved}</p>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </Card>

              <Card className="p-4 bg-status-pending-bg border-status-pending/20">
                <div className="flex items-center gap-2 text-status-pending mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold font-display text-status-pending">{stats.pending}</p>
              </Card>

              <Card className="p-4 bg-status-escalated-bg border-status-escalated/20">
                <div className="flex items-center gap-2 text-status-escalated mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Escalated</span>
                </div>
                <p className="text-2xl font-bold font-display text-status-escalated">{stats.escalated}</p>
              </Card>

              <Card className="p-4 bg-status-resolved-bg border-status-resolved/20">
                <div className="flex items-center gap-2 text-status-resolved mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Resolved</span>
                </div>
                <p className="text-2xl font-bold font-display text-status-resolved">{stats.resolved}</p>
              </Card>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Filter className="h-4 w-4 text-muted-foreground mt-2" />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | 'all')}>
                  <SelectTrigger className="w-[140px] bg-card">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | 'all')}>
                  <SelectTrigger className="w-[160px] bg-card">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Needs Quick Attention">Quick Attention</SelectItem>
                    <SelectItem value="Extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Complaints List */}
            {filteredComplaints.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No complaints found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => {
                  const daysSince = getDaysSinceCreated(complaint.createdAt);
                  const canEscalate = complaint.level !== 'Level 4' && complaint.status !== 'Resolved';
                  const canResolve = complaint.status !== 'Resolved';
                  const canDelete = complaint.status === 'Resolved';
                  // Parse availability time from description
                  const { availability, cleanDescription } = parseAvailability(complaint.description);

                  return (
                    <Card key={complaint.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <CardTitle className="text-sm font-mono">{complaint.id}</CardTitle>
                            <p className="text-lg font-medium mt-1">{complaint.issueType}</p>
                            <p className="text-sm text-muted-foreground">
                              {complaint.hostel} - Room {complaint.roomNumber}
                            </p>
                          </div>
                          <StatusBadge status={complaint.status} />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <SeverityBadge severity={complaint.severity} />
                          <LevelBadge level={complaint.level} />
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {daysSince}d ago
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{complaint.studentName}</span> ({complaint.rollNumber})
                        </p>

                        {/* Student Availability Time (if provided) - read-only for warden */}
                        {availability && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Student Available:</span>
                            <span className="font-medium">{availability}</span>
                          </div>
                        )}

                        {complaint.assignedWorkerName && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm">{complaint.assignedWorkerName}</span>
                              </div>
                              {complaint.assignedWorkerPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-primary" />
                                  <span className="text-sm">{complaint.assignedWorkerPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {canEscalate && (
                            <Button size="sm" variant="outline" onClick={() => handleEscalate(complaint.id)}
                              className="text-status-escalated border-status-escalated/30">
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                          {canResolve && (
                            <Button size="sm" variant="outline" onClick={() => handleResolve(complaint.id)}
                              className="text-status-resolved border-status-resolved/30">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="outline" onClick={() => handleDelete(complaint.id)}
                              className="text-destructive border-destructive/30">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ============================================================
              ANALYTICS TAB
              ============================================================ */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="p-4 text-center">
                <p className="text-3xl font-bold font-display text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-3xl font-bold font-display text-status-pending">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-3xl font-bold font-display text-status-assigned">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-3xl font-bold font-display text-status-escalated">{stats.escalated}</p>
                <p className="text-xs text-muted-foreground">Escalated</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-3xl font-bold font-display text-status-resolved">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Pie Chart */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" />
                    Pending vs Resolved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data</p>
                  )}
                </CardContent>
              </Card>

              {/* Severity Breakdown */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Severity Breakdown
                  </CardTitle>
                </CardHeader>
                {/* Prevent SVG labels/overflow from overlapping content below */}
                <CardContent className="overflow-hidden">
                  {severityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="45%"
                          innerRadius={40}
                          outerRadius={78}
                          dataKey="value"
                          labelLine={false}
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Worker Workload */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Worker-wise Workload
                </CardTitle>
                <CardDescription>Active and resolved complaints per worker</CardDescription>
              </CardHeader>
              <CardContent>
                {/* FIX: Added barSize prop to reduce bar width and prevent overlap */}
                {/* Also added padding/margin to prevent bars from covering labels */}
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workerWorkload} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'complaints' ? 'Active' : 'Resolved']}
                      labelFormatter={(label) => workerWorkload.find(w => w.name === label)?.fullName || label}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {/* FIX: Reduced barSize to prevent overlap and added gap with barGap */}
                    <Bar dataKey="complaints" name="Active" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="resolved" name="Resolved" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
