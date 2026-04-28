import { useState, useEffect } from 'react';
import { useBusiness, businessList } from '@/contexts/BusinessContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Building2, Bell, Palette, Shield, Save, Check, Moon, Sun, Monitor,
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'profile' | 'workspace' | 'notifications' | 'appearance';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Settings() {
  const { activeBusiness, setActiveBusinessId, owners } = useBusiness();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [displayName, setDisplayName] = useState(activeBusiness.userName);
  const [email, setEmail] = useState(`${activeBusiness.userName.toLowerCase().replace(/\s/g, '.')}@${activeBusiness.shortName.toLowerCase().replace(/\s/g, '')}.com`);
  const [role, setRole] = useState(activeBusiness.role);
  const [initials, setInitials] = useState(activeBusiness.userInitials);

  // Notification prefs
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifSPC, setNotifSPC] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifPFMEA, setNotifPFMEA] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);

  // Appearance — persist to localStorage
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('opspilot-theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('opspilot-theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    setDisplayName(activeBusiness.userName);
    setEmail(`${activeBusiness.userName.toLowerCase().replace(/\s/g, '.')}@${activeBusiness.shortName.toLowerCase().replace(/\s/g, '')}.com`);
    setRole(activeBusiness.role);
    setInitials(activeBusiness.userInitials);
  }, [activeBusiness.id]);

  const inputClass = 'w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wider';

  const handleSave = () => {
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="page-header flex items-center gap-3 mb-2">
            <span className="page-callout">19</span>
            <span className="page-eyebrow">System · Settings</span>
          </div>
          <h1 className="page-title">Settings</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-2">Manage your profile, workspace, and preferences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab nav */}
        <nav className="flex lg:flex-col gap-1 lg:w-48 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="kpi-card space-y-5">
                <h3 className="section-header">Profile Information</h3>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary border-2 border-primary/20">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{role} at {activeBusiness.shortName}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Display Name</label>
                    <input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Initials</label>
                    <input className={inputClass} value={initials} maxLength={3} onChange={e => setInitials(e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Role</label>
                    <input className={inputClass} value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Save className="h-4 w-4" /> Save Changes
                  </button>
                </div>
              </div>

              <div className="kpi-card space-y-4">
                <h3 className="section-header flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /> Security</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Current Password</label>
                    <input className={inputClass} type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>New Password</label>
                    <input className={inputClass} type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => toast.success('Password updated')} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 border border-border transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Workspace */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div className="kpi-card space-y-4">
                <h3 className="section-header">Active Workspace</h3>
                <div className="space-y-2">
                  {businessList.map(biz => (
                    <button
                      key={biz.id}
                      onClick={() => { setActiveBusinessId(biz.id); navigate('/dashboard'); }}
                      className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 border transition-colors ${
                        activeBusiness.id === biz.id
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:border-primary/20 hover:bg-secondary/30'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        activeBusiness.id === biz.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {biz.userInitials}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">{biz.name}</p>
                        <p className="text-xs text-muted-foreground">{biz.role} · {biz.lines} lines</p>
                      </div>
                      {activeBusiness.id === biz.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="kpi-card space-y-4">
                <h3 className="section-header">Team Members</h3>
                <div className="space-y-2">
                  {owners.map(owner => (
                    <div key={owner} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/30 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{owner}</p>
                        <p className="text-[10px] text-muted-foreground">Team Member</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-ok/10 text-status-ok font-medium">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="kpi-card space-y-4">
                <h3 className="section-header">Alert Categories</h3>
                <p className="text-xs text-muted-foreground -mt-2">Choose which types of alerts you want to receive</p>
                {[
                  { label: 'Process Alerts', desc: 'SPC out-of-control, process drift, equipment alarms', state: notifAlerts, set: setNotifAlerts },
                  { label: 'SPC Violations', desc: 'Control limit breaches, Western Electric rules', state: notifSPC, set: setNotifSPC },
                  { label: 'Task Updates', desc: 'Assignments, status changes, comments on your tasks', state: notifTasks, set: setNotifTasks },
                  { label: 'PFMEA Changes', desc: 'RPN threshold alerts, action item assignments', state: notifPFMEA, set: setNotifPFMEA },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.state)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.state ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        item.state ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="kpi-card space-y-4">
                <h3 className="section-header">Delivery Channels</h3>
                {[
                  { label: 'In-App Notifications', desc: 'Show alerts in the notification center', state: notifInApp, set: setNotifInApp },
                  { label: 'Email Digest', desc: 'Daily summary of unacknowledged alerts', state: notifEmail, set: setNotifEmail },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.state)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.state ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        item.state ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Save className="h-4 w-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="kpi-card space-y-4">
                <h3 className="section-header">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                    { id: 'light', label: 'Light', icon: Sun, desc: 'Classic bright mode' },
                    { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                        theme === opt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/20 hover:bg-secondary/30'
                      }`}
                    >
                      <opt.icon className={`h-6 w-6 ${theme === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="kpi-card space-y-4">
                <h3 className="section-header">Data Display</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Date Format</label>
                    <select className={inputClass} defaultValue="mdy">
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="ymd">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Number Format</label>
                    <select className={inputClass} defaultValue="us">
                      <option value="us">1,234.56</option>
                      <option value="eu">1.234,56</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Time Zone</label>
                    <select className={inputClass} defaultValue="est">
                      <option value="est">Eastern (ET)</option>
                      <option value="cst">Central (CT)</option>
                      <option value="mst">Mountain (MT)</option>
                      <option value="pst">Pacific (PT)</option>
                      <option value="utc">UTC</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Default Chart Points</label>
                    <select className={inputClass} defaultValue="50">
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Save className="h-4 w-4" /> Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
