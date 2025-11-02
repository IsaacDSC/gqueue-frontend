export const QUEUE_TYPES = [
  "internal",
  "external",
  "low_throughput",
  "high_throughput",
  "low_latency",
] as const;

export type QueueType = (typeof QUEUE_TYPES)[number];

export const DEFAULT_QUEUE_TYPE: QueueType = "internal";


