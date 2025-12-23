import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComplaintCard } from './ComplaintCard';
import { useComplaints } from '@/hooks/useComplaints';
import { Status, Severity, Level } from '@/types/complaint';
import { Search, Filter, FileText, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

export const Dashboard = () => {
  const { complaints, isLoading } = useComplaints();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || complaint.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    escalated: complaints.filter((c) => c.status === 'Escalated').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold font-display">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-status-pending-bg border border-status-pending/20 shadow-sm">
          <div className="flex items-center gap-2 text-status-pending mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold font-display text-status-pending">{stats.pending}</p>
        </div>

        <div className="p-4 rounded-xl bg-status-escalated-bg border border-status-escalated/20 shadow-sm">
          <div className="flex items-center gap-2 text-status-escalated mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Escalated</span>
          </div>
          <p className="text-2xl font-bold font-display text-status-escalated">{stats.escalated}</p>
        </div>

        <div className="p-4 rounded-xl bg-status-resolved-bg border border-status-resolved/20 shadow-sm">
          <div className="flex items-center gap-2 text-status-resolved mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold font-display text-status-resolved">{stats.resolved}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, issue type, or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
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

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {complaints.length === 0
              ? 'No complaints yet. Submit your first complaint!'
              : 'No complaints match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
};
