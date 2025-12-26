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
import { useComplaints } from '@/hooks/useComplaints';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { StudentComplaintForm } from './StudentComplaintForm';
import { 
  Building, 
  PlusCircle, 
  ArrowLeft, 
  Phone, 
  User as UserIcon,
  AlertTriangle,
  Clock,
  FileText
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
  // ============================================================
  const [showForm, setShowForm] = useState(false);
  
  // Get complaints data and functions from our hook
  const { complaints, isLoading } = useComplaints();

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
          Either shows the complaint form OR the list of complaints
          ============================================================ */}
      <main className="container px-4 py-6">
        {showForm ? (
          // ============================================================
          // COMPLAINT FORM VIEW
          // ============================================================
          <div className="animate-fade-in">
            <Button 
              variant="ghost" 
              onClick={() => setShowForm(false)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Complaints
            </Button>
            
            <StudentComplaintForm 
              rollNumber={rollNumber}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        ) : (
          // ============================================================
          // COMPLAINTS LIST VIEW
          // ============================================================
          <div className="space-y-6 animate-fade-in">
            {/* Title and New Complaint Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold">My Complaints</h2>
                <p className="text-sm text-muted-foreground">
                  {myComplaints.length} complaint{myComplaints.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
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
                  <Button onClick={() => setShowForm(true)} className="mt-4">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Submit Your First Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // List of complaint cards
              <div className="space-y-4">
                {myComplaints.map((complaint) => {
                  const daysSince = getDaysSinceCreated(complaint.createdAt);
                  // Check if complaint was auto-escalated (escalated status)
                  const wasAutoEscalated = complaint.status === 'Escalated';

                  return (
                    <Card key={complaint.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm font-mono">
                              {complaint.id}
                            </CardTitle>
                            <p className="text-lg font-medium mt-1">
                              {complaint.issueType}
                            </p>
                          </div>
                          <StatusBadge status={complaint.status} />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Badges row */}
                        <div className="flex flex-wrap gap-2">
                          <SeverityBadge severity={complaint.severity} />
                          <LevelBadge level={complaint.level} />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>

                        {/* Auto-escalation warning message */}
                        {wasAutoEscalated && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-escalated-bg border border-status-escalated/20">
                            <AlertTriangle className="h-4 w-4 text-status-escalated mt-0.5" />
                            <p className="text-sm text-status-escalated">
                              Your complaint was auto-escalated due to delay in resolution.
                            </p>
                          </div>
                        )}

                        {/* Assigned Worker Info */}
                        {complaint.assignedWorkerName && (
                          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Assigned Worker
                            </p>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {complaint.assignedWorkerName}
                              </span>
                            </div>
                            {complaint.assignedWorkerPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <a 
                                  href={`tel:${complaint.assignedWorkerPhone}`}
                                  className="text-sm text-primary hover:underline"
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
          </div>
        )}
      </main>
    </div>
  );
};
