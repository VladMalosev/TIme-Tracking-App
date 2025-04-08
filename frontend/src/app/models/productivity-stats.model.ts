export interface ProductivityStats {
  frequentTasks: Array<{
    name: string;
    count: number;
  }>;
  logPatterns?: {
    hourlyDistribution: Array<{
      hour: string;
      count: number;
    }>;
    dailyDistribution: Array<{
      day: string;
      count: number;
    }>;
  } | null;
}
