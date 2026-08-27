import {
  ClassInfo,
  ConstraintsConfig,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import {
  initialClasses,
  initialConstraintsConfig,
  initialExistingTimetable,
  initialScheduleConfig,
  initialStaff,
  initialSubjects,
} from '../data/sampleData';

const STORAGE_KEYS = {
  VERSION: 'stg_data_version_v2',
  SCHEDULE: 'stg_schedule_config',
  STAFF: 'stg_staff_list',
  SUBJECTS: 'stg_subjects_list',
  CLASSES: 'stg_classes_list',
  CONSTRAINTS: 'stg_constraints_config',
  EXISTING_TIMETABLE: 'stg_existing_timetable',
  GENERATED_TIMETABLE: 'stg_generated_timetable',
};

export class StorageService {
  private static checkMigration(): void {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (!version) {
        // Upgrade to 5 days (Mon-Fri) & 9 periods config
        localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(initialScheduleConfig));
        localStorage.setItem(STORAGE_KEYS.VERSION, '2.0-5days-9periods');
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  static getScheduleConfig(): ScheduleConfig {
    try {
      this.checkMigration();
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (!data) return initialScheduleConfig;
      const parsed = JSON.parse(data) as ScheduleConfig;
      // Ensure valid workingDays and periodsPerDay
      if (!parsed.workingDays || parsed.workingDays.length === 0) {
        return initialScheduleConfig;
      }
      return parsed;
    } catch {
      return initialScheduleConfig;
    }
  }

  static saveScheduleConfig(config: ScheduleConfig): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(config));
  }

  static getStaff(): Staff[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (data !== null) {
        return JSON.parse(data);
      }
      return initialStaff;
    } catch {
      return initialStaff;
    }
  }

  static saveStaff(staff: Staff[]): void {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }

  static getSubjects(): Subject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (data !== null) {
        return JSON.parse(data);
      }
      return initialSubjects;
    } catch {
      return initialSubjects;
    }
  }

  static saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }

  static getClasses(): ClassInfo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data !== null) {
        return JSON.parse(data);
      }
      return initialClasses;
    } catch {
      return initialClasses;
    }
  }

  static saveClasses(classes: ClassInfo[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  static getConstraints(): ConstraintsConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONSTRAINTS);
      if (data !== null) {
        return JSON.parse(data);
      }
      return initialConstraintsConfig;
    } catch {
      return initialConstraintsConfig;
    }
  }

  static saveConstraints(constraints: ConstraintsConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONSTRAINTS, JSON.stringify(constraints));
  }

  static getExistingTimetable(): TimetableEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXISTING_TIMETABLE);
      if (data !== null) {
        return JSON.parse(data);
      }
      return initialExistingTimetable;
    } catch {
      return initialExistingTimetable;
    }
  }

  static saveExistingTimetable(entries: TimetableEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.EXISTING_TIMETABLE, JSON.stringify(entries));
  }

  static getActiveTimetable(): TimetableEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GENERATED_TIMETABLE);
      if (data !== null) return JSON.parse(data);
      return this.getExistingTimetable();
    } catch {
      return this.getExistingTimetable();
    }
  }

  static saveActiveTimetable(entries: TimetableEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.GENERATED_TIMETABLE, JSON.stringify(entries));
  }

  static getTimetableEntries(): TimetableEntry[] {
    return this.getActiveTimetable();
  }

  static saveTimetableEntries(entries: TimetableEntry[]): void {
    this.saveActiveTimetable(entries);
  }

  static resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(initialScheduleConfig));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(initialStaff));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initialSubjects));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
    localStorage.setItem(STORAGE_KEYS.CONSTRAINTS, JSON.stringify(initialConstraintsConfig));
    localStorage.setItem(STORAGE_KEYS.EXISTING_TIMETABLE, JSON.stringify(initialExistingTimetable));
    localStorage.setItem(STORAGE_KEYS.GENERATED_TIMETABLE, JSON.stringify(initialExistingTimetable));
  }

  static wipeAllToBlankSlate(): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(initialScheduleConfig));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONSTRAINTS, JSON.stringify(initialConstraintsConfig));
    localStorage.setItem(STORAGE_KEYS.EXISTING_TIMETABLE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GENERATED_TIMETABLE, JSON.stringify([]));
  }

  static exportFullBackup(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      scheduleConfig: this.getScheduleConfig(),
      staff: this.getStaff(),
      subjects: this.getSubjects(),
      classes: this.getClasses(),
      constraints: this.getConstraints(),
      existingTimetable: this.getExistingTimetable(),
      activeTimetable: this.getActiveTimetable(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.scheduleConfig) this.saveScheduleConfig(data.scheduleConfig);
      if (data.staff) this.saveStaff(data.staff);
      if (data.subjects) this.saveSubjects(data.subjects);
      if (data.classes) this.saveClasses(data.classes);
      if (data.constraints) this.saveConstraints(data.constraints);
      if (data.existingTimetable) this.saveExistingTimetable(data.existingTimetable);
      if (data.activeTimetable) this.saveActiveTimetable(data.activeTimetable);
      return true;
    } catch {
      return false;
    }
  }
}
