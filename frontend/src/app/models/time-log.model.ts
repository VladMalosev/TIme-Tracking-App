export interface TimeLog {
  id: string;
  startTime: string;
  endTime?: string;
  minutes: number;
  description?: string;
  task?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  loggedAt?: string;
}
