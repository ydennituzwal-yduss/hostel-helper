import { Level, LEVEL_ROLES } from '@/types/complaint';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: Level;
  showRole?: boolean;
  className?: string;
}

export const LevelBadge = ({ level, showRole = false, className }: LevelBadgeProps) => {
  const levelClass = {
    'Level 1': 'level-1',
    'Level 2': 'level-2',
    'Level 3': 'level-3',
    'Level 4': 'level-4',
  }[level];

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className={cn('level-badge', levelClass)}>
        {level}
      </span>
      {showRole && (
        <span className="text-xs text-muted-foreground">
          {LEVEL_ROLES[level]}
        </span>
      )}
    </div>
  );
};
