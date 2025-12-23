import { Status } from '@/types/complaint';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusClass = {
    Pending: 'status-pending',
    Assigned: 'status-assigned',
    Escalated: 'status-escalated',
    Resolved: 'status-resolved',
  }[status];

  return (
    <span className={cn('status-badge', statusClass, className)}>
      {status}
    </span>
  );
};
