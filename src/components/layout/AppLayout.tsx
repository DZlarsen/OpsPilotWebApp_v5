import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness, businessList } from '@/contexts/BusinessContext';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import OnboardingTour, { TourTriggerButton } from '@/components/layout/OnboardingTour';
import ThemeToggle from '@/components/shared/ThemeToggle';
import OpsPilotLogo from '@/components/shared/OpsPilotLogo';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Lightbulb,
  ShieldAlert,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  LogOut,
  User,
  Building2,
  Package,
  Gauge,
  FileText,
  History,
  Search,
  ArrowRightLeft,
  Timer,
  Wrench,
  BookOpen,
  Factory,
  Shield,
  Briefcase,
  BarChart,
  Brain,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => 'items' in entry;

const navEntries: NavEntry[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Kanban Board',
    icon: ClipboardList,
    items: [
      { path: '/tasks', label: 'Task Board', icon: ClipboardList },
      { path: '/8d-reports', label: '8D Reports', icon: FileText },
      { path: '/5s-audits', label: '5S Audits', icon: Shield },
    ],
  },
  { path: '/taskmaster', label: 'Taskmaster', icon: Brain, badge: 'Pro' },
  {
    label: 'Production',
    icon: Factory,
    items: [
      { path: '/processes', label: 'Processes', icon: Activity },
      { path: '/oee', label: 'OEE', icon: Gauge },
      { path: '/downtime', label: 'Downtime', icon: Timer },
    ],
  },
  {
    label: 'Quality',
    icon: Shield,
    items: [
      { path: '/quality', label: 'Quality / SPC', icon: BarChart3 },
      { path: '/pfmea', label: 'PFMEA', icon: ShieldAlert },
      { path: '/insights', label: 'Insights', icon: Lightbulb },
    ],
  },
  {
    label: 'Operations',
    icon: Briefcase,
    items: [
      { path: '/work-orders', label: 'Work Orders', icon: Wrench },
      { path: '/bom', label: 'Bill of Materials', icon: Package },
      { path: '/documents', label: 'Documents', icon: BookOpen },
    ],
  },
  {
    label: 'Reporting',
    icon: BarChart,
    items: [
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/shift-handoff', label: 'Shift Handoff', icon: ArrowRightLeft },
      { path: '/activity', label: 'Activity Log', icon: History },
    ],
  },
  { path: '/alerts', label: 'Alerts', icon: Bell, badge: 'dynamic' },
];

// Flat list for breadcrumb lookup
const allNavItems = navEntries.flatMap(e => isGroup(e) ? e.items : [e]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeBusiness, setActiveBusinessId, alerts } = useBusiness();
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  // Auto-open groups that contain the active route
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    navEntries.forEach(entry => {
      if (isGroup(entry) && entry.items.some(i => i.path === location.pathname)) {
        initial.add(entry.label);
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette />
      <OnboardingTour externalActive={tourActive} onClose={() => setTourActive(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar border-r border-sidebar-border transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <OpsPilotLogo size={32} />
            <div className="flex flex-col leading-none">
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.25em]">Drw · 001</span>
              <span className="text-sm font-bold text-foreground tracking-tight">OpsPilot<span className="text-primary">.</span></span>
            </div>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        <nav data-tour="sidebar-nav" className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
          {navEntries.map((entry) => {
            if (isGroup(entry)) {
              const groupOpen = openGroups.has(entry.label);
              const hasActive = entry.items.some(i => i.path === location.pathname);
              const GroupIcon = entry.icon;
              return (
                <div key={entry.label} className="space-y-0.5">
                  <button
                    onClick={() => toggleGroup(entry.label)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      hasActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <GroupIcon className={`h-4 w-4 ${hasActive ? 'text-primary' : ''}`} />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${groupOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                  {groupOpen && (
                    <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                      {entry.items.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                            }`}
                          >
                            <item.icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Top-level item
            const item = entry;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
                {'badge' in item && item.badge && (
                  item.badge === 'Pro' ? (
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-gradient-to-r from-primary/20 to-chart-purple/20 text-[9px] font-bold text-primary uppercase tracking-wider">
                      Pro
                    </span>
                  ) : (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-status-critical/20 px-1.5 text-[10px] font-bold text-status-critical">
                      {item.badge === 'dynamic' ? unacknowledgedCount : item.badge}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-1">
          <TourTriggerButton onClick={() => { navigate('/dashboard'); setTourActive(true); }} />
        </div>

        <div className="border-t border-sidebar-border p-3 relative">
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute bottom-full left-2 right-2 mb-1 z-50 rounded-lg border border-border bg-popover shadow-lg p-1.5 space-y-0.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Switch Business</p>
                {businessList.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => { setActiveBusinessId(biz.id); setUserMenuOpen(false); navigate('/dashboard'); }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      activeBusiness.id === biz.id ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{biz.name}</p>
                      <p className="text-[10px] text-muted-foreground">{biz.role}</p>
                    </div>
                    {activeBusiness.id === biz.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  My Account
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/'); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-sidebar-accent/50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {activeBusiness.userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{activeBusiness.userName}</p>
              <p className="text-xs text-muted-foreground truncate">{activeBusiness.shortName}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-12 items-center gap-4 border-b border-border px-4 lg:px-6 bg-background/80 backdrop-blur-sm">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Mono breadcrumb */}
          <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground min-w-0">
            <span className="text-muted-foreground/60">OpsPilot</span>
            {allNavItems.find(n => n.path === location.pathname) && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                <span className="text-foreground truncate">
                  {allNavItems.find(n => n.path === location.pathname)?.label}
                </span>
              </>
            )}
          </nav>

          {/* Revision stamp — center-ish on wide, hidden on narrow */}
          <div className="hidden xl:flex items-center gap-3 ml-4 pl-4 border-l border-border/60">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Rev <span className="text-foreground/70">07</span>
            </span>
            <span className="h-3 w-px bg-border/60" />
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-status-ok">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok bp-blink" />
              Operational
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Live clock */}
            <span className="hidden md:inline-block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground tabular-nums px-2">
              <LiveClock />
            </span>

            {/* Search hint */}
            <button
              data-tour="search-btn"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-[var(--radius)] border border-border bg-secondary/30 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="bp-kbd ml-1">⌘K</kbd>
            </button>

            <ThemeToggle variant="icon" />

            <span data-tour="notifications">
              <NotificationsDropdown />
            </span>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 overflow-auto p-4 lg:p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ── Small live clock component (HH:MM:SS UTC) ── */
function LiveClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <>
      {pad(t.getUTCHours())}:{pad(t.getUTCMinutes())}:{pad(t.getUTCSeconds())} UTC
    </>
  );
}
