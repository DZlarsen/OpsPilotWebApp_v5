// Realistic seed data for OpsPilot prototype

export interface Process {
  id: string;
  name: string;
  category: string;
  description: string;
  owner: string;
  targetMetric: number;
  unit: string;
  status: 'stable' | 'warning' | 'critical';
  ucl: number;
  lcl: number;
  cl: number;
}

export interface Measurement {
  id: string;
  processId: string;
  value: number;
  timestamp: string;
  operator: string;
}

export interface Alert {
  id: string;
  processId: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export interface PFMEAEntry {
  id: string;
  processStep: string;
  failureMode: string;
  effect: string;
  cause: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  recommendedAction: string;
  owner: string;
  status: 'open' | 'in-progress' | 'closed';
}

export interface Recommendation {
  id: string;
  processId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: 'new' | 'reviewed' | 'implemented';
}

export const processes: Process[] = [
  {
    id: 'proc-001',
    name: 'CNC Machining — Shaft Turning',
    category: 'Machining',
    description: 'Precision shaft turning on Haas ST-20Y lathe. Critical tolerance ±0.002".',
    owner: 'Mike Chen',
    targetMetric: 25.400,
    unit: 'mm',
    status: 'stable',
    ucl: 25.406,
    lcl: 25.394,
    cl: 25.400,
  },
  {
    id: 'proc-002',
    name: 'Injection Molding — Housing',
    category: 'Molding',
    description: 'ABS housing injection molding. Cycle time target 42s. Monitor for flash and short shots.',
    owner: 'Sarah Kim',
    targetMetric: 42,
    unit: 'seconds',
    status: 'warning',
    ucl: 46,
    lcl: 38,
    cl: 42,
  },
  {
    id: 'proc-003',
    name: 'Final Assembly — Line A',
    category: 'Assembly',
    description: 'Manual assembly station for product line A. Track defect rate per 100 units.',
    owner: 'James Rivera',
    targetMetric: 1.5,
    unit: 'defects/100',
    status: 'critical',
    ucl: 3.0,
    lcl: 0,
    cl: 1.5,
  },
  {
    id: 'proc-004',
    name: 'Packaging — Shrink Wrap',
    category: 'Packaging',
    description: 'Automated shrink wrap packaging. Monitor seal integrity and throughput.',
    owner: 'Lisa Park',
    targetMetric: 120,
    unit: 'units/hr',
    status: 'stable',
    ucl: 135,
    lcl: 105,
    cl: 120,
  },
];

function generateMeasurements(process: Process, days: number = 30): Measurement[] {
  const measurements: Measurement[] = [];
  const operators = ['A. Smith', 'B. Jones', 'C. Lee', 'D. Garcia'];
  const now = new Date();

  for (let d = days; d >= 0; d--) {
    const pointsPerDay = process.id === 'proc-003' ? 2 : 4;
    for (let p = 0; p < pointsPerDay; p++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(6 + p * 4, Math.floor(Math.random() * 60));

      const range = process.ucl - process.lcl;
      let noise = (Math.random() - 0.5) * range * 0.6;

      // Add drift for warning/critical processes
      if (process.status === 'warning' && d < 10) {
        noise += range * 0.15 * ((10 - d) / 10);
      }
      if (process.status === 'critical' && d < 7) {
        noise += range * 0.3 * ((7 - d) / 7);
      }

      // Occasional out-of-control points
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

export const allMeasurements: Measurement[] = processes.flatMap(p => generateMeasurements(p));

export const getMeasurements = (processId: string) =>
  allMeasurements.filter(m => m.processId === processId);

export const alerts: Alert[] = [
  {
    id: 'alert-001',
    processId: 'proc-003',
    type: 'Out of Control',
    message: 'Final Assembly Line A: defect rate 3.8/100 exceeded UCL (3.0)',
    severity: 'critical',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-002',
    processId: 'proc-002',
    type: 'Process Drift',
    message: 'Injection Molding Housing: cycle time trending upward over last 8 samples',
    severity: 'warning',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-003',
    processId: 'proc-003',
    type: 'Rising Variability',
    message: 'Final Assembly Line A: standard deviation increased 40% over baseline',
    severity: 'warning',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'alert-004',
    processId: 'proc-001',
    type: 'Near Limit',
    message: 'CNC Shaft Turning: 2 consecutive points within 1σ of UCL',
    severity: 'info',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'alert-005',
    processId: 'proc-002',
    type: 'Overdue Action',
    message: 'PFMEA action "Replace worn mold cavity insert" overdue by 3 days',
    severity: 'warning',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-006',
    processId: 'proc-004',
    type: 'Throughput Drop',
    message: 'Packaging throughput dropped to 98 units/hr — below LCL (105)',
    severity: 'critical',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    acknowledged: false,
  },
];

export const pfmeaEntries: PFMEAEntry[] = [
  {
    id: 'pfmea-001',
    processStep: 'Shaft Turning',
    failureMode: 'Dimensional out of tolerance',
    effect: 'Assembly interference, product rejection',
    cause: 'Tool wear, incorrect offset',
    severity: 8,
    occurrence: 4,
    detection: 3,
    rpn: 96,
    recommendedAction: 'Implement automated tool wear compensation',
    owner: 'Mike Chen',
    status: 'in-progress',
  },
  {
    id: 'pfmea-002',
    processStep: 'Injection Molding',
    failureMode: 'Flash on parting line',
    effect: 'Cosmetic defect, rework required',
    cause: 'Worn mold cavity insert, excessive clamp pressure',
    severity: 5,
    occurrence: 6,
    detection: 2,
    rpn: 60,
    recommendedAction: 'Replace worn mold cavity insert',
    owner: 'Sarah Kim',
    status: 'open',
  },
  {
    id: 'pfmea-003',
    processStep: 'Final Assembly',
    failureMode: 'Missing fastener',
    effect: 'Product failure in field, safety risk',
    cause: 'Operator error, poor workstation layout',
    severity: 9,
    occurrence: 5,
    detection: 4,
    rpn: 180,
    recommendedAction: 'Add poka-yoke fixture and torque verification',
    owner: 'James Rivera',
    status: 'open',
  },
  {
    id: 'pfmea-004',
    processStep: 'Packaging',
    failureMode: 'Incomplete seal',
    effect: 'Product damage during shipping',
    cause: 'Temperature drift in heat sealer',
    severity: 6,
    occurrence: 3,
    detection: 5,
    rpn: 90,
    recommendedAction: 'Install temperature monitoring with alarm',
    owner: 'Lisa Park',
    status: 'closed',
  },
  {
    id: 'pfmea-005',
    processStep: 'Injection Molding',
    failureMode: 'Short shot',
    effect: 'Incomplete part, scrap',
    cause: 'Insufficient injection pressure, blocked gate',
    severity: 7,
    occurrence: 3,
    detection: 2,
    rpn: 42,
    recommendedAction: 'Preventive gate cleaning schedule every 500 shots',
    owner: 'Sarah Kim',
    status: 'in-progress',
  },
  {
    id: 'pfmea-006',
    processStep: 'Final Assembly',
    failureMode: 'Wrong component installed',
    effect: 'Field failure, warranty claim',
    cause: 'Similar-looking parts, no visual verification',
    severity: 9,
    occurrence: 3,
    detection: 6,
    rpn: 162,
    recommendedAction: 'Implement barcode scanning verification at station',
    owner: 'James Rivera',
    status: 'open',
  },
];

export const recommendations: Recommendation[] = [
  {
    id: 'rec-001',
    processId: 'proc-003',
    title: 'Investigate recurring assembly defects',
    description: 'Defect rate on Line A has exceeded UCL 3 times this week. Recommend root cause analysis with 5-Why method focusing on fastener station.',
    priority: 'high',
    category: 'Quality',
    status: 'new',
  },
  {
    id: 'rec-002',
    processId: 'proc-002',
    title: 'Inspect mold calibration',
    description: 'Injection molding cycle time showing upward drift. May indicate worn cavity or temperature control issue. Schedule calibration check.',
    priority: 'high',
    category: 'Maintenance',
    status: 'new',
  },
  {
    id: 'rec-003',
    processId: 'proc-001',
    title: 'Review tool change interval',
    description: 'CNC turning showing periodic spikes correlating with tool changes. Consider reducing change interval from 500 to 400 parts.',
    priority: 'medium',
    category: 'Process Optimization',
    status: 'reviewed',
  },
  {
    id: 'rec-004',
    processId: 'proc-003',
    title: 'Evaluate shift handoff impact',
    description: 'Data suggests higher defect rates during shift transitions. Recommend standardized handoff checklist and overlap period.',
    priority: 'medium',
    category: 'Workforce',
    status: 'new',
  },
  {
    id: 'rec-005',
    processId: 'proc-002',
    title: 'Reduce batch size for molding',
    description: 'Process variability increases after batch 200. Consider splitting into smaller batches of 150 to maintain stability.',
    priority: 'low',
    category: 'Process Optimization',
    status: 'new',
  },
  {
    id: 'rec-006',
    processId: 'proc-004',
    title: 'Add heat sealer temperature monitoring',
    description: 'Packaging seal failures correlate with ambient temperature changes. Real-time temperature monitoring would enable proactive adjustment.',
    priority: 'medium',
    category: 'Equipment',
    status: 'implemented',
  },
];

// Dashboard KPI calculations
export function getKPIs() {
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const stableProcesses = processes.filter(p => p.status === 'stable').length;
  const totalProcesses = processes.length;

  // Calculate average defect rate from proc-003
  const assemblyMeasurements = getMeasurements('proc-003').slice(-10);
  const avgDefectRate = assemblyMeasurements.reduce((s, m) => s + m.value, 0) / assemblyMeasurements.length;

  // Average cycle time from proc-002
  const moldingMeasurements = getMeasurements('proc-002').slice(-10);
  const avgCycleTime = moldingMeasurements.reduce((s, m) => s + m.value, 0) / moldingMeasurements.length;

  const openPFMEA = pfmeaEntries.filter(e => e.status !== 'closed').length;
  const highRPN = pfmeaEntries.filter(e => e.rpn >= 100).length;
  const improvementOps = recommendations.filter(r => r.status === 'new').length;

  return {
    defectRate: parseFloat(avgDefectRate.toFixed(2)),
    processStability: `${stableProcesses}/${totalProcesses}`,
    avgCycleTime: parseFloat(avgCycleTime.toFixed(1)),
    activeAlerts,
    criticalAlerts,
    improvementOps,
    openPFMEA,
    highRPN,
  };
}

export function getProcessStats(processId: string) {
  const ms = getMeasurements(processId);
  const values = ms.map(m => m.value);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const process = processes.find(p => p.id === processId)!;
  const ooc = values.filter(v => v > process.ucl || v < process.lcl).length;

  return {
    mean: parseFloat(mean.toFixed(3)),
    stdDev: parseFloat(stdDev.toFixed(4)),
    oocCount: ooc,
    totalPoints: values.length,
    cpk: parseFloat((Math.min(process.ucl - mean, mean - process.lcl) / (3 * stdDev)).toFixed(2)),
  };
}
