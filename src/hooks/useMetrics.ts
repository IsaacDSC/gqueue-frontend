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
