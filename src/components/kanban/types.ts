export type TaskStatus = 'not-started' | 'in-progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'task' | 'bug' | '8d-report' | '5s-audit' | 'improvement';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  system?: boolean; // auto-generated activity log entry
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface EightDStep {
  label: string;
  description: string;
  notes: string;
  completed: boolean;
}

export interface FiveSScore {
  category: 'Sort' | 'Set in Order' | 'Shine' | 'Standardize' | 'Sustain';
  score: number; // 1-5
  notes: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  process: string;
  dueDate: string;
  createdAt: string;
  tags: string[];
  comments: Comment[];
  type?: TaskType;
  subtasks?: Subtask[];
  eightDSteps?: EightDStep[];
  fiveSScores?: FiveSScore[];
}

export const taskTypes: { id: TaskType; label: string; color: string }[] = [
  { id: 'task', label: 'Task', color: 'text-primary' },
  { id: 'bug', label: 'Bug', color: 'text-status-critical' },
  { id: '8d-report', label: '8D Report', color: 'text-status-warning' },
  { id: '5s-audit', label: '5S Audit', color: 'text-status-ok' },
  { id: 'improvement', label: 'Improvement', color: 'text-accent-foreground' },
];

export const owners = ['Mike Chen', 'Sarah Kim', 'James Rivera', 'Lisa Park', 'Alex Thompson', 'Maria Santos'];
export const processOptions = ['CNC Machining', 'Injection Molding', 'Final Assembly', 'Packaging', 'Inspection', 'Heat Treatment'];

export const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'not-started', label: 'To Do', color: 'bg-muted-foreground' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-status-warning' },
  { id: 'completed', label: 'Done', color: 'bg-status-ok' },
];

export const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const PIE_COLORS = ['hsl(215, 15%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)'];

export const defaultEightDSteps: EightDStep[] = [
  { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: '', completed: false },
  { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: '', completed: false },
  { label: 'D3: Interim Containment', description: 'Implement containment actions to protect the customer', notes: '', completed: false },
  { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: '', completed: false },
  { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
  { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
  { label: 'D7: Prevention', description: 'Prevent recurrence — update systems and procedures', notes: '', completed: false },
  { label: 'D8: Closure', description: 'Recognize team contributions and close the report', notes: '', completed: false },
];

export const defaultFiveSScores: FiveSScore[] = [
  { category: 'Sort', score: 0, notes: '' },
  { category: 'Set in Order', score: 0, notes: '' },
  { category: 'Shine', score: 0, notes: '' },
  { category: 'Standardize', score: 0, notes: '' },
  { category: 'Sustain', score: 0, notes: '' },
];

export const initialTasks: Task[] = [
  { id: 't1', key: 'OP-1', title: 'Calibrate CNC tool offset sensor', description: 'Recalibrate tool offset sensor on Haas ST-20Y. Last calibration was 45 days ago — overdue per SOP.', status: 'in-progress', priority: 'high', owner: 'Mike Chen', process: 'CNC Machining', dueDate: '2026-04-12', createdAt: '2026-04-02', tags: ['Maintenance', 'SOP'], type: 'task', comments: [{ id: 'c1', author: 'Mike Chen', text: 'Sensor drift confirmed at 0.003mm. Ordering replacement probe.', timestamp: '2026-04-05T10:30:00' }], subtasks: [{ id: 'st1', text: 'Order replacement probe', completed: true }, { id: 'st2', text: 'Run calibration routine', completed: false }, { id: 'st3', text: 'Verify with test part', completed: false }] },
  { id: 't2', key: 'OP-2', title: 'Replace worn mold cavity insert', description: 'Cavity B insert showing wear marks. Flash defects increasing. Replacement insert in stock.', status: 'not-started', priority: 'critical', owner: 'Sarah Kim', process: 'Injection Molding', dueDate: '2026-04-10', createdAt: '2026-04-01', tags: ['Tooling', 'Quality'], type: 'bug', comments: [] },
  { id: 't3', key: 'OP-3', title: 'Install poka-yoke fixture at Station 3', description: 'Design and install mistake-proofing fixture to prevent missing fastener defect. See PFMEA-003.', status: 'not-started', priority: 'high', owner: 'James Rivera', process: 'Final Assembly', dueDate: '2026-04-18', createdAt: '2026-04-03', tags: ['PFMEA', 'Safety'], type: 'improvement', comments: [] },
  { id: 't4', key: 'OP-4', title: 'Update shift handoff checklist', description: 'Revise shift handoff procedure to include critical quality checks. Address recurring defects during transitions.', status: 'completed', priority: 'medium', owner: 'James Rivera', process: 'Final Assembly', dueDate: '2026-04-07', createdAt: '2026-03-28', tags: ['Process'], type: 'task', comments: [{ id: 'c2', author: 'James Rivera', text: 'Updated and printed. Posted at all stations.', timestamp: '2026-04-06T16:00:00' }] },
  { id: 't5', key: 'OP-5', title: 'Add temperature monitoring to heat sealer', description: 'Install thermocouple + data logger on packaging heat sealer. Correlate seal failures with temp drift.', status: 'in-progress', priority: 'medium', owner: 'Lisa Park', process: 'Packaging', dueDate: '2026-04-15', createdAt: '2026-04-01', tags: ['Equipment', 'Quality'], type: 'improvement', comments: [] },
  { id: 't6', key: 'OP-6', title: 'Run Cpk study on new material batch', description: 'New ABS supplier batch arrived. Run 50-piece capability study before full production release.', status: 'not-started', priority: 'high', owner: 'Sarah Kim', process: 'Injection Molding', dueDate: '2026-04-14', createdAt: '2026-04-05', tags: ['Quality', 'Material'], type: 'task', comments: [] },
  { id: 't7', key: 'OP-7', title: 'Audit packaging line throughput', description: 'Throughput has dropped below LCL twice this week. Investigate root cause — belt tension or operator pace.', status: 'in-progress', priority: 'medium', owner: 'Lisa Park', process: 'Packaging', dueDate: '2026-04-11', createdAt: '2026-04-04', tags: ['Investigation'], type: 'task', comments: [] },
  { id: 't8', key: 'OP-8', title: 'Train new operator on SPC procedures', description: 'Alex Thompson joining CNC line next week. Needs SPC chart reading and measurement input training.', status: 'not-started', priority: 'low', owner: 'Mike Chen', process: 'CNC Machining', dueDate: '2026-04-20', createdAt: '2026-04-06', tags: ['Training'], type: 'task', comments: [] },
  { id: 't9', key: 'OP-9', title: 'Document gate cleaning schedule', description: 'Create preventive maintenance SOP for injection mold gate cleaning every 500 shots. See PFMEA-005.', status: 'completed', priority: 'medium', owner: 'Sarah Kim', process: 'Injection Molding', dueDate: '2026-04-08', createdAt: '2026-03-30', tags: ['PFMEA', 'SOP'], type: 'task', comments: [] },
  { id: 't10', key: 'OP-10', title: 'Review barcode scanner integration spec', description: 'Evaluate barcode scanning hardware for assembly station verification. Get quotes from 2 vendors.', status: 'not-started', priority: 'medium', owner: 'James Rivera', process: 'Final Assembly', dueDate: '2026-04-22', createdAt: '2026-04-07', tags: ['Equipment', 'PFMEA'], type: 'task', comments: [] },
  { id: 't11', key: 'OP-11', title: 'Investigate coolant flow alarm', description: 'Coolant flow alarm triggered twice on second shift. Check pump pressure and filter condition.', status: 'completed', priority: 'high', owner: 'Mike Chen', process: 'CNC Machining', dueDate: '2026-04-05', createdAt: '2026-04-03', tags: ['Maintenance'], type: 'bug', comments: [{ id: 'c3', author: 'Mike Chen', text: 'Root cause: clogged filter. Replaced and alarm cleared.', timestamp: '2026-04-04T14:20:00' }] },
  { id: 't12', key: 'OP-12', title: 'Validate shrink wrap seal spec', description: 'Customer requested tighter seal spec. Run validation on current settings and document results.', status: 'in-progress', priority: 'low', owner: 'Lisa Park', process: 'Packaging', dueDate: '2026-04-16', createdAt: '2026-04-06', tags: ['Quality', 'Customer'], type: 'task', comments: [] },
  // 8D Report example
  {
    id: 't13', key: 'OP-13', title: '8D: Flash defects on housing part', description: 'Recurring flash defects on injection molded housing. Customer complaint received. Full 8D investigation required.', status: 'in-progress', priority: 'critical', owner: 'Sarah Kim', process: 'Injection Molding', dueDate: '2026-04-20', createdAt: '2026-04-08', tags: ['Quality', '8D', 'Customer'], type: '8d-report',
    comments: [
      { id: 'c4', author: 'Sarah Kim', text: 'Team assembled: Sarah, Mike, James. Kick-off meeting scheduled.', timestamp: '2026-04-08T09:00:00' },
      { id: 'c5', author: 'System', text: 'Status changed from To Do → In Progress', timestamp: '2026-04-08T09:15:00', system: true },
    ],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: 'Team: Sarah Kim (lead), Mike Chen, James Rivera', completed: true },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: 'Flash on parting line of housing P/N 4420. 12% reject rate since batch 2026-B3.', completed: true },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: '100% inspection added. Affected inventory quarantined.', completed: true },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: 'Investigating: worn cavity insert, clamp pressure, material viscosity', completed: false },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: '', completed: false },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: '', completed: false },
    ],
  },
  // 5S Audit example
  {
    id: 't14', key: 'OP-14', title: '5S Audit: CNC Machining Area', description: 'Monthly 5S audit for the CNC machining cell. Score each category and document findings.', status: 'in-progress', priority: 'medium', owner: 'Mike Chen', process: 'CNC Machining', dueDate: '2026-04-15', createdAt: '2026-04-09', tags: ['5S', 'Audit'], type: '5s-audit',
    comments: [],
    fiveSScores: [
      { category: 'Sort', score: 4, notes: 'Unused fixtures removed. One old tool cart remains.' },
      { category: 'Set in Order', score: 3, notes: 'Tool shadow board partially complete. Need labels for drawers.' },
      { category: 'Shine', score: 4, notes: 'Floors clean. Coolant spill area needs attention.' },
      { category: 'Standardize', score: 2, notes: 'SOPs posted but outdated. Need to update cleaning schedule.' },
      { category: 'Sustain', score: 3, notes: 'Weekly audits happening but no trend tracking yet.' },
    ],
  },
  // More 8D Reports
  {
    id: 't15', key: 'OP-15', title: '8D: Cracked connector pins in assembly', description: 'Field returns showing cracked connector pins on P/N 7810. 3 customer RMAs in the last week. Root cause investigation needed.', status: 'not-started', priority: 'critical', owner: 'James Rivera', process: 'Final Assembly', dueDate: '2026-04-22', createdAt: '2026-04-09', tags: ['Quality', '8D', 'Field Return'], type: '8d-report',
    comments: [],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: '', completed: false },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: '', completed: false },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: '', completed: false },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: '', completed: false },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: '', completed: false },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: '', completed: false },
    ],
  },
  {
    id: 't16', key: 'OP-16', title: '8D: Heat treatment hardness out of spec', description: 'Batch HT-2026-12 measured 58 HRC vs. 62±1 HRC spec. Affects 340 parts. Customer shipment at risk.', status: 'in-progress', priority: 'high', owner: 'Mike Chen', process: 'Heat Treatment', dueDate: '2026-04-18', createdAt: '2026-04-07', tags: ['Quality', '8D', 'Material'], type: '8d-report',
    comments: [
      { id: 'c6', author: 'Mike Chen', text: 'Team formed: Mike, Sarah, Alex. Initial review of furnace logs underway.', timestamp: '2026-04-07T14:00:00' },
    ],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: 'Mike Chen (lead), Sarah Kim, Alex Thompson', completed: true },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: 'Batch HT-2026-12: target 62±1 HRC, actual 58 HRC. 340 parts affected across 3 work orders.', completed: true },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: 'Batch quarantined. Re-hardening trial scheduled for 5 sample parts.', completed: true },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: 'Furnace thermocouple #3 reading 15°F low. Possible drift.', completed: false },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: '', completed: false },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: '', completed: false },
    ],
  },
  {
    id: 't17', key: 'OP-17', title: '8D: Packaging label misprint (lot codes)', description: 'Wrong lot codes printed on 1,200 units. Discovered during final QC. Investigate labeling system error.', status: 'completed', priority: 'high', owner: 'Lisa Park', process: 'Packaging', dueDate: '2026-04-10', createdAt: '2026-04-03', tags: ['Quality', '8D', 'Labeling'], type: '8d-report',
    comments: [
      { id: 'c7', author: 'Lisa Park', text: 'All 8 disciplines complete. Report finalized.', timestamp: '2026-04-09T16:00:00' },
    ],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: 'Lisa Park (lead), James Rivera, Maria Santos', completed: true },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: 'Lot code TK-2026-09 printed as TK-2026-06 on 1,200 labels. Discovered at final QC.', completed: true },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: 'All mislabeled units quarantined. Relabeling in progress.', completed: true },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: 'Printer template file not updated after lot change. No verification step in SOP.', completed: true },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: 'Added lot code verification scan before print run. Updated SOP.', completed: true },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: 'Scanner installed. First successful verified print run completed.', completed: true },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: 'Monthly audit of label templates added to PM schedule. Training completed.', completed: true },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: 'Team recognized at plant standup. Report filed as 8D-2026-003.', completed: true },
    ],
  },
  // More 5S Audits
  {
    id: 't18', key: 'OP-18', title: '5S Audit: Final Assembly Line', description: 'Quarterly 5S audit for the final assembly workstations. Focus on tool organization and WIP flow.', status: 'not-started', priority: 'medium', owner: 'James Rivera', process: 'Final Assembly', dueDate: '2026-04-25', createdAt: '2026-04-10', tags: ['5S', 'Audit'], type: '5s-audit',
    comments: [],
    fiveSScores: [
      { category: 'Sort', score: 0, notes: '' },
      { category: 'Set in Order', score: 0, notes: '' },
      { category: 'Shine', score: 0, notes: '' },
      { category: 'Standardize', score: 0, notes: '' },
      { category: 'Sustain', score: 0, notes: '' },
    ],
  },
  {
    id: 't19', key: 'OP-19', title: '5S Audit: Packaging & Shipping Area', description: 'Monthly 5S audit for the packaging line and shipping dock. Previous audit scored 14/25.', status: 'in-progress', priority: 'medium', owner: 'Lisa Park', process: 'Packaging', dueDate: '2026-04-17', createdAt: '2026-04-08', tags: ['5S', 'Audit'], type: '5s-audit',
    comments: [
      { id: 'c8', author: 'Lisa Park', text: 'Initial walkthrough complete. Scoring in progress.', timestamp: '2026-04-10T10:00:00' },
    ],
    fiveSScores: [
      { category: 'Sort', score: 3, notes: 'Old shipping materials still in staging area. Broken pallet jack needs removal.' },
      { category: 'Set in Order', score: 2, notes: 'No designated zones for WIP vs finished goods. Labels faded.' },
      { category: 'Shine', score: 3, notes: 'Dock floor swept but tape lines need repainting.' },
      { category: 'Standardize', score: 3, notes: 'Cleaning schedule posted. Need to add end-of-shift checklist.' },
      { category: 'Sustain', score: 3, notes: 'Audits happening monthly. Scores trending up from last quarter.' },
    ],
  },
  {
    id: 't20', key: 'OP-20', title: '5S Audit: Injection Molding Cell', description: 'Monthly 5S audit for IM cell. Focus on mold storage, material handling, and purge bin management.', status: 'completed', priority: 'low', owner: 'Sarah Kim', process: 'Injection Molding', dueDate: '2026-04-05', createdAt: '2026-03-28', tags: ['5S', 'Audit'], type: '5s-audit',
    comments: [
      { id: 'c9', author: 'Sarah Kim', text: 'Audit complete. Score improved from 17 to 21/25.', timestamp: '2026-04-04T15:00:00' },
    ],
    fiveSScores: [
      { category: 'Sort', score: 5, notes: 'All unused molds returned to storage. Purge bins emptied daily.' },
      { category: 'Set in Order', score: 4, notes: 'Shadow boards complete. Material rack labels updated.' },
      { category: 'Shine', score: 4, notes: 'Machines wiped down each shift. Floor drains clear.' },
      { category: 'Standardize', score: 4, notes: 'Visual work instructions at every station. Color-coded bins.' },
      { category: 'Sustain', score: 4, notes: 'Weekly mini-audits by operators. Scores posted on board.' },
    ],
  },
];
