import { Process, Measurement, Alert, PFMEAEntry, Recommendation } from './mock-data';

// Battery Manufacturing Processes
export const batteryProcesses: Process[] = [
  {
    id: 'batt-001',
    name: 'Electrode Coating — Cathode',
    category: 'Coating',
    description: 'NMC cathode slurry coating on aluminum foil. Target thickness 150μm ± 5μm.',
    owner: 'David Park',
    targetMetric: 150,
    unit: 'μm',
    status: 'stable',
    ucl: 155,
    lcl: 145,
    cl: 150,
  },
  {
    id: 'batt-002',
    name: 'Cell Assembly — Stacking',
    category: 'Assembly',
    description: 'Electrode stacking and tab welding for pouch cells. Alignment tolerance ±0.3mm.',
    owner: 'Rachel Torres',
    targetMetric: 0.15,
    unit: 'mm offset',
    status: 'warning',
    ucl: 0.30,
    lcl: 0,
    cl: 0.15,
  },
  {
    id: 'batt-003',
    name: 'Electrolyte Filling',
    category: 'Filling',
    description: 'Precision electrolyte injection under vacuum. Target fill volume 12.0 mL ± 0.2 mL.',
    owner: 'Kevin Wright',
    targetMetric: 12.0,
    unit: 'mL',
    status: 'stable',
    ucl: 12.2,
    lcl: 11.8,
    cl: 12.0,
  },
  {
    id: 'batt-004',
    name: 'Formation Cycling',
    category: 'Testing',
    description: 'Initial charge/discharge cycling for SEI layer formation. Monitor capacity retention.',
    owner: 'Priya Sharma',
    targetMetric: 98.5,
    unit: '% retention',
    status: 'critical',
    ucl: 100,
    lcl: 96,
    cl: 98.5,
  },
  {
    id: 'batt-005',
    name: 'Module Assembly',
    category: 'Assembly',
    description: 'Cell-to-module assembly with busbars and BMS wiring. Torque spec 4.5 Nm ± 0.3.',
    owner: 'Tom Anderson',
    targetMetric: 4.5,
    unit: 'Nm',
    status: 'stable',
    ucl: 4.8,
    lcl: 4.2,
    cl: 4.5,
  },
  {
    id: 'batt-006',
    name: 'Pack Testing — HPPC',
    category: 'Testing',
    description: 'Hybrid Pulse Power Characterization test for pack-level impedance and power capability.',
    owner: 'Nina Huang',
    targetMetric: 2.8,
    unit: 'mΩ',
    status: 'warning',
    ucl: 3.2,
    lcl: 2.4,
    cl: 2.8,
  },
];

function generateBatteryMeasurements(process: Process, days: number = 30): Measurement[] {
  const measurements: Measurement[] = [];
  const operators = ['D. Park', 'R. Torres', 'K. Wright', 'P. Sharma', 'T. Anderson', 'N. Huang'];
  const now = new Date();

  for (let d = days; d >= 0; d--) {
    const pointsPerDay = 4;
    for (let p = 0; p < pointsPerDay; p++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(6 + p * 4, Math.floor(Math.random() * 60));

      const range = process.ucl - process.lcl;
      let noise = (Math.random() - 0.5) * range * 0.6;

      if (process.status === 'warning' && d < 10) {
        noise += range * 0.15 * ((10 - d) / 10);
      }
      if (process.status === 'critical' && d < 7) {
        noise += range * 0.3 * ((7 - d) / 7);
      }
      if (Math.random() < 0.04) {
        noise = (Math.random() > 0.5 ? 1 : -1) * range * 0.7;
      }

      measurements.push({
        id: `m-${process.id}-${d}-${p}`,
        processId: process.id,
        value: parseFloat((process.cl + noise).toFixed(3)),
        timestamp: date.toISOString(),
        operator: operators[Math.floor(Math.random() * operators.length)],
      });
    }
  }
  return measurements;
}

export const batteryMeasurements: Measurement[] = batteryProcesses.flatMap(p => generateBatteryMeasurements(p));

export const getBatteryMeasurements = (processId: string) =>
  batteryMeasurements.filter(m => m.processId === processId);

export const batteryAlerts: Alert[] = [
  { id: 'ba-001', processId: 'batt-004', type: 'Out of Control', message: 'Formation Cycling: capacity retention dropped to 94.8% — below LCL (96%)', severity: 'critical', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), acknowledged: false },
  { id: 'ba-002', processId: 'batt-002', type: 'Process Drift', message: 'Cell Stacking: alignment offset trending upward over last 12 samples', severity: 'warning', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), acknowledged: false },
  { id: 'ba-003', processId: 'batt-006', type: 'Rising Variability', message: 'Pack Testing: impedance variance increased 35% vs baseline', severity: 'warning', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), acknowledged: false },
  { id: 'ba-004', processId: 'batt-001', type: 'Near Limit', message: 'Cathode Coating: 3 consecutive points within 1σ of UCL', severity: 'info', timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), acknowledged: true },
  { id: 'ba-005', processId: 'batt-003', type: 'Calibration Due', message: 'Electrolyte dispenser calibration overdue by 2 days', severity: 'warning', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), acknowledged: false },
  { id: 'ba-006', processId: 'batt-004', type: 'Yield Drop', message: 'Formation yield dropped to 91.2% — investigate cell lot BL-2026-0412', severity: 'critical', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), acknowledged: false },
];

export const batteryPfmea: PFMEAEntry[] = [
  { id: 'bp-001', processStep: 'Electrode Coating', failureMode: 'Coating thickness variation', effect: 'Capacity imbalance, reduced cycle life', cause: 'Slurry viscosity drift, die gap misalignment', severity: 8, occurrence: 4, detection: 3, rpn: 96, recommendedAction: 'Add inline laser thickness gauge with closed-loop control', owner: 'David Park', status: 'in-progress' },
  { id: 'bp-002', processStep: 'Cell Stacking', failureMode: 'Electrode misalignment', effect: 'Internal short circuit risk, safety hazard', cause: 'Vision system calibration drift, fixture wear', severity: 10, occurrence: 3, detection: 3, rpn: 90, recommendedAction: 'Upgrade to high-resolution vision system with auto-calibration', owner: 'Rachel Torres', status: 'open' },
  { id: 'bp-003', processStep: 'Electrolyte Filling', failureMode: 'Under-fill or air bubble entrapment', effect: 'Reduced capacity, accelerated degradation', cause: 'Vacuum leak, nozzle clog', severity: 7, occurrence: 4, detection: 4, rpn: 112, recommendedAction: 'Install vacuum integrity monitor and redundant nozzle', owner: 'Kevin Wright', status: 'open' },
  { id: 'bp-004', processStep: 'Formation Cycling', failureMode: 'Incomplete SEI formation', effect: 'Poor first-cycle efficiency, capacity fade', cause: 'Temperature excursion, current profile error', severity: 8, occurrence: 5, detection: 3, rpn: 120, recommendedAction: 'Add per-cell temperature monitoring and formation profile validation', owner: 'Priya Sharma', status: 'in-progress' },
  { id: 'bp-005', processStep: 'Module Assembly', failureMode: 'Busbar cold joint', effect: 'Increased resistance, thermal runaway risk', cause: 'Insufficient weld energy, surface contamination', severity: 10, occurrence: 2, detection: 4, rpn: 80, recommendedAction: 'Implement ultrasonic weld quality inspection per joint', owner: 'Tom Anderson', status: 'closed' },
  { id: 'bp-006', processStep: 'Pack Testing', failureMode: 'BMS communication fault', effect: 'Pack shutdown, field failure', cause: 'Connector seating issue, firmware bug', severity: 9, occurrence: 3, detection: 5, rpn: 135, recommendedAction: 'Add automated connector pull-test and BMS firmware validation', owner: 'Nina Huang', status: 'open' },
];

export const batteryRecommendations: Recommendation[] = [
  { id: 'br-001', processId: 'batt-004', title: 'Investigate formation yield drop', description: 'Capacity retention below LCL on 3 batches this week. Root cause analysis needed — check electrolyte lot and formation chamber temperature profiles.', priority: 'high', category: 'Quality', status: 'new' },
  { id: 'br-002', processId: 'batt-002', title: 'Recalibrate stacking vision system', description: 'Alignment offset showing gradual drift. Vision system last calibrated 30 days ago — overdue per SOP. Schedule during next line changeover.', priority: 'high', category: 'Maintenance', status: 'new' },
  { id: 'br-003', processId: 'batt-001', title: 'Evaluate new cathode slurry supplier', description: 'Current slurry showing batch-to-batch viscosity variation. Trial batch from AltChem showed 40% lower variance in preliminary testing.', priority: 'medium', category: 'Material', status: 'reviewed' },
  { id: 'br-004', processId: 'batt-006', title: 'Add impedance trending to pack test', description: 'HPPC impedance data not currently trended over time. Adding SPC to impedance values could detect cell aging patterns earlier.', priority: 'medium', category: 'Process Optimization', status: 'new' },
  { id: 'br-005', processId: 'batt-003', title: 'Reduce electrolyte exposure time', description: 'Moisture absorption during filling correlates with capacity fade. Consider nitrogen blanket and reduced queue time between filling and sealing.', priority: 'high', category: 'Process Optimization', status: 'new' },
];

export const batteryOwners = ['David Park', 'Rachel Torres', 'Kevin Wright', 'Priya Sharma', 'Tom Anderson', 'Nina Huang'];
export const batteryProcessOptions = ['Electrode Coating', 'Cell Assembly', 'Electrolyte Filling', 'Formation Cycling', 'Module Assembly', 'Pack Testing'];

// Battery BOM Data
export const batteryBomData = [
  {
    id: 'basm-001', partNumber: 'BASM-1000', name: 'Lithium-Ion Pouch Cell', description: 'NMC622 pouch cell, 60Ah nominal capacity, for EV battery module', revision: 'B', category: 'assembly' as const, status: 'active' as const, quantity: 1, unit: 'ea', process: 'Formation Cycling', cost: 42.80,
    changeHistory: [
      { date: '2026-03-20', change: 'Rev A → B: updated cathode loading from 18 to 20 mg/cm²', by: 'David Park' },
      { date: '2026-02-05', change: 'Qualified new electrolyte formulation EC:DMC 3:7', by: 'Kevin Wright' },
    ],
    children: [
      {
        id: 'bsub-001', partNumber: 'BSUB-1001', name: 'Cathode Electrode', description: 'NMC622 cathode coated on 15μm aluminum foil, calendered', revision: 'B', category: 'sub-assembly' as const, status: 'active' as const, quantity: 1, unit: 'ea', process: 'Electrode Coating', supplier: 'In-house', cost: 14.20, leadTimeDays: 2,
        changeHistory: [{ date: '2026-03-20', change: 'Increased loading to 20 mg/cm²', by: 'David Park' }],
        children: [
          { id: 'braw-001', partNumber: 'BRAW-2001', name: 'NMC622 Cathode Powder', description: 'LiNi0.6Mn0.2Co0.2O2, D50=10μm, battery grade', revision: 'A', category: 'raw-material' as const, status: 'active' as const, quantity: 0.32, unit: 'kg', supplier: 'Umicore', cost: 8.50, leadTimeDays: 21, changeHistory: [], children: [] },
          { id: 'braw-002', partNumber: 'BRAW-2002', name: 'Aluminum Foil 15μm', description: 'Current collector foil, 99.3% purity, 280mm width', revision: 'A', category: 'raw-material' as const, status: 'active' as const, quantity: 0.08, unit: 'm²', supplier: 'Showa Denko', cost: 0.45, leadTimeDays: 14, changeHistory: [], children: [] },
          { id: 'braw-003', partNumber: 'BRAW-2003', name: 'PVDF Binder', description: 'Polyvinylidene fluoride, Solef 5130, battery grade', revision: 'A', category: 'consumable' as const, status: 'active' as const, quantity: 0.015, unit: 'kg', supplier: 'Solvay', cost: 1.20, leadTimeDays: 10, changeHistory: [], children: [] },
        ],
      },
      {
        id: 'bsub-002', partNumber: 'BSUB-1002', name: 'Anode Electrode', description: 'Graphite anode coated on 9μm copper foil, calendered', revision: 'A', category: 'sub-assembly' as const, status: 'active' as const, quantity: 1, unit: 'ea', process: 'Electrode Coating', supplier: 'In-house', cost: 8.60, leadTimeDays: 2,
        changeHistory: [],
        children: [
          { id: 'braw-004', partNumber: 'BRAW-2004', name: 'Graphite Anode Powder', description: 'Artificial graphite, D50=18μm, first-cycle efficiency >94%', revision: 'A', category: 'raw-material' as const, status: 'active' as const, quantity: 0.22, unit: 'kg', supplier: 'BTR New Material', cost: 4.80, leadTimeDays: 18, changeHistory: [], children: [] },
          { id: 'braw-005', partNumber: 'BRAW-2005', name: 'Copper Foil 9μm', description: 'Electrodeposited copper foil, 280mm width', revision: 'A', category: 'raw-material' as const, status: 'active' as const, quantity: 0.08, unit: 'm²', supplier: 'Furukawa Electric', cost: 0.95, leadTimeDays: 14, changeHistory: [], children: [] },
        ],
      },
      { id: 'bcomp-001', partNumber: 'BCMP-1003', name: 'Ceramic Separator', description: 'PE/ceramic coated separator, 12μm + 4μm coating, Celgard', revision: 'A', category: 'component' as const, status: 'active' as const, quantity: 2, unit: 'ea', supplier: 'Celgard LLC', cost: 1.80, leadTimeDays: 14, changeHistory: [], children: [] },
      { id: 'bcomp-002', partNumber: 'BCMP-1004', name: 'Electrolyte Solution', description: '1M LiPF6 in EC:DMC 3:7, battery grade', revision: 'B', category: 'component' as const, status: 'active' as const, quantity: 0.12, unit: 'L', supplier: 'Enchem', cost: 3.20, leadTimeDays: 21, changeHistory: [{ date: '2026-02-05', change: 'Changed ratio from 1:1 to 3:7 EC:DMC', by: 'Kevin Wright' }], children: [] },
      { id: 'bcomp-003', partNumber: 'BCMP-1005', name: 'Aluminum Laminate Pouch', description: 'Multi-layer pouch film, 113μm total thickness', revision: 'A', category: 'component' as const, status: 'active' as const, quantity: 1, unit: 'ea', supplier: 'DNP', cost: 1.60, leadTimeDays: 21, changeHistory: [], children: [] },
    ],
  },
  {
    id: 'basm-002', partNumber: 'BASM-2000', name: 'Battery Module — 12S1P', description: '12-cell series module with BMS slave board, thermal interface, and busbar assembly', revision: 'A', category: 'assembly' as const, status: 'npi' as const, quantity: 1, unit: 'ea', process: 'Module Assembly', cost: 680.00, npiPhase: 'pilot' as const,
    changeHistory: [
      { date: '2026-04-02', change: 'Pilot build started — 50 units for qualification', by: 'Tom Anderson' },
      { date: '2026-03-10', change: 'Prototype testing complete — passed EUCAR L4 abuse tests', by: 'Nina Huang' },
    ],
    children: [
      { id: 'bcomp-004', partNumber: 'BCMP-2001', name: 'Pouch Cell 60Ah (qualified)', description: 'BASM-1000 Rev B, formation-tested and graded', revision: 'B', category: 'component' as const, status: 'active' as const, quantity: 12, unit: 'ea', supplier: 'In-house', cost: 42.80, leadTimeDays: 5, changeHistory: [], children: [] },
      { id: 'bcomp-005', partNumber: 'BCMP-2002', name: 'Copper Busbar Assembly', description: 'Nickel-plated copper busbars, laser-welded tabs', revision: 'A', category: 'component' as const, status: 'npi' as const, quantity: 1, unit: 'set', supplier: 'In-house', cost: 18.50, leadTimeDays: 3, npiPhase: 'pilot' as const, changeHistory: [], children: [] },
      { id: 'bcomp-006', partNumber: 'BCMP-2003', name: 'BMS Slave Board', description: '12-cell monitoring PCB with temperature sensing and cell balancing', revision: 'A', category: 'component' as const, status: 'npi' as const, quantity: 1, unit: 'ea', supplier: 'Sensata Technologies', cost: 35.00, leadTimeDays: 28, npiPhase: 'pilot' as const, changeHistory: [], children: [] },
      { id: 'bcomp-007', partNumber: 'BCMP-2004', name: 'Thermal Interface Pad', description: 'Silicone-based TIM, 1.5mm, 3.5 W/mK', revision: 'A', category: 'component' as const, status: 'active' as const, quantity: 12, unit: 'ea', supplier: 'Henkel', cost: 0.90, leadTimeDays: 7, changeHistory: [], children: [] },
    ],
  },
  {
    id: 'basm-003', partNumber: 'BASM-3000', name: 'Gen1 Cylindrical Module (21700)', description: 'Legacy 21700-based module — being phased out in favor of pouch design', revision: 'F', category: 'assembly' as const, status: 'eol' as const, quantity: 1, unit: 'ea', process: 'Module Assembly', cost: 520.00,
    changeHistory: [
      { date: '2026-04-01', change: 'Marked EOL — last production run scheduled for Q2 2026', by: 'Tom Anderson' },
    ],
    children: [
      { id: 'bcomp-008', partNumber: 'BCMP-3001', name: '21700 Cell — NCA', description: '5Ah NCA cylindrical cell, Samsung SDI', revision: 'D', category: 'component' as const, status: 'eol' as const, quantity: 96, unit: 'ea', supplier: 'Samsung SDI', cost: 3.20, leadTimeDays: 35, changeHistory: [], children: [] },
      { id: 'bcomp-009', partNumber: 'BCMP-3002', name: 'Nickel Strip Welds', description: 'Nickel-plated steel strips for spot welding', revision: 'A', category: 'component' as const, status: 'eol' as const, quantity: 1, unit: 'set', supplier: 'MTI Corp', cost: 12.00, leadTimeDays: 10, changeHistory: [], children: [] },
    ],
  },
];

// Battery Kanban Tasks
export const batteryInitialTasks = [
  { id: 'bt1', key: 'VE-1', title: 'Recalibrate coating die gap', description: 'Cathode coating thickness trending toward UCL. Die gap adjustment needed per SOP-EC-003.', status: 'in-progress' as const, priority: 'high' as const, owner: 'David Park', process: 'Electrode Coating', dueDate: '2026-04-12', createdAt: '2026-04-02', tags: ['Maintenance', 'SOP'], comments: [{ id: 'bc1', author: 'David Park', text: 'Die gap measured at 152μm — adjusting to 150μm target.', timestamp: '2026-04-05T09:15:00' }] },
  { id: 'bt2', key: 'VE-2', title: 'Investigate formation yield drop', description: 'Capacity retention below 96% on 3 consecutive batches. Check electrolyte lot and formation chamber temps.', status: 'not-started' as const, priority: 'critical' as const, owner: 'Priya Sharma', process: 'Formation Cycling', dueDate: '2026-04-10', createdAt: '2026-04-01', tags: ['Quality', 'Investigation'], comments: [] },
  { id: 'bt3', key: 'VE-3', title: 'Install nitrogen blanket on fill station', description: 'Reduce moisture exposure during electrolyte filling. Engineering change EC-2026-018.', status: 'not-started' as const, priority: 'high' as const, owner: 'Kevin Wright', process: 'Electrolyte Filling', dueDate: '2026-04-18', createdAt: '2026-04-03', tags: ['Equipment', 'Process'], comments: [] },
  { id: 'bt4', key: 'VE-4', title: 'Complete busbar weld qualification', description: 'Run 30-piece DOE on laser weld parameters for new pouch module busbars.', status: 'in-progress' as const, priority: 'high' as const, owner: 'Tom Anderson', process: 'Module Assembly', dueDate: '2026-04-14', createdAt: '2026-04-01', tags: ['NPI', 'Quality'], comments: [{ id: 'bc2', author: 'Tom Anderson', text: 'DOE plan approved. Running first 10 samples today.', timestamp: '2026-04-06T11:00:00' }] },
  { id: 'bt5', key: 'VE-5', title: 'Update BMS firmware to v2.3', description: 'New firmware fixes cell balancing algorithm. Flash all test packs and validate.', status: 'completed' as const, priority: 'medium' as const, owner: 'Nina Huang', process: 'Pack Testing', dueDate: '2026-04-07', createdAt: '2026-03-28', tags: ['Firmware', 'BMS'], comments: [{ id: 'bc3', author: 'Nina Huang', text: 'All 6 test packs flashed and validated. Balancing improved by 15%.', timestamp: '2026-04-06T16:30:00' }] },
  { id: 'bt6', key: 'VE-6', title: 'Validate new graphite anode lot', description: 'New batch from BTR — run half-cell tests and check first-cycle efficiency before production release.', status: 'not-started' as const, priority: 'high' as const, owner: 'David Park', process: 'Electrode Coating', dueDate: '2026-04-15', createdAt: '2026-04-05', tags: ['Material', 'Quality'], comments: [] },
  { id: 'bt7', key: 'VE-7', title: 'Calibrate electrolyte dispenser', description: 'Dispenser calibration overdue by 2 days. Schedule during next shift changeover.', status: 'in-progress' as const, priority: 'medium' as const, owner: 'Kevin Wright', process: 'Electrolyte Filling', dueDate: '2026-04-11', createdAt: '2026-04-04', tags: ['Maintenance', 'Calibration'], comments: [] },
  { id: 'bt8', key: 'VE-8', title: 'Train Rachel on vision system calibration', description: 'Cross-train Rachel Torres on stacking vision system maintenance procedures.', status: 'not-started' as const, priority: 'low' as const, owner: 'Rachel Torres', process: 'Cell Assembly', dueDate: '2026-04-20', createdAt: '2026-04-06', tags: ['Training'], comments: [] },
  { id: 'bt9', key: 'VE-9', title: 'Document thermal pad placement SOP', description: 'Create standardized work instruction for TIM pad placement on module assembly.', status: 'completed' as const, priority: 'medium' as const, owner: 'Tom Anderson', process: 'Module Assembly', dueDate: '2026-04-08', createdAt: '2026-03-30', tags: ['SOP', 'Documentation'], comments: [] },
  { id: 'bt10', key: 'VE-10', title: 'Review HPPC test protocol', description: 'Update hybrid pulse power characterization test to include cold-temperature profiles.', status: 'not-started' as const, priority: 'medium' as const, owner: 'Nina Huang', process: 'Pack Testing', dueDate: '2026-04-22', createdAt: '2026-04-07', tags: ['Testing', 'Protocol'], comments: [] },
  { id: 'bt11', key: 'VE-11', title: 'Fix stacking alignment alarm', description: 'False alarm triggered twice on night shift. Check vision system lighting and threshold settings.', status: 'completed' as const, priority: 'high' as const, owner: 'Rachel Torres', process: 'Cell Assembly', dueDate: '2026-04-05', createdAt: '2026-04-03', tags: ['Maintenance', 'Equipment'], comments: [{ id: 'bc4', author: 'Rachel Torres', text: 'Root cause: LED ring degradation. Replaced and recalibrated.', timestamp: '2026-04-04T15:45:00' }] },
  { id: 'bt12', key: 'VE-12', title: 'Evaluate ceramic separator alternative', description: 'Celgard lead time increasing. Test Toray separator as backup qualified source.', status: 'in-progress' as const, priority: 'low' as const, owner: 'Priya Sharma', process: 'Formation Cycling', dueDate: '2026-04-16', createdAt: '2026-04-06', tags: ['Material', 'Sourcing'], comments: [] },
  // 8D Report examples
  {
    id: 'bt13', key: 'VE-13', title: '8D: Dendrite formation in formation cycling', description: 'Cell teardown on 4 rejected packs shows lithium plating on anode surface. Field shipment hold issued. Full 8D required.', status: 'in-progress' as const, priority: 'critical' as const, owner: 'Priya Sharma', process: 'Formation Cycling', dueDate: '2026-04-20', createdAt: '2026-04-08', tags: ['Quality', '8D', 'Safety'], type: '8d-report' as const,
    comments: [
      { id: 'bc5', author: 'Priya Sharma', text: 'Team formed. Dr. Chen (electrochemistry consultant) joining tomorrow.', timestamp: '2026-04-08T08:30:00' },
      { id: 'bc6', author: 'System', text: 'Status changed from To Do → In Progress', timestamp: '2026-04-08T08:45:00', system: true },
    ],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: 'Priya Sharma (lead), David Park, Nina Huang, Dr. Chen (consultant)', completed: true },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: '4/120 packs from batch BF-2026-09 show lithium plating. Capacity loss >8% after 50 cycles vs <2% spec.', completed: true },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: 'All BF-2026-09 packs quarantined. Customer shipments paused. 100% CT scan added to formation exit.', completed: true },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: 'Investigating: formation C-rate profile, ambient temp during cycling, electrolyte conductivity', completed: false },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: '', completed: false },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: '', completed: false },
    ],
  },
  {
    id: 'bt14', key: 'VE-14', title: '8D: Pouch seal delamination after thermal cycling', description: 'Accelerated aging reveals seal failure on 8% of cells from batch EC-2026-14. Moisture ingress detected via Karl Fischer.', status: 'in-progress' as const, priority: 'high' as const, owner: 'Kevin Wright', process: 'Electrolyte Filling', dueDate: '2026-04-25', createdAt: '2026-04-06', tags: ['Quality', '8D', 'Material'], type: '8d-report' as const,
    comments: [
      { id: 'bc7', author: 'Kevin Wright', text: 'Team: Kevin, Rachel, Tom. First containment action complete.', timestamp: '2026-04-06T13:20:00' },
    ],
    eightDSteps: [
      { label: 'D1: Team Formation', description: 'Establish the cross-functional team', notes: 'Kevin Wright (lead), Rachel Torres, Tom Anderson', completed: true },
      { label: 'D2: Problem Description', description: 'Define the problem with measurable terms', notes: 'Pouch seal failures on 8% of batch EC-2026-14 after 200-cycle thermal aging at 45°C. KF moisture >150ppm vs <20ppm spec.', completed: true },
      { label: 'D3: Interim Containment', description: 'Implement containment actions', notes: 'Batch quarantined. Seal inspection frequency increased to 100%. Dry-room humidity tightened to -50°C DP.', completed: true },
      { label: 'D4: Root Cause Analysis', description: 'Identify and verify root cause(s)', notes: 'Seal bar temperature profile review in progress. Suspect hot-tack pressure insufficient on high-speed Line B.', completed: false },
      { label: 'D5: Corrective Actions', description: 'Choose and verify permanent corrective actions', notes: '', completed: false },
      { label: 'D6: Implementation', description: 'Implement and validate permanent corrective actions', notes: '', completed: false },
      { label: 'D7: Prevention', description: 'Prevent recurrence', notes: '', completed: false },
      { label: 'D8: Closure', description: 'Recognize team and close', notes: '', completed: false },
    ],
  },
  // 5S Audit examples
  {
    id: 'bt15', key: 'VE-15', title: '5S Audit: Dry Room & Electrolyte Filling', description: 'Monthly 5S audit for the dry room and electrolyte filling station. Special attention to moisture controls and safety compliance.', status: 'in-progress' as const, priority: 'medium' as const, owner: 'Kevin Wright', process: 'Electrolyte Filling', dueDate: '2026-04-14', createdAt: '2026-04-09', tags: ['5S', 'Audit', 'Safety'], type: '5s-audit' as const,
    comments: [],
    fiveSScores: [
      { category: 'Sort', score: 5, notes: 'Excellent. Only current-batch materials in dry room. Waste containers emptied each shift.' },
      { category: 'Set in Order', score: 4, notes: 'Electrolyte bottles well-organized on labeled rack. Syringe holders need color-coding by process.' },
      { category: 'Shine', score: 4, notes: 'Dry room floor cleaned daily. One spill kit needs restocking in fill station B.' },
      { category: 'Standardize', score: 3, notes: 'Dry room entry checklist posted but inconsistently signed. Need supervisor enforcement.' },
      { category: 'Sustain', score: 4, notes: 'Audits running weekly. Moisture trend chart posted. Good operator engagement.' },
    ],
  },
  {
    id: 'bt16', key: 'VE-16', title: '5S Audit: Cell Assembly & Stacking Area', description: 'Quarterly deep audit of cell assembly cells and stacking stations. Focus on ESD compliance and material flow.', status: 'not-started' as const, priority: 'medium' as const, owner: 'Rachel Torres', process: 'Cell Assembly', dueDate: '2026-04-19', createdAt: '2026-04-10', tags: ['5S', 'Audit'], type: '5s-audit' as const,
    comments: [],
    fiveSScores: [
      { category: 'Sort', score: 3, notes: 'Scrap electrode material accumulating at stacker C. Tooling rack has 3 obsolete fixtures.' },
      { category: 'Set in Order', score: 3, notes: 'ESD mats in place. Tool shadow board 60% complete. Visual SMI flow markings fading.' },
      { category: 'Shine', score: 4, notes: 'Stations cleaned between shifts. Vision system lenses need weekly wipe-down added to SOP.' },
      { category: 'Standardize', score: 2, notes: 'Two different SOPs exist for stacker loading — need consolidation. Version control issue.' },
      { category: 'Sustain', score: 2, notes: 'Last audit was 8 weeks ago. No trend tracking. Operator suggestion box has 11 unreviewed cards.' },
    ],
  },
];
