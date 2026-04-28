import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Process, Measurement, Alert, PFMEAEntry, Recommendation,
  processes as precisionProcesses,
  allMeasurements as precisionMeasurements,
  alerts as precisionAlerts,
  pfmeaEntries as precisionPfmea,
  recommendations as precisionRecommendations,
  getKPIs as precisionGetKPIs,
  getProcessStats as precisionGetProcessStats,
} from '@/data/mock-data';
import {
  batteryProcesses,
  batteryMeasurements,
  getBatteryMeasurements,
  batteryAlerts,
  batteryPfmea,
  batteryRecommendations,
  batteryOwners,
  batteryProcessOptions,
  batteryBomData,
  batteryInitialTasks,
} from '@/data/battery-data';
import { initialTasks as precisionInitialTasks } from '@/components/kanban/types';

export interface BusinessInfo {
  id: string;
  name: string;
  shortName: string;
  role: string;
  lines: number;
  userInitials: string;
  userName: string;
}

export const businessList: BusinessInfo[] = [
  { id: 'precision-mfg', name: 'Precision Manufacturing Co.', shortName: 'Precision Mfg Co.', role: 'Operations Manager', lines: 4, userInitials: 'OP', userName: 'Ops Manager' },
  { id: 'volta-energy', name: 'Volta Energy Systems', shortName: 'Volta Energy', role: 'Quality Lead', lines: 6, userInitials: 'VE', userName: 'Quality Lead' },
];

interface BusinessContextType {
  activeBusiness: BusinessInfo;
  setActiveBusinessId: (id: string) => void;
  processes: Process[];
  getMeasurements: (processId: string) => Measurement[];
  alerts: Alert[];
  pfmeaEntries: PFMEAEntry[];
  recommendations: Recommendation[];
  getKPIs: () => ReturnType<typeof precisionGetKPIs>;
  getProcessStats: (processId: string) => ReturnType<typeof precisionGetProcessStats>;
  owners: string[];
  processOptions: string[];
  bomData: any[];
  initialTasks: any[];
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState('precision-mfg');

  const activeBusiness = businessList.find(b => b.id === activeId) || businessList[0];

  const getContext = useCallback((): Omit<BusinessContextType, 'activeBusiness' | 'setActiveBusinessId'> => {
    if (activeId === 'volta-energy') {
      return {
        processes: batteryProcesses,
        getMeasurements: getBatteryMeasurements,
        alerts: batteryAlerts,
        pfmeaEntries: batteryPfmea,
        recommendations: batteryRecommendations,
        owners: batteryOwners,
        processOptions: batteryProcessOptions,
        getKPIs: () => {
          const activeAlerts = batteryAlerts.filter(a => !a.acknowledged).length;
          const criticalAlerts = batteryAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
          const stableProcesses = batteryProcesses.filter(p => p.status === 'stable').length;

          const formationMs = getBatteryMeasurements('batt-004').slice(-10);
          const avgRetention = formationMs.reduce((s, m) => s + m.value, 0) / formationMs.length;

          const coatingMs = getBatteryMeasurements('batt-001').slice(-10);
          const avgThickness = coatingMs.reduce((s, m) => s + m.value, 0) / coatingMs.length;

          return {
            defectRate: parseFloat((100 - avgRetention).toFixed(2)),
            processStability: `${stableProcesses}/${batteryProcesses.length}`,
            avgCycleTime: parseFloat(avgThickness.toFixed(1)),
            activeAlerts,
            criticalAlerts,
            improvementOps: batteryRecommendations.filter(r => r.status === 'new').length,
            openPFMEA: batteryPfmea.filter(e => e.status !== 'closed').length,
            highRPN: batteryPfmea.filter(e => e.rpn >= 100).length,
          };
        },
        getProcessStats: (processId: string) => {
          const ms = getBatteryMeasurements(processId);
          const values = ms.map(m => m.value);
          const mean = values.reduce((s, v) => s + v, 0) / values.length;
          const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
          const process = batteryProcesses.find(p => p.id === processId)!;
          const ooc = values.filter(v => v > process.ucl || v < process.lcl).length;
          return {
            mean: parseFloat(mean.toFixed(3)),
            stdDev: parseFloat(stdDev.toFixed(4)),
            oocCount: ooc,
            totalPoints: values.length,
            cpk: parseFloat((Math.min(process.ucl - mean, mean - process.lcl) / (3 * stdDev)).toFixed(2)),
          };
        },
        bomData: batteryBomData,
        initialTasks: batteryInitialTasks,
      };
    }

    // Default: precision manufacturing
    return {
      processes: precisionProcesses,
      getMeasurements: (processId: string) => precisionMeasurements.filter(m => m.processId === processId),
      alerts: precisionAlerts,
      pfmeaEntries: precisionPfmea,
      recommendations: precisionRecommendations,
      getKPIs: precisionGetKPIs,
      getProcessStats: precisionGetProcessStats,
      owners: ['Mike Chen', 'Sarah Kim', 'James Rivera', 'Lisa Park', 'Alex Thompson', 'Maria Santos'],
      processOptions: ['CNC Machining', 'Injection Molding', 'Final Assembly', 'Packaging', 'Inspection', 'Heat Treatment'],
      bomData: [], // BOM.tsx has its own hardcoded precision data
      initialTasks: precisionInitialTasks,
    };
  }, [activeId]);

  const ctx = getContext();

  return (
    <BusinessContext.Provider value={{
      activeBusiness,
      setActiveBusinessId: setActiveId,
      ...ctx,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
