import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Activity, BarChart3, Lightbulb, ShieldAlert, Bell, Settings, ClipboardList,
  Package, Gauge, FileText, History, Search,
} from 'lucide-react';

const pages = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview kpi' },
  { path: '/processes', label: 'Processes', icon: Activity, keywords: 'manufacturing lines monitoring' },
  { path: '/quality', label: 'Quality / SPC', icon: BarChart3, keywords: 'control chart cpk defect' },
  { path: '/insights', label: 'Insights', icon: Lightbulb, keywords: 'recommendations improvement' },
  { path: '/pfmea', label: 'PFMEA', icon: ShieldAlert, keywords: 'failure mode risk rpn' },
  { path: '/tasks', label: 'Kanban Board', icon: ClipboardList, keywords: 'task tracking board' },
  { path: '/bom', label: 'Bill of Materials', icon: Package, keywords: 'parts components genealogy' },
  { path: '/oee', label: 'OEE Dashboard', icon: Gauge, keywords: 'equipment effectiveness availability' },
  { path: '/alerts', label: 'Alerts', icon: Bell, keywords: 'notifications warnings critical' },
  { path: '/reports', label: 'Reports', icon: FileText, keywords: 'export pdf download' },
  { path: '/activity', label: 'Activity Log', icon: History, keywords: 'audit trail history' },
  { path: '/settings', label: 'Settings', icon: Settings, keywords: 'profile preferences theme' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { processes, alerts, pfmeaEntries } = useBusiness();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const goTo = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, processes, alerts..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map(p => (
            <CommandItem key={p.path} onSelect={() => goTo(p.path)} keywords={[p.keywords]}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Processes">
          {processes.slice(0, 6).map(proc => (
            <CommandItem key={proc.id} onSelect={() => goTo('/processes')} keywords={[proc.category, proc.owner]}>
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
              {proc.name}
              <span className="ml-auto text-[10px] text-muted-foreground">{proc.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Alerts">
          {alerts.filter(a => !a.acknowledged).slice(0, 4).map(alert => (
            <CommandItem key={alert.id} onSelect={() => goTo('/alerts')} keywords={[alert.type, alert.severity]}>
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{alert.message}</span>
              <span className={`ml-auto text-[10px] font-semibold ${alert.severity === 'critical' ? 'text-status-critical' : 'text-status-warning'}`}>
                {alert.severity}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="PFMEA Items">
          {pfmeaEntries.filter(e => e.status !== 'closed').slice(0, 4).map(entry => (
            <CommandItem key={entry.id} onSelect={() => goTo('/pfmea')} keywords={[entry.failureMode, entry.owner]}>
              <ShieldAlert className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{entry.failureMode}</span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">RPN {entry.rpn}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
