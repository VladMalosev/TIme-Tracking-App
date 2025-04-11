import {TimeLogSummary} from './time-log-summary';
import {TimeLogEntry} from './time-log-entry';
import {UserInfo} from './user-info';

export interface TimeLogData {
  userInfo: UserInfo;
  logs: TimeLogEntry[];
  summary: TimeLogSummary;
}
