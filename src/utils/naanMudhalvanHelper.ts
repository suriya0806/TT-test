import { ClassInfo, ClassSubjectRequirement, DayOfWeek, ScheduleConfig, Subject, SubjectFixedSchedule, TimetableEntry } from '../types';

/**
 * Checks whether a subject is a Naan Mudhalvan course
 */
export function isNaanMudhalvanSubject(subject?: Subject | null): boolean {
  if (!subject) return false;
  if (subject.isNaanMudhalvan) return true;
  const nameLower = (subject.name || '').toLowerCase();
  const codeLower = (subject.code || '').toLowerCase();
  return (
    nameLower.includes('naan mudhalvan') ||
    nameLower.includes('naanmudhalvan') ||
    nameLower.includes('naan mudalvan') ||
    nameLower.includes('naanmudalvan') ||
    codeLower.startsWith('nm') ||
    codeLower.includes('naan') ||
    Boolean(subject.fixedSchedule?.enabled)
  );
}

/**
 * Resolves the active fixed schedule for a subject in a specific class
 */
export function getResolvedFixedSchedule(
  subject: Subject,
  classReq?: ClassSubjectRequirement,
  scheduleConfig?: ScheduleConfig
): SubjectFixedSchedule | null {
  // Check class requirement override first
  if (classReq?.fixedSchedule && classReq.fixedSchedule.enabled) {
    return classReq.fixedSchedule;
  }

  // Check subject level fixed schedule
  if (subject.fixedSchedule && subject.fixedSchedule.enabled) {
    return subject.fixedSchedule;
  }

  // If it's Naan Mudhalvan by name/code, provide a sensible default if not explicitly disabled
  if (isNaanMudhalvanSubject(subject)) {
    const defaultDays = scheduleConfig?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // Default to Friday or last working day
    const defaultDay: DayOfWeek = defaultDays.includes('Friday') ? 'Friday' : (defaultDays[defaultDays.length - 1] || 'Friday');
    const periodsPerDay = scheduleConfig?.periodsPerDay || 8;
    const consecutive = subject.consecutivePeriodsRequired || 4;
    // Default start at afternoon (e.g. Period 5 if 8/9 periods, or P1 if few periods)
    const defaultStart = periodsPerDay >= consecutive + 4 ? 5 : Math.max(1, periodsPerDay - consecutive + 1);

    return {
      enabled: true,
      day: defaultDay,
      startPeriod: defaultStart,
      consecutivePeriods: consecutive,
    };
  }

  return null;
}

/**
 * Checks if a timetable entry corresponds to a Naan Mudhalvan course
 */
export function isNaanMudhalvanEntry(entry: TimetableEntry, subjectsList: Subject[]): boolean {
  const subject = subjectsList.find((s) => s.id === entry.subjectId);
  return isNaanMudhalvanSubject(subject);
}
