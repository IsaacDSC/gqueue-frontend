export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface CounterState {
  value: number;
  history: number[];
  lastUpdated: Date;
}

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning";

export type Size = "xs" | "sm" | "md" | "lg" | "xl";

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    danger: string;
    success: string;
    warning: string;
    background: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  "data-testid"?: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface ErrorState {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

// Insights API types
export interface InsightEvent {
  TopicName: string;
  TimeStarted: string;
  TimeEnded: string;
  TimeDurationMs: number;
  ACK: boolean;
  ConsumerName?: string;
}

export interface TimeSeriesData {
  time?: string;
  timeseries?: string[];
  value?: number;
  values?: number[];
}

export interface InsightsResponse {
  total_published: number;
  total_consumed: number;
  total_published_with_success?: number;
  total_consumed_with_success?: number;
  total_published_with_err: number;
  total_consumed_with_err: number;
  percentage_published_success?: string;
  percentage_consumed_success?: string;
  total_segmentation_published: Record<string, number>;
  total_segmentation_consumed: Record<string, number>;
  segmentation_published?: Record<string, InsightEvent[]>;
  segmentation_consumed?: Record<string, InsightEvent[]>;
  rpm_publisher: Record<string, TimeSeriesData | TimeSeriesData[]>;
  rpm_consumer: Record<string, TimeSeriesData | TimeSeriesData[]>;
  consumers_p99?: Record<string, number>;
  consumers_p75?: Record<string, number>;
  publishers_p99?: Record<string, number>;
  publishers_p75?: Record<string, number>;
}

// Event Management types
export interface TriggerOption {
  queue_type: string;
  max_retries: number;
  retention: string;
  unique_ttl: string;
  schedule_in: string;
  deadline: string | null;
}

export interface Trigger {
  service_name: string;
  type: string;
  host: string;
  path: string;
  headers: Record<string, string>;
  option: TriggerOption;
}

export interface Event {
  id?: string;
  name: string;
  service_name: string;
  repo_url: string;
  team_owner: string;
  type_event: number;
  state: string;
  triggers: Trigger[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventRequest {
  name: string;
  service_name: string;
  repo_url: string;
  team_owner: string;
  type_event?: number;
  state?: string;
  triggers: Trigger[];
}

export interface EventFormData {
  // Event Details
  name: string;
  service_name: string;
  repo_url: string;
  team_owner: string;

  // Trigger Configuration
  trigger_service_name: string;
  trigger_type: string;
  host: string;
  path: string;

  // Options
  queue_type: string;
  max_retries: number;
  retention: string;
  unique_ttl: string;
}
