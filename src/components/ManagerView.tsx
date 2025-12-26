// ============================================================
// MANAGER VIEW COMPONENT
// ============================================================
// This is what managers see after logging in.
// They can:
// - View all complaints in a dashboard
// - See severity, status, level, assigned worker, days since created
// - Escalate complaints to the next level
// - Mark complaints as resolved
// - Download PDF reports
// 
// BEGINNER NOTES:
// - Manager has full access to all complaints
// - Actions are performed using Supabase updates (no page navigation)
// - PDF generation uses jspdf library
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useComplaints } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Status, Severity } from '@/types/complaint';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
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
  Trash2
} from 'lucide-react';

interface ManagerViewProps {
  onLogout: () => void;
}

export const ManagerView = ({ onLogout }: ManagerViewProps) => {
  const { complaints, isLoading, escalateComplaint, resolveComplaint, deleteComplaint } = useComplaints();
  const { toast } = useToast();
  
  // Filter states
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
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    escalated: complaints.filter((c) => c.status === 'Escalated').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  // ============================================================
  // CALCULATE DAYS SINCE CREATED
  // ============================================================
  const getDaysSinceCreated = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // ============================================================
  // HANDLE ESCALATION
  // ============================================================
  // This function escalates a complaint to the next level.
  // It uses Supabase update directly - NO page navigation!
  // ============================================================
  const handleEscalate = async (id: string) => {
    try {
      await escalateComplaint(id);
      toast({
        title: 'Complaint Escalated',
        description: 'The complaint has been escalated to the next level.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to escalate complaint.',
        variant: 'destructive',
      });
    }
  };

  // ============================================================
  // HANDLE RESOLVE
  // ============================================================
  const handleResolve = async (id: string) => {
    try {
      await resolveComplaint(id);
      toast({
        title: 'Complaint Resolved',
        description: 'The complaint has been marked as resolved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve complaint.',
        variant: 'destructive',
      });
    }
  };

  // ============================================================
  // HANDLE DELETE (only for resolved complaints)
  // ============================================================
  const handleDelete = async (id: string) => {
    try {
      await deleteComplaint(id);
      toast({
        title: 'Complaint Deleted',
        description: 'The resolved complaint has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete complaint.',
        variant: 'destructive',
      });
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
    doc.text('Hostel Complaint Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Complaints: ${stats.total}`, 14, 50);
    doc.text(`Pending: ${stats.pending}`, 14, 56);
    doc.text(`Escalated: ${stats.escalated}`, 14, 62);
    doc.text(`Resolved: ${stats.resolved}`, 14, 68);

    autoTable(doc, {
      startY: 80,
      head: [['ID', 'Hostel', 'Room', 'Issue', 'Severity', 'Status', 'Level', 'Worker', 'Date']],
      body: complaints.map((c) => [
        c.id,
        c.hostel,
        c.roomNumber,
        c.issueType,
        c.severity,
        c.status,
        c.level,
        c.assignedWorkerName || '-',
        format(new Date(c.createdAt), 'PP'),
      ]),
      theme: 'striped',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 62, 108] },
    });

    doc.save(`hostel-complaints-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'Report Downloaded',
      description: 'PDF report has been saved.',
    });
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
                <p className="text-xs text-muted-foreground">Manager Dashboard</p>
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

      <main className="container px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold font-display">{stats.total}</p>
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
              placeholder="Search by ID, issue, student, or hostel..."
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
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Needs Quick Attention">Needs Quick Attention</SelectItem>
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
              <p className="text-muted-foreground">
                {complaints.length === 0 ? 'No complaints yet.' : 'No complaints match your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const daysSince = getDaysSinceCreated(complaint.createdAt);
              const canEscalate = complaint.level !== 'Level 4' && complaint.status !== 'Resolved';
              const canResolve = complaint.status !== 'Resolved';
              const canDelete = complaint.status === 'Resolved';

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
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <SeverityBadge severity={complaint.severity} />
                      <LevelBadge level={complaint.level} />
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {daysSince} day{daysSince !== 1 ? 's' : ''} ago
                      </span>
                    </div>

                    {/* Student Info */}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{complaint.studentName}</span> ({complaint.rollNumber})
                    </p>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {complaint.description}
                    </p>

                    {/* Assigned Worker */}
                    {complaint.assignedWorkerName && (
                      <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Assigned Worker</p>
                        <div className="flex items-center gap-4">
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

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {canEscalate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEscalate(complaint.id)}
                          className="text-status-escalated border-status-escalated/30 hover:bg-status-escalated/10"
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Escalate
                        </Button>
                      )}
                      {canResolve && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(complaint.id)}
                          className="text-status-resolved border-status-resolved/30 hover:bg-status-resolved/10"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(complaint.id)}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
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
      </main>
    </div>
  );
};
