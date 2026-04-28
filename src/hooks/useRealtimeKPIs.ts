import { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';

interface RealtimeKPIs {
  defectRate: number;
  avgCycleTime: number;
  activeAlerts: number;
  throughput: number;
}

export function useRealtimeKPIs(interval: number = 4000) {
  const { getKPIs } = useBusiness();
  const baseKPIs = getKPIs();

  const [live, setLive] = useState<RealtimeKPIs>({
    defectRate: baseKPIs.defectRate,
    avgCycleTime: baseKPIs.avgCycleTime,
    activeAlerts: baseKPIs.activeAlerts,
    throughput: 118,
  });

  const tick = useCallback(() => {
    setLive(prev => ({
      defectRate: parseFloat((prev.defectRate + (Math.random() - 0.48) * 0.08).toFixed(2)),
      avgCycleTime: parseFloat((prev.avgCycleTime + (Math.random() - 0.5) * 0.3).toFixed(1)),
      activeAlerts: prev.activeAlerts,
      throughput: Math.max(95, Math.min(135, Math.round(prev.throughput + (Math.random() - 0.5) * 3))),
    }));
  }, []);

  useEffect(() => {
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [tick, interval]);

  return { ...baseKPIs, ...live };
}
