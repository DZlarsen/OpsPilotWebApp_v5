import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { Bell, Check, CheckCheck, AlertTriangle, Activity, ShieldAlert, X } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'task' | 'pfmea' | 'system';
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  severity?: 'critical' | 'warning' | 'info';
  href: string;
}

export default function NotificationsDropdown() {
  const { alerts, pfmeaEntries } = useBusiness();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Compute dropdown position from button — runs on open + window resize
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open]);

  // Build notifications from real data
  const notifications: Notification[] = [
    ...alerts.filter(a => !a.acknowledged).slice(0, 4).map(a => ({
      id: `notif-alert-${a.id}`,
      type: 'alert' as const,
      title: a.severity === 'critical' ? 'Critical Alert' : 'Warning Alert',
      detail: a.message,
      timestamp: a.timestamp,
      read: readIds.has(`notif-alert-${a.id}`),
      severity: a.severity as 'critical' | 'warning',
      href: '/alerts',
    })),
    ...pfmeaEntries.filter(e => e.rpn >= 100 && e.status !== 'closed').slice(0, 2).map(e => ({
      id: `notif-pfmea-${e.id}`,
      type: 'pfmea' as const,
      title: 'High-RPN Risk Item',
      detail: `${e.failureMode} — RPN ${e.rpn}`,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: readIds.has(`notif-pfmea-${e.id}`),
      severity: 'warning' as const,
      href: '/pfmea',
    })),
    {
      id: 'notif-system-1',
      type: 'system',
      title: 'Weekly Report Ready',
      detail: 'Your weekly quality report has been auto-generated and is ready for review.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: readIds.has('notif-system-1'),
      href: '/reports',
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => setReadIds(prev => new Set(prev).add(id));
  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'pfmea': return ShieldAlert;
      case 'task': return Activity;
      default: return Bell;
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-secondary/80 transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-critical px-1 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[100] w-80 sm:w-96 border border-border bg-popover shadow-2xl"
            style={{ top: pos.top, right: pos.right, borderRadius: 'var(--radius)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                notifications.map(notif => {
                  const Icon = getIcon(notif.type);
                  return (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markRead(notif.id);
                        navigate(notif.href);
                        setOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors ${
                        !notif.read ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${
                        notif.severity === 'critical' ? 'bg-status-critical/10 text-status-critical' :
                        notif.severity === 'warning' ? 'bg-status-warning/10 text-status-warning' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold">{notif.title}</p>
                          {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.detail}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(new Date(notif.timestamp), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => { navigate('/activity'); setOpen(false); }}
                className="w-full text-center text-xs text-primary hover:underline font-medium py-1"
              >
                View all activity
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
