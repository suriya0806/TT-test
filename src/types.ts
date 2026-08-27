export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type SubjectType = 'Theory' | 'Lab';

export interface TimeSlot {
  day: DayOfWeek;
  period: number; // 1-indexed (e.g., 1 to 7)
}

export interface BreakConfig {
  afterPeriod: number;
  label: string;
  durationMinutes: number;
}

export interface ScheduleConfig {
  workingDays: DayOfWeek[];
  periodsPerDay: number;
  periodDurationMinutes: number;
  startTime: string; // e.g. "09:00"
  breaks: BreakConfig[];
}

export interface Staff {
  id: string;
  name: string;
  department: string;
  email?: string;
  subjectIds: string[]; // subjects they are eligible to teach
  maxPeriodsPerWeek: number;
  unavailableSlots: TimeSlot[]; // slots when teacher cannot teach
  preferredSlots?: TimeSlot[]; // slots teacher prefers
  maxConsecutivePeriods?: number; // default e.g. 3
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  requiredPeriodsPerWeek: number;
  eligibleStaffIds: string[];
  consecutivePeriodsRequired: number; // 1 for normal theory, 2 or 3 for labs
  roomRequired?: string; // e.g. "Lab 1", "Room 302"
}

export interface ClassSubjectRequirement {
  subjectId: string;
  periodsPerWeek: number;
  preferredStaffId?: string;
}

export interface ClassInfo {
  id: string;
  department: string;
  year: number | string; // e.g. "III" or 3
  section: string; // e.g. "A"
  name: string; // e.g. "CSE III A"
  room?: string;
  subjects: ClassSubjectRequirement[];
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  period: number;
  classId: string;
  subjectId: string;
  staffId: string;
  room?: string;
  isLocked?: boolean; // locked means explicitly preserved from existing schedule
}

export type ConflictType = 
  | 'TEACHER_CLASH'
  | 'CLASS_CLASH'
  | 'EXCESS_PERIODS'
  | 'MISSING_PERIODS'
  | 'WORKLOAD_OVERLOAD'
  | 'ELIGIBILITY_MISMATCH'
  | 'UNAVAILABLE_SLOT'
  | 'LAB_CONSECUTIVE_VIOLATION';

export type ConflictSeverity = 'CRITICAL' | 'WARNING';

export interface ConflictItem {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  day?: DayOfWeek;
  period?: number;
  classId?: string;
  className?: string;
  staffId?: string;
  staffName?: string;
  subjectId?: string;
  subjectName?: string;
  affectedEntryIds?: string[];
  suggestedAction?: string;
  resolutionOptions?: {
    actionType: 'reassign_teacher' | 'remove_entry' | 'move_slot' | 'increase_limit';
    label: string;
    newStaffId?: string;
    newDay?: DayOfWeek;
    newPeriod?: number;
  }[];
}

export interface HardConstraintsConfig {
  teacherConflict: boolean; // No double booking teacher
  classConflict: boolean; // No double booking class
  teacherEligibility: boolean; // Must be qualified for subject
  requiredSubjectPeriods: boolean; // Exact required periods
  teacherMaxWorkload: boolean; // Do not exceed max periods
  labConsecutive: boolean; // Labs must be consecutive
  respectUnavailability: boolean; // Do not schedule during unavailable slots
}

export interface SoftConstraintsConfig {
  avoidTooManyConsecutivePeriods: boolean;
  maxConsecutivePeriodsLimit: number;
  avoidTooManyGaps: boolean;
  balanceTeacherWorkload: boolean;
  spreadSubjectsEvenlyAcrossWeek: boolean;
  avoidSameHourDaily: boolean; // Shuffle & rotate periods across days so same subject doesn't appear at same hour every day
  shufflePeriodsRandomly: boolean; // Randomize tie-breaking for organic varied distribution
  maxSameSubjectPerDay: number;
  respectTeacherPreferences: boolean;
  minimizeExistingChanges: boolean;
}

export interface DynamicCustomConstraint {
  id: string;
  name: string;
  type: 'TEACHER_UNAVAILABLE_SPECIFIC' | 'TEACHER_TIME_WINDOW' | 'SUBJECT_DAILY_MAX' | 'NO_SUBJECT_ON_DAY' | 'PREFERRED_TEACHER_FOR_CLASS_SUBJECT' | 'CONSECUTIVE_LIMIT';
  enabled: boolean;
  params: {
    staffId?: string;
    subjectId?: string;
    classId?: string;
    day?: DayOfWeek;
    period?: number;
    maxPerDay?: number;
    timeWindow?: 'MORNING' | 'AFTERNOON';
    value?: number;
  };
}

export interface ConstraintsConfig {
  hard: HardConstraintsConfig;
  soft: SoftConstraintsConfig;
  dynamic: DynamicCustomConstraint[];
}

export interface GenerationOptions {
  mode: 'NEW_TIMETABLE' | 'COMPLETE_EXISTING';
  preserveValidExisting: boolean;
  shufflePeriods?: boolean; // Force period rotation & randomization across days
  allowOvertimeIfInfeasible?: boolean;
  maxSolveTimeSeconds?: number;
}

export interface GenerationValidationReport {
  isFeasible: boolean;
  statusMessage: string;
  totalEntriesGenerated: number;
  hardConstraintViolationsCount: number;
  softConstraintScore: number;
  conflicts: ConflictItem[];
  missingCount: number;
  excessCount: number;
  unassignedStaffCount: number;
  details: string[];
}

export interface SolveResult {
  success: boolean;
  message: string;
  timetable: TimetableEntry[];
  validation: GenerationValidationReport;
  executionTimeMs: number;
  changesCount?: number;
}

export interface StaffWorkloadSummary {
  staffId: string;
  staffName: string;
  department: string;
  assignedPeriods: number;
  maxPeriods: number;
  remainingPeriods: number;
  status: 'Good' | 'Full' | 'Overloaded';
  subjectsHandled: string[];
  classesHandled: string[];
  freePeriodsCount: number;
  workloadPercentage: number;
}
