import { BreakConfig, ScheduleConfig } from '../types';

export interface PeriodTimeInfo {
  period: number;
  start: string;
  end: string;
  timeRange: string;
  breakAfter?: string;
  breakDuration?: number;
}

export function computePeriodTimeRanges(config: ScheduleConfig): PeriodTimeInfo[] {
  const times: PeriodTimeInfo[] = [];
  const startTime = config.startTime || '09:00';
  const duration = config.periodDurationMinutes || 45;
  const breaks = config.breaks || [];

  const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  let currentTotalMinutes = startH * 60 + startM;

  const formatTime = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const format24h = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  for (let p = 1; p <= config.periodsPerDay; p++) {
    const startStr = format24h(currentTotalMinutes);
    const startDisplay = formatTime(currentTotalMinutes);
    
    currentTotalMinutes += duration;
    
    const endStr = format24h(currentTotalMinutes);
    const endDisplay = formatTime(currentTotalMinutes);

    const matchedBreak = breaks.find((b) => b.afterPeriod === p);
    if (matchedBreak) {
      currentTotalMinutes += matchedBreak.durationMinutes;
    }

    times.push({
      period: p,
      start: startStr,
      end: endStr,
      timeRange: `${startStr} - ${endStr}`,
      breakAfter: matchedBreak ? `${matchedBreak.label} (${matchedBreak.durationMinutes}m)` : undefined,
      breakDuration: matchedBreak?.durationMinutes,
    });
  }

  return times;
}
