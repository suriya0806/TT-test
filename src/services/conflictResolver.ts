import {
  ClassInfo,
  ConflictItem,
  ConstraintsConfig,
  ScheduleConfig,
  SolveResult,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ConflictDetector } from './conflictDetector';
import { ConstraintSolver } from './constraintSolver';

export class ConflictResolver {
  /**
   * Auto-resolves all conflicts by repairing invalid entries and completing all curriculum requirements.
   */
  static autoResolveAll(
    entries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    classesList: ClassInfo[],
    scheduleConfig: ScheduleConfig,
    constraintsConfig: ConstraintsConfig
  ): SolveResult {
    return ConstraintSolver.solve(
      {
        mode: 'COMPLETE_EXISTING',
        preserveValidExisting: true,
      },
      staffList,
      subjectsList,
      classesList,
      scheduleConfig,
      constraintsConfig,
      entries
    );
  }

  /**
   * Manually resolves a single conflict by reassigning a teacher or moving an entry.
   */
  static resolveSingleConflict(
    conflict: ConflictItem,
    selectedStaffId: string,
    currentEntries: TimetableEntry[]
  ): TimetableEntry[] {
    if (conflict.affectedEntryIds && conflict.affectedEntryIds.length > 0) {
      const targetId = conflict.affectedEntryIds[conflict.affectedEntryIds.length - 1];
      return currentEntries.map((entry) => {
        if (entry.id === targetId) {
          return {
            ...entry,
            staffId: selectedStaffId,
            isLocked: false,
          };
        }
        return entry;
      });
    }
    return currentEntries;
  }

  /**
   * Delete conflicting entry
   */
  static removeConflictingEntry(
    entryId: string,
    currentEntries: TimetableEntry[]
  ): TimetableEntry[] {
    return currentEntries.filter((e) => e.id !== entryId);
  }
}
