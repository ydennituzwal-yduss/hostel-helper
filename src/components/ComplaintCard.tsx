import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { LevelBadge } from './LevelBadge';
import { Complaint } from '@/types/complaint';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Building2, Wrench } from 'lucide-react';

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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-semibold text-primary">
                  {complaint.id}
                </span>
                <StatusBadge status={complaint.status} />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Wrench className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{complaint.issueType}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Building2 className="h-3 w-3" />
                <span>{complaint.hostel} • Room {complaint.roomNumber}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={complaint.severity} />
                <LevelBadge level={complaint.level} />
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
