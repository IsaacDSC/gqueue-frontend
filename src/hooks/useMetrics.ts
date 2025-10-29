import { useState, useEffect } from "react";

interface Metrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

const initialMetrics: Metrics = {
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
};

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
