import { Severity } from '@/types/complaint';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const severityClass = {
    Normal: 'severity-normal',
    'Needs Quick Attention': 'severity-urgent',
    Extreme: 'severity-extreme',
  }[severity];

  return (
    <span className={cn('status-badge', severityClass, className)}>
      {severity}
    </span>
  );
};
