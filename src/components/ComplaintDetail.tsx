import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { useToast } from '@/hooks/use-toast';
import { useComplaints } from '@/hooks/useComplaints';
import { Complaint, LEVEL_ROLES } from '@/types/complaint';
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
} from 'lucide-react';

interface ComplaintDetailProps {
  complaint: Complaint;
}

export const ComplaintDetail = ({ complaint }: ComplaintDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { escalateComplaint, resolveComplaint, submitFeedback, getComplaintById } = useComplaints();

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentComplaint = getComplaintById(complaint.id) || complaint;

  const canEscalate = currentComplaint.level !== 'Level 4' && currentComplaint.status !== 'Resolved';
  const canResolve = currentComplaint.status !== 'Resolved';
  const canGiveFeedback = currentComplaint.status === 'Resolved' && !currentComplaint.feedback;

  const handleEscalate = () => {
    escalateComplaint(currentComplaint.id);
    toast({
      title: 'Complaint Escalated',
      description: `Escalated to ${LEVEL_ROLES[currentComplaint.level === 'Level 1' ? 'Level 2' : currentComplaint.level === 'Level 2' ? 'Level 3' : 'Level 4']}`,
    });
    navigate(0);
  };

  const handleResolve = () => {
    resolveComplaint(currentComplaint.id);
    toast({
      title: 'Complaint Resolved',
      description: 'The complaint has been marked as resolved.',
    });
    setShowFeedback(true);
    navigate(0);
  };

  const handleSubmitFeedback = () => {
    if (feedbackRating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting feedback.',
        variant: 'destructive',
      });
      return;
    }

    submitFeedback(currentComplaint.id, feedbackRating, feedbackComment);
    toast({
      title: 'Feedback Submitted',
      description: 'Thank you for your feedback!',
    });
    navigate(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card overflow-hidden">
        <div className="bg-primary/5 px-4 py-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-bold text-primary text-lg">
              {currentComplaint.id}
            </span>
            <StatusBadge status={currentComplaint.status} />
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hostel</p>
                <p className="font-medium text-sm">{currentComplaint.hostel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Room</p>
                <p className="font-medium text-sm">{currentComplaint.roomNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium text-sm">{currentComplaint.studentName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Roll No</p>
                <p className="font-medium text-sm">{currentComplaint.rollNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="font-medium text-sm">
                {format(new Date(currentComplaint.createdAt), 'PPpp')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 bg-primary/10 rounded-full">
              <span className="text-sm font-medium text-primary">{currentComplaint.issueType}</span>
            </div>
            <SeverityBadge severity={currentComplaint.severity} />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Description</Label>
            <p className="mt-1 text-sm leading-relaxed">{currentComplaint.description}</p>
          </div>

          {currentComplaint.images.length > 0 && (
            <div>
              <Label className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                <ImageIcon className="h-3 w-3" />
                Attached Images
              </Label>
              <div className="flex flex-wrap gap-2">
                {currentComplaint.images.map((img, index) => (
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

          {currentComplaint.video && (
            <div>
              <Label className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                <Video className="h-3 w-3" />
                Attached Video
              </Label>
              <video
                src={currentComplaint.video}
                controls
                className="w-full max-w-sm rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Escalation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <LevelBadge level={currentComplaint.level} showRole />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {canEscalate && (
              <Button onClick={handleEscalate} variant="outline" className="flex-1">
                <ArrowUp className="h-4 w-4 mr-2" />
                Escalate to Next Level
              </Button>
            )}

            {canResolve && (
              <Button onClick={handleResolve} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(canGiveFeedback || showFeedback) && !currentComplaint.feedback && (
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

            <Button onClick={handleSubmitFeedback} className="w-full">
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      )}

      {currentComplaint.feedback && (
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
                    star <= currentComplaint.feedback!.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            {currentComplaint.feedback.comment && (
              <p className="text-sm text-muted-foreground">{currentComplaint.feedback.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted {format(new Date(currentComplaint.feedback.submittedAt), 'PPp')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
