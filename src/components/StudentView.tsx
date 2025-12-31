// ============================================================
// STUDENT VIEW COMPONENT
// ============================================================
// This is what students see after logging in.
// They can:
// - Submit new complaints
// - View ONLY their own complaints (filtered by roll number)
// - See complaint status, assigned worker, and escalation messages
// 
// BEGINNER NOTES:
// - We use conditional rendering to show form or complaint list
// - Complaints are filtered by the student's roll number
// - Auto-escalation messages are shown for escalated complaints
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComplaints } from '@/hooks/useComplaints';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { StudentComplaintForm } from './StudentComplaintForm';
import { LEVEL_ROLES } from '@/types/complaint';
import { 
  Building, 
  PlusCircle, 
  ArrowLeft, 
  Phone, 
  User as UserIcon,
  AlertTriangle,
  Clock,
  FileText,
  Briefcase,
  List
} from 'lucide-react';
import { format } from 'date-fns';

interface StudentViewProps {
  rollNumber: string;      // The logged-in student's roll number
  onLogout: () => void;    // Callback to log out
}

export const StudentView = ({ rollNumber, onLogout }: StudentViewProps) => {
  // ============================================================
  // STATE
  // ============================================================
  // showForm: toggles between complaint form and complaint list
  // activeTab: switches between "new" (new complaint) and "my" (my complaints)
  // ============================================================
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('my');
  
  // Get complaints data and functions from our hook
  // FIX: Also get refetch function to manually refresh after submission
  const { complaints, isLoading, refetch } = useComplaints();

  // ============================================================
  // FILTER COMPLAINTS FOR THIS STUDENT
  // ============================================================
  // Students should only see their own complaints.
  // We filter by comparing the roll number (case-insensitive).
  // ============================================================
  const myComplaints = complaints.filter(
    (c) => c.rollNumber.toLowerCase() === rollNumber.toLowerCase()
  );

  // Helper function to calculate days since complaint was created
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
  // This function extracts both the availability time and clean description.
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

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================
          HEADER
          Shows app name, student roll number, and logout button
          ============================================================ */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none">Hostel CMS</h1>
                <p className="text-xs text-muted-foreground">{rollNumber}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTENT
          Uses TABS to switch between New Complaint and My Complaints
          APK-FRIENDLY: No page reloads, just tab switching
          ============================================================ */}
      <main className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'my')} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Complaint
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Complaints
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
              NEW COMPLAINT TAB
              FIX: onSuccess now refetches complaints AND switches tab.
              This ensures newly added complaints appear immediately.
              ============================================================ */}
          <TabsContent value="new" className="animate-fade-in">
            <StudentComplaintForm 
              rollNumber={rollNumber}
              onSuccess={() => {
                // FIX: Refetch complaints to include the newly added one
                refetch();
                // Then switch to "My Complaints" tab to show the new complaint
                setActiveTab('my');
              }}
            />
          </TabsContent>

          {/* ============================================================
              MY COMPLAINTS TAB
              Shows ALL complaints submitted by this student
              Includes: Complaint ID, Issue Type, Status, Level, Worker details
              ============================================================ */}
          <TabsContent value="my" className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-xl font-display font-bold">My Complaints</h2>
              <p className="text-sm text-muted-foreground">
                {myComplaints.length} complaint{myComplaints.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Complaints List */}
            {myComplaints.length === 0 ? (
              // No complaints message
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-center">
                    You haven't submitted any complaints yet.
                  </p>
                  <Button onClick={() => setActiveTab('new')} className="mt-4">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Submit Your First Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // List of complaint cards with full details
              <div className="space-y-4">
                {myComplaints.map((complaint) => {
                  const daysSince = getDaysSinceCreated(complaint.createdAt);
                  // Check if complaint was auto-escalated (escalated status)
                  const wasAutoEscalated = complaint.status === 'Escalated';
                  // Get worker role based on complaint level
                  const workerRole = LEVEL_ROLES[complaint.level];
                  // Parse availability time from description
                  const { availability, cleanDescription } = parseAvailability(complaint.description);

                  return (
                    <Card key={complaint.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* Complaint ID - clearly displayed */}
                            <CardTitle className="text-sm font-mono text-primary">
                              {complaint.id}
                            </CardTitle>
                            {/* Issue Type */}
                            <p className="text-lg font-medium mt-1">
                              {complaint.issueType}
                            </p>
                          </div>
                          {/* Status Badge - Pending/Escalated/Resolved */}
                          <StatusBadge status={complaint.status} />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Badges row - Severity and Level */}
                        <div className="flex flex-wrap gap-2">
                          <SeverityBadge severity={complaint.severity} />
                          <LevelBadge level={complaint.level} />
                        </div>

                        {/* Description - without availability tag */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {cleanDescription}
                        </p>

                        {/* Student Availability Time (if provided) */}
                        {availability && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-medium">{availability}</span>
                          </div>
                        )}

                        {/* Auto-escalation warning message */}
                        {wasAutoEscalated && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-escalated-bg border border-status-escalated/20">
                            <AlertTriangle className="h-4 w-4 text-status-escalated mt-0.5" />
                            <p className="text-sm text-status-escalated">
                              Your complaint was auto-escalated due to delay in resolution.
                            </p>
                          </div>
                        )}

                        {/* ============================================================
                            ASSIGNED WORKER CONTACT DETAILS
                            Shows: Worker Name, Role (based on level), Phone Number
                            This helps students contact the right person
                            ============================================================ */}
                        {complaint.assignedWorkerName && (
                          <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Assigned Worker Contact
                            </p>
                            
                            {/* Worker Name */}
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {complaint.assignedWorkerName}
                              </span>
                            </div>
                            
                            {/* Worker Role - Based on escalation level */}
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {workerRole}
                              </span>
                            </div>
                            
                            {/* Worker Phone - Clickable for mobile */}
                            {complaint.assignedWorkerPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <a 
                                  href={`tel:${complaint.assignedWorkerPhone}`}
                                  className="text-sm text-primary font-medium hover:underline"
                                >
                                  {complaint.assignedWorkerPhone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer with date */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(complaint.createdAt), 'PPp')}
                            {daysSince > 0 && ` (${daysSince} day${daysSince > 1 ? 's' : ''} ago)`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
