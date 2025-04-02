export interface TimeStats {
  totalLogged: number;
  weeklyAverage: number;
  taskDistribution: Array<{
    taskName: string;
    minutes: number;
  }>;
}
