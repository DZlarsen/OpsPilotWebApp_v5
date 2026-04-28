import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target: number, duration: number = 1500): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export function useAnimatedFloat(target: number, decimals: number = 1, duration: number = 1500): string {
  const [value, setValue] = useState('0');
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue((target * eased).toFixed(decimals));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, decimals, duration]);

  return value;
}
