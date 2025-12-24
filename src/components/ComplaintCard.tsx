// ============================================================
// COMPLAINT CARD COMPONENT
// ============================================================
// This component displays a single complaint as a clickable card.
// It shows summary info and links to the full complaint detail page.
// Now also displays assigned worker information!
// ============================================================

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { Complaint } from '@/types/complaint';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Building2, Wrench, User, Phone } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
}

export const ComplaintCard = ({ complaint }: ComplaintCardProps) => {
  return (
    <Link to={`/complaint/${complaint.id}`}>
      <Card className="glass-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Complaint ID and Status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-semibold text-primary">
                  {complaint.id}
                </span>
                <StatusBadge status={complaint.status} />
              </div>

              {/* Issue Type */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Wrench className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{complaint.issueType}</span>
              </div>

              {/* Hostel and Room Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Building2 className="h-3 w-3" />
                <span>{complaint.hostel} • Room {complaint.roomNumber}</span>
              </div>

              {/* ============================================================
                  WORKER ASSIGNMENT DISPLAY
                  ============================================================
                  Shows the assigned worker's name and phone number.
                  This info is automatically set when the complaint is created
                  or escalated to a new level.
                  ============================================================ */}
              {complaint.assignedWorkerName && (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-2 p-2 bg-primary/5 rounded-md">
                  {/* Worker Name */}
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" />
                    <span className="font-medium text-foreground">
                      {complaint.assignedWorkerName}
                    </span>
                  </div>
                  {/* Worker Phone - Clickable to make a call on mobile */}
                  {complaint.assignedWorkerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-primary" />
                      <a 
                        href={`tel:${complaint.assignedWorkerPhone}`}
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking phone
                        className="text-primary hover:underline"
                      >
                        {complaint.assignedWorkerPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Severity and Level Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={complaint.severity} />
                <LevelBadge level={complaint.level} />
              </div>

              {/* Time since creation */}
              <p className="text-xs text-muted-foreground mt-3">
                {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Arrow icon indicating clickable */}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
