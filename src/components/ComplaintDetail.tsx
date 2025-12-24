// ============================================================
// COMPLAINT DETAIL COMPONENT
// ============================================================
// This component shows the full details of a single complaint.
// It includes:
// - Complaint info (hostel, room, student, etc.)
// - Issue details (type, severity, description, attachments)
// - Escalation controls (escalate button, current level)
// - Worker assignment info (name and phone)
// - Feedback form (for resolved complaints)
// - Delete button (only for resolved complaints)
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { useToast } from '@/hooks/use-toast';
import { useComplaints } from '@/hooks/useComplaints';
import { Complaint, LEVEL_ROLES, LEVEL_WORKERS } from '@/types/complaint';
import { format } from 'date-fns';
import {
  ArrowUp,
  CheckCircle2,
  Building2,
  User,
  Hash,
  Calendar,
  MessageSquare,
  Star,
  Image as ImageIcon,
  Video,
  Phone,
  Trash2,
} from 'lucide-react';

interface ComplaintDetailProps {
  complaint: Complaint;
}

export const ComplaintDetail = ({ complaint }: ComplaintDetailProps) => {
  // ============================================================
  // HOOKS AND STATE
  // ============================================================
  // useToast: Shows notification messages (success, error, etc.)
  // useComplaints: Our custom hook with all complaint operations
  // ============================================================
  const { toast } = useToast();
  const { escalateComplaint, resolveComplaint, submitFeedback, deleteComplaint, refetch } = useComplaints();

  // Local state for feedback form
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // PERMISSION CHECKS
  // ============================================================
  // These booleans determine which actions are available:
  // - canEscalate: Can only escalate if not Level 4 and not Resolved
  // - canResolve: Can only resolve if not already Resolved
  // - canGiveFeedback: Can only give feedback if Resolved and no feedback yet
  // - canDelete: Can only delete if status is Resolved
  // ============================================================
  const canEscalate = complaint.level !== 'Level 4' && complaint.status !== 'Resolved';
  const canResolve = complaint.status !== 'Resolved';
  const canGiveFeedback = complaint.status === 'Resolved' && !complaint.feedback;
  const canDelete = complaint.status === 'Resolved';

  // ============================================================
  // ESCALATE HANDLER
  // ============================================================
  // ⚠️ FIX FOR 404 ERROR:
  // This handler calls escalateComplaint() which updates the database
  // directly using Supabase. It does NOT navigate to any new page.
  // 
  // The old code might have used navigate('/escalate') or similar,
  // which would cause a 404 on Vercel because that route doesn't exist.
  // 
  // Now we:
  // 1. Call escalateComplaint() - updates Supabase directly
  // 2. Call refetch() - refreshes the complaint list
  // 3. Stay on the same page - user sees updated data
  // ============================================================
  const handleEscalate = async () => {
    setIsLoading(true);
    try {
      // This updates the database directly - no page navigation!
      await escalateComplaint(complaint.id);
      
      // Determine the next level for the toast message
      const nextLevel = complaint.level === 'Level 1' ? 'Level 2' 
        : complaint.level === 'Level 2' ? 'Level 3' 
        : 'Level 4';
      
      // Get the worker assigned to the next level
      const worker = LEVEL_WORKERS[nextLevel];
      
      // Show success message with new worker info
      toast({
        title: 'Complaint Escalated',
        description: `Escalated to ${LEVEL_ROLES[nextLevel]}. Assigned to ${worker.name} (${worker.phone})`,
      });
      
      // Refresh data to show updated complaint
      await refetch();
    } catch (error) {
      // Show error message if something went wrong
      toast({
        title: 'Error',
        description: 'Failed to escalate complaint.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESOLVE HANDLER
  // ============================================================
  const handleResolve = async () => {
    setIsLoading(true);
    try {
      await resolveComplaint(complaint.id);
      toast({
        title: 'Complaint Resolved',
        description: 'The complaint has been marked as resolved.',
      });
      setShowFeedback(true);
      await refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve complaint.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // DELETE HANDLER
  // ============================================================
  // This function deletes a resolved complaint from the database.
  // 
  // WHY ONLY RESOLVED COMPLAINTS?
  // - Active complaints should not be deleted accidentally
  // - Once resolved, users may want to clean up old complaints
  // - The RLS policy in the database enforces this rule server-side
  // ============================================================
  const handleDelete = async () => {
    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete from database - this uses supabase.delete()
      await deleteComplaint(complaint.id);
      
      toast({
        title: 'Complaint Deleted',
        description: 'The complaint has been permanently deleted.',
      });
      
      // Navigate back to the main list since this complaint no longer exists
      window.location.href = '/';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete complaint.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // FEEDBACK HANDLER
  // ============================================================
  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting feedback.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await submitFeedback(complaint.id, feedbackRating, feedbackComment);
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
      await refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============================================================
          COMPLAINT HEADER CARD
          Shows ID, status, hostel, room, student info, date
          ============================================================ */}
      <Card className="glass-card overflow-hidden">
        <div className="bg-primary/5 px-4 py-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-bold text-primary text-lg">
              {complaint.id}
            </span>
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hostel</p>
                <p className="font-medium text-sm">{complaint.hostel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Room</p>
                <p className="font-medium text-sm">{complaint.roomNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium text-sm">{complaint.studentName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Roll No</p>
                <p className="font-medium text-sm">{complaint.rollNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="font-medium text-sm">
                {format(new Date(complaint.createdAt), 'PPpp')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================
          ISSUE DETAILS CARD
          Shows issue type, severity, description, and attachments
          ============================================================ */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 bg-primary/10 rounded-full">
              <span className="text-sm font-medium text-primary">{complaint.issueType}</span>
            </div>
            <SeverityBadge severity={complaint.severity} />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Description</Label>
            <p className="mt-1 text-sm leading-relaxed">{complaint.description}</p>
          </div>

          {complaint.images.length > 0 && (
            <div>
              <Label className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                <ImageIcon className="h-3 w-3" />
                Attached Images
              </Label>
              <div className="flex flex-wrap gap-2">
                {complaint.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Attachment ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(img, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {complaint.video && (
            <div>
              <Label className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                <Video className="h-3 w-3" />
                Attached Video
              </Label>
              <video
                src={complaint.video}
                controls
                className="w-full max-w-sm rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================
          WORKER ASSIGNMENT CARD
          Shows the currently assigned worker's name and phone number.
          This information is automatically updated when the complaint
          is created or escalated to a new level.
          ============================================================ */}
      {complaint.assignedWorkerName && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assigned Worker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{complaint.assignedWorkerName}</p>
                {complaint.assignedWorkerPhone && (
                  <a 
                    href={`tel:${complaint.assignedWorkerPhone}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {complaint.assignedWorkerPhone}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================
          ESCALATION STATUS CARD
          Shows current level and provides escalate/resolve buttons.
          ⚠️ The Escalate button now uses direct Supabase update,
          not page navigation. This prevents the 404 error on Vercel.
          ============================================================ */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Escalation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <LevelBadge level={complaint.level} showRole />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Escalate Button - Updates Supabase directly, no navigation */}
            {canEscalate && (
              <Button onClick={handleEscalate} variant="outline" className="flex-1" disabled={isLoading}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Escalate to Next Level
              </Button>
            )}

            {/* Resolve Button */}
            {canResolve && (
              <Button onClick={handleResolve} className="flex-1" disabled={isLoading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}

            {/* ============================================================
                DELETE BUTTON - Only for resolved complaints!
                ============================================================
                Why only for resolved complaints?
                - Prevents accidental deletion of active issues
                - Keeps history until the problem is actually fixed
                - Matches our database RLS policy
                ============================================================ */}
            {canDelete && (
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                className="flex-1" 
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Complaint
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================
          FEEDBACK FORM
          Only shown when complaint is resolved and no feedback yet
          ============================================================ */}
      {(canGiveFeedback || showFeedback) && !complaint.feedback && (
        <Card className="glass-card animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Rate your experience</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= feedbackRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Comments (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Share your experience..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="bg-background resize-none"
              />
            </div>

            <Button onClick={handleSubmitFeedback} className="w-full" disabled={isLoading}>
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ============================================================
          FEEDBACK DISPLAY
          Shows submitted feedback if it exists
          ============================================================ */}
      {complaint.feedback && (
        <Card className="glass-card border-status-resolved/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2 text-status-resolved">
              <CheckCircle2 className="h-5 w-5" />
              Feedback Received
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= complaint.feedback!.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            {complaint.feedback.comment && (
              <p className="text-sm text-muted-foreground">{complaint.feedback.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted {format(new Date(complaint.feedback.submittedAt), 'PPp')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
