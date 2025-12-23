import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Building, ClipboardList, FileText, PlusCircle } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: ClipboardList },
  { path: '/new', label: 'New', icon: PlusCircle },
  { path: '/reports', label: 'Reports', icon: FileText },
];

export const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Hostel CMS</h1>
              <p className="text-xs text-muted-foreground">Complaint Management</p>
            </div>
          </Link>
        </div>

        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
