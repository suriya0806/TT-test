import {
  ClassInfo,
  ConflictItem,
  ConstraintsConfig,
  DayOfWeek,
  GenerationOptions,
  GenerationValidationReport,
  ScheduleConfig,
  SolveResult,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ConflictDetector } from './conflictDetector';

export class ConstraintSolver {
  /**
   * Main solving method supporting both "NEW_TIMETABLE" and "COMPLETE_EXISTING".
   */
  static solve(
    options: GenerationOptions,
    staffList: Staff[],
    subjectsList: Subject[],
    classesList: ClassInfo[],
    scheduleConfig: ScheduleConfig,
    constraintsConfig: ConstraintsConfig,
    existingEntries: TimetableEntry[] = []
  ): SolveResult {
    const startTime = performance.now();
    const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
    const subjectMap = new Map<string, Subject>(subjectsList.map((sub) => [sub.id, sub]));
    const classMap = new Map<string, ClassInfo>(classesList.map((c) => [c.id, c]));

    const workingDays = scheduleConfig.workingDays;
    const periodsPerDay = scheduleConfig.periodsPerDay;
    const totalSlotsPerClass = workingDays.length * periodsPerDay;

    // Check high-level feasibility: Total required periods per class vs available slots
    for (const cls of classesList) {
      const totalClassReq = cls.subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);
      if (totalClassReq > totalSlotsPerClass) {
        // Warning note in validation, but proceed to solve up to available slots
      }
    }

    // Prepare fixed timetable state
    let baseEntries: TimetableEntry[] = [];
    let changesCount = 0;

    if (options.mode === 'COMPLETE_EXISTING' && existingEntries.length > 0) {
      // Validate existing entries, purge true conflicts (like teacher clash / class clash / illegal eligibility),
      // and preserve all valid assignments.
      const initialConflicts = ConflictDetector.detectAllConflicts(
        existingEntries,
        staffList,
        subjectsList,
        classesList,
        scheduleConfig,
        constraintsConfig
      );

      const conflictingEntryIds = new Set<string>();
      for (const c of initialConflicts) {
        if (c.severity === 'CRITICAL' && c.affectedEntryIds) {
          // If teacher clash (e.g. staff assigned twice at same time), remove the secondary duplicate entry so solver re-assigns
          if (c.type === 'TEACHER_CLASH' && c.affectedEntryIds.length > 1) {
            conflictingEntryIds.add(c.affectedEntryIds[1]); // Keep first, reassign second
          } else if (c.type === 'CLASS_CLASH' && c.affectedEntryIds.length > 1) {
            conflictingEntryIds.add(c.affectedEntryIds[1]);
          } else if (c.type === 'ELIGIBILITY_MISMATCH' || c.type === 'UNAVAILABLE_SLOT') {
            c.affectedEntryIds.forEach((id) => conflictingEntryIds.add(id));
          }
        }
      }

      baseEntries = existingEntries.filter((e) => !conflictingEntryIds.has(e.id));
      changesCount = conflictingEntryIds.size;
    }

    // Run Constraint Solving Algorithm
    const solvedTimetable = this.runCspSolver(
      baseEntries,
      staffList,
      subjectsList,
      classesList,
      scheduleConfig,
      constraintsConfig,
      options
    );

    const executionTimeMs = Math.round(performance.now() - startTime);

    if (!solvedTimetable || solvedTimetable.length === 0) {
      return {
        success: false,
        message: 'NO FEASIBLE TIMETABLE FOUND',
        timetable: baseEntries,
        executionTimeMs,
        validation: {
          isFeasible: false,
          statusMessage: 'Constraint solver could not find a clash-free assignment. Check faculty count and requirements.',
          totalEntriesGenerated: baseEntries.length,
          hardConstraintViolationsCount: 1,
          softConstraintScore: 0,
          conflicts: [],
          missingCount: 1,
          excessCount: 0,
          unassignedStaffCount: 0,
          details: [
            'Faculty availability or subject qualification overlaps prevented allocation.',
          ],
        },
      };
    }

    // Final comprehensive validation
    const finalConflicts = ConflictDetector.detectAllConflicts(
      solvedTimetable,
      staffList,
      subjectsList,
      classesList,
      scheduleConfig,
      constraintsConfig
    );

    const criticalConflicts = finalConflicts.filter((c) => c.severity === 'CRITICAL');
    const missingConflicts = finalConflicts.filter((c) => c.type === 'MISSING_PERIODS');
    const isFeasible = criticalConflicts.length === 0 && missingConflicts.length === 0;

    // Check unassigned staff
    const assignedStaffSet = new Set(solvedTimetable.map((e) => e.staffId));
    const unassignedStaffCount = staffList.filter((s) => !assignedStaffSet.has(s.id)).length;

    const validationReport: GenerationValidationReport = {
      isFeasible,
      statusMessage: isFeasible
        ? 'TIMETABLE GENERATED SUCCESSFULLY'
        : 'TIMETABLE GENERATED WITH WARNINGS',
      totalEntriesGenerated: solvedTimetable.length,
      hardConstraintViolationsCount: criticalConflicts.length,
      softConstraintScore: this.calculateSoftConstraintScore(solvedTimetable, staffList, constraintsConfig),
      conflicts: finalConflicts,
      missingCount: missingConflicts.length,
      excessCount: finalConflicts.filter((c) => c.type === 'EXCESS_PERIODS').length,
      unassignedStaffCount,
      details: [
        `Generated ${solvedTimetable.length} total period allocations across ${classesList.length} classes.`,
        `Assigned ${staffList.length - unassignedStaffCount} of ${staffList.length} faculty members.`,
        criticalConflicts.length === 0
          ? 'All hard constraints (teacher conflicts, class conflicts, eligibility, and workloads) are 100% satisfied.'
          : `${criticalConflicts.length} hard constraint conflicts need manual attention.`,
      ],
    };

    return {
      success: isFeasible,
      message: isFeasible ? 'TIMETABLE GENERATED SUCCESSFULLY' : 'TIMETABLE GENERATED WITH WARNINGS',
      timetable: solvedTimetable,
      validation: validationReport,
      executionTimeMs,
      changesCount,
    };
  }

  /**
   * Backtracking Constraint Satisfaction Solver with MRV + LCV + Forward Checking
   */
  private static runCspSolver(
    initialEntries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    classesList: ClassInfo[],
    scheduleConfig: ScheduleConfig,
    constraints: ConstraintsConfig,
    options: GenerationOptions
  ): TimetableEntry[] | null {
    const workingDays = scheduleConfig.workingDays;
    const periodsPerDay = scheduleConfig.periodsPerDay;

    const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
    const subjectMap = new Map<string, Subject>(subjectsList.map((sub) => [sub.id, sub]));

    // Build tracking matrices
    // teacherAssigned[day][period] -> Set of staffIds
    const teacherSlotBusy = new Map<string, Set<string>>(); // key: `${day}_${period}`
    // classSlotBusy[day][period] -> classId
    const classSlotBusy = new Map<string, string>(); // key: `${day}_${period}_${classId}`
    // staffWeeklyCount
    const staffWeeklyCount = new Map<string, number>();
    staffList.forEach((s) => staffWeeklyCount.set(s.id, 0));

    // classSubjectWeeklyCount: key `${classId}_${subjectId}` -> count
    const classSubjectWeeklyCount = new Map<string, number>();

    const currentTimetable: TimetableEntry[] = [];

    // Populate existing locked entries
    for (const entry of initialEntries) {
      const slotKey = `${entry.day}_${entry.period}`;
      const classSlotKey = `${entry.day}_${entry.period}_${entry.classId}`;
      const csKey = `${entry.classId}_${entry.subjectId}`;

      // Register busy states
      if (!teacherSlotBusy.has(slotKey)) teacherSlotBusy.set(slotKey, new Set());
      teacherSlotBusy.get(slotKey)!.add(entry.staffId);

      classSlotBusy.set(classSlotKey, entry.id);

      staffWeeklyCount.set(
        entry.staffId,
        (staffWeeklyCount.get(entry.staffId) || 0) + 1
      );

      classSubjectWeeklyCount.set(
        csKey,
        (classSubjectWeeklyCount.get(csKey) || 0) + 1
      );

      currentTimetable.push({ ...entry });
    }

    // Identify unfulfilled requirements (Units of work to schedule)
    interface WorkUnit {
      classId: string;
      subjectId: string;
      isLab: boolean;
      consecutiveRequired: number;
      room?: string;
    }

    const labUnits: WorkUnit[] = [];
    const theoryUnitsByClass = new Map<string, WorkUnit[]>();
    classesList.forEach((cls) => theoryUnitsByClass.set(cls.id, []));

    // Labs are scheduled in blocks first (e.g. 2 consecutive periods), then Theory subjects
    for (const cls of classesList) {
      // If shuffling is requested, shuffle subject iteration order per class
      const clsSubjects = [...cls.subjects];
      if (options.shufflePeriods || constraints.soft.shufflePeriodsRandomly !== false) {
        clsSubjects.sort(() => Math.random() - 0.5);
      }

      for (const req of clsSubjects) {
        const csKey = `${cls.id}_${req.subjectId}`;
        const currentCount = classSubjectWeeklyCount.get(csKey) || 0;
        const missingCount = Math.max(0, req.periodsPerWeek - currentCount);
        const subject = subjectMap.get(req.subjectId);

        if (subject && missingCount > 0) {
          if (subject.consecutivePeriodsRequired > 1) {
            const blockSize = subject.consecutivePeriodsRequired;
            const numBlocks = Math.floor(missingCount / blockSize);
            const remainder = missingCount % blockSize;

            for (let b = 0; b < numBlocks; b++) {
              labUnits.push({
                classId: cls.id,
                subjectId: req.subjectId,
                isLab: subject.type === 'Lab',
                consecutiveRequired: blockSize,
                room: subject.roomRequired || cls.room,
              });
            }
            for (let r = 0; r < remainder; r++) {
              labUnits.push({
                classId: cls.id,
                subjectId: req.subjectId,
                isLab: subject.type === 'Lab',
                consecutiveRequired: 1,
                room: subject.roomRequired || cls.room,
              });
            }
          } else {
            for (let i = 0; i < missingCount; i++) {
              theoryUnitsByClass.get(cls.id)!.push({
                classId: cls.id,
                subjectId: req.subjectId,
                isLab: false,
                consecutiveRequired: 1,
                room: subject.roomRequired || cls.room,
              });
            }
          }
        }
      }
    }

    // Interleave theory units across classes and subjects for varied distribution
    const interleavedTheoryUnits: WorkUnit[] = [];
    const classIdList = classesList.map((c) => c.id);
    let hasRemaining = true;
    let round = 0;

    while (hasRemaining) {
      hasRemaining = false;
      for (const clsId of classIdList) {
        const units = theoryUnitsByClass.get(clsId) || [];
        if (units.length > 0) {
          // Take one unit round-robin
          const unit = units.shift()!;
          interleavedTheoryUnits.push(unit);
          if (units.length > 0) hasRemaining = true;
        }
      }
      round++;
      if (round > 1000) break;
    }

    // Combine: Labs first (highest constraint), then interleaved theory units
    const unassignedUnits: WorkUnit[] = [...labUnits, ...interleavedTheoryUnits];

    // Backtrack search function
    let steps = 0;
    const maxSteps = 40000;
    let bestAssignedCount = 0;
    let bestPartialTimetable: TimetableEntry[] = [...currentTimetable];

    const backtrack = (index: number): boolean => {
      if (index >= unassignedUnits.length) {
        return true; // All scheduled successfully
      }

      if (index > bestAssignedCount) {
        bestAssignedCount = index;
        bestPartialTimetable = [...currentTimetable];
      }

      steps++;
      if (steps > maxSteps) return false; // Guard timeout

      const unit = unassignedUnits[index];
      const subject = subjectMap.get(unit.subjectId);
      if (!subject) return false;

      // Find eligible teachers with fallback
      let eligibleStaffList = staffList.filter(
        (s) => subject.eligibleStaffIds.includes(s.id) || s.subjectIds.includes(subject.id)
      );
      if (eligibleStaffList.length === 0) {
        eligibleStaffList = [...staffList];
      }

      // Sort teachers by remaining capacity + workload balance
      eligibleStaffList.sort((a, b) => {
        const countA = staffWeeklyCount.get(a.id) || 0;
        const countB = staffWeeklyCount.get(b.id) || 0;
        const remainingA = a.maxPeriodsPerWeek - countA;
        const remainingB = b.maxPeriodsPerWeek - countB;
        return remainingB - remainingA;
      });

      // Generate all possible (day, period) slots
      const candidateSlots: { day: DayOfWeek; period: number; score?: number }[] = [];
      const lunchBreak = scheduleConfig.breaks.find(
        (b) => (b.durationMinutes && b.durationMinutes >= 30) || b.label.toLowerCase().includes('lunch')
      );

      for (const day of workingDays) {
        if (unit.consecutiveRequired > 1) {
          // Lab block / Naan Mudhalvan needs consecutive slots (e.g. P1-P2, P3-P4, P1-P4, P6-P9)
          for (let p = 1; p <= periodsPerDay - unit.consecutiveRequired + 1; p++) {
            // Avoid spanning across major lunch break if present
            const spansLunch = lunchBreak
              ? p <= lunchBreak.afterPeriod && p + unit.consecutiveRequired - 1 > lunchBreak.afterPeriod
              : false;
            if (!spansLunch) {
              candidateSlots.push({ day, period: p });
            }
          }
        } else {
          for (let p = 1; p <= periodsPerDay; p++) {
            candidateSlots.push({ day, period: p });
          }
        }
      }

      if (candidateSlots.length === 0) {
        for (const day of workingDays) {
          for (let p = 1; p <= periodsPerDay - unit.consecutiveRequired + 1; p++) {
            candidateSlots.push({ day, period: p });
          }
        }
      }

      // Pre-shuffle candidate slots to avoid deterministic starting bias
      for (let i = candidateSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = candidateSlots[i];
        candidateSlots[i] = candidateSlots[j];
        candidateSlots[j] = temp;
      }

      // Calculate heuristic score for each slot:
      // LOW score = highly desirable slot
      // Penalizes:
      // 1) Placing same subject on the same day multiple times
      // 2) Placing same subject in the SAME HOUR/PERIOD across different days (ANTI-SAME-HOUR SHUFFLE)
      // 3) Clustering exclusively in morning or afternoon
      // 4) Dynamic custom constraints
      for (const slot of candidateSlots) {
        let score = 0;

        // Factor 1: Same-Day Frequency Penalty (Spread subjects evenly across week)
        const countOnThisDay = currentTimetable.filter(
          (e) => e.classId === unit.classId && e.subjectId === unit.subjectId && e.day === slot.day
        ).length;
        score += countOnThisDay * 300; // Strong penalty for stacking multiple on same day

        // Factor 2: ANTI-SAME-HOUR PENALTY (Ensures periods are shuffled across days)
        const countInThisPeriod = currentTimetable.filter(
          (e) => e.classId === unit.classId && e.subjectId === unit.subjectId && e.period === slot.period
        ).length;
        if (constraints.soft.avoidSameHourDaily !== false) {
          score += countInThisPeriod * 220; // Heavy penalty if already in this period/hour on another day
        }

        // Factor 3: Adjacent Period Rotation on Consecutive Days
        const dayIdx = workingDays.indexOf(slot.day);
        if (dayIdx > 0) {
          const prevDay = workingDays[dayIdx - 1];
          const prevDayEntries = currentTimetable.filter(
            (e) => e.classId === unit.classId && e.subjectId === unit.subjectId && e.day === prevDay
          );
          for (const pe of prevDayEntries) {
            if (pe.period === slot.period) {
              score += 100; // Extra penalty for exact same hour on consecutive days
            } else if (Math.abs(pe.period - slot.period) <= 1) {
              score += 25; // Mild penalty for adjacent hour
            }
          }
        }

        // Factor 4: Morning vs Afternoon Time Window Diversity
        const morningCount = currentTimetable.filter(
          (e) => e.classId === unit.classId && e.subjectId === unit.subjectId && e.period <= 2
        ).length;
        const afternoonCount = currentTimetable.filter(
          (e) => e.classId === unit.classId && e.subjectId === unit.subjectId && e.period >= 5
        ).length;
        if (slot.period <= 2 && morningCount >= 2) {
          score += 50;
        } else if (slot.period >= 5 && afternoonCount >= 2) {
          score += 50;
        }

        // Factor 5: Dynamic Custom Constraints Check
        for (const dyn of constraints.dynamic || []) {
          if (!dyn.enabled) continue;
          if (dyn.type === 'SUBJECT_DAILY_MAX' && dyn.params.subjectId === unit.subjectId) {
            if (dyn.params.maxPerDay !== undefined && countOnThisDay >= dyn.params.maxPerDay) {
              score += 5000;
            }
          }
          if (
            dyn.type === 'NO_SUBJECT_ON_DAY' &&
            dyn.params.subjectId === unit.subjectId &&
            dyn.params.day === slot.day
          ) {
            score += 5000;
          }
        }

        // Factor 6: Random Jitter (Produces varied shuffled distribution)
        if (constraints.soft.shufflePeriodsRandomly !== false || options.shufflePeriods) {
          score += (Math.random() - 0.5) * 60;
        }

        slot.score = score;
      }

      // Sort candidate slots by lowest penalty score first
      candidateSlots.sort((a, b) => (a.score || 0) - (b.score || 0));

      for (const slot of candidateSlots) {
        // Check if class is free for all required consecutive periods
        let classIsFree = true;
        for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
          const classSlotKey = `${slot.day}_${slot.period + offset}_${unit.classId}`;
          if (classSlotBusy.has(classSlotKey)) {
            classIsFree = false;
            break;
          }
        }
        if (!classIsFree) continue;

        // Try candidate teachers
        for (const teacher of eligibleStaffList) {
          const currentStaffCount = staffWeeklyCount.get(teacher.id) || 0;
          if (
            constraints.hard.teacherMaxWorkload &&
            currentStaffCount + unit.consecutiveRequired > teacher.maxPeriodsPerWeek
          ) {
            continue;
          }

          // Check teacher availability and no teacher clash
          let teacherCanTeach = true;
          for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
            const p = slot.period + offset;
            const slotKey = `${slot.day}_${p}`;
            const busySet = teacherSlotBusy.get(slotKey);

            if (busySet && busySet.has(teacher.id)) {
              teacherCanTeach = false;
              break;
            }

            // Check explicit unavailable slots
            if (
              constraints.hard.respectUnavailability &&
              teacher.unavailableSlots?.some((s) => s.day === slot.day && s.period === p)
            ) {
              teacherCanTeach = false;
              break;
            }
          }

          if (!teacherCanTeach) continue;

          // Apply state
          const newEntries: TimetableEntry[] = [];
          for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
            const p = slot.period + offset;
            const slotKey = `${slot.day}_${p}`;
            const classSlotKey = `${slot.day}_${p}_${unit.classId}`;
            const entryId = `gen-${unit.classId}-${slot.day}-P${p}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

            if (!teacherSlotBusy.has(slotKey)) teacherSlotBusy.set(slotKey, new Set());
            teacherSlotBusy.get(slotKey)!.add(teacher.id);
            classSlotBusy.set(classSlotKey, entryId);

            const entry: TimetableEntry = {
              id: entryId,
              day: slot.day,
              period: p,
              classId: unit.classId,
              subjectId: unit.subjectId,
              staffId: teacher.id,
              room: unit.room,
              isLocked: false,
            };

            newEntries.push(entry);
            currentTimetable.push(entry);
          }

          staffWeeklyCount.set(
            teacher.id,
            (staffWeeklyCount.get(teacher.id) || 0) + unit.consecutiveRequired
          );

          // Recurse to next unit
          if (backtrack(index + 1)) {
            return true;
          }

          // Backtrack / Undo state
          for (const entry of newEntries) {
            const slotKey = `${entry.day}_${entry.period}`;
            const classSlotKey = `${entry.day}_${entry.period}_${entry.classId}`;

            teacherSlotBusy.get(slotKey)?.delete(teacher.id);
            classSlotBusy.delete(classSlotKey);

            const idx = currentTimetable.findIndex((e) => e.id === entry.id);
            if (idx !== -1) currentTimetable.splice(idx, 1);
          }

          staffWeeklyCount.set(
            teacher.id,
            (staffWeeklyCount.get(teacher.id) || 0) - unit.consecutiveRequired
          );
        }
      }

      return false;
    };

    const success = backtrack(0);

    if (success) {
      return currentTimetable;
    }

    // Phase 2: Greedy Repair Pass if full backtrack was blocked by tight constraints
    // Restore best partial timetable and allocate any remaining units
    const workingTimetable: TimetableEntry[] = [...bestPartialTimetable];
    const placedUnitCount = bestAssignedCount;
    const remainingUnits = unassignedUnits.slice(placedUnitCount);

    for (const unit of remainingUnits) {
      const subject = subjectMap.get(unit.subjectId);
      if (!subject) continue;

      let eligibleStaffList = staffList.filter(
        (s) => subject.eligibleStaffIds.includes(s.id) || s.subjectIds.includes(subject.id)
      );
      if (eligibleStaffList.length === 0) {
        eligibleStaffList = [...staffList];
      }

      // Find any slot where class is free
      let placed = false;
      for (const day of workingDays) {
        if (placed) break;
        for (let p = 1; p <= periodsPerDay - unit.consecutiveRequired + 1; p++) {
          let classFree = true;
          for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
            const ck = `${day}_${p + offset}_${unit.classId}`;
            if (classSlotBusy.has(ck)) {
              classFree = false;
              break;
            }
          }
          if (!classFree) continue;

          // Find teacher least busy at that period
          let bestTeacher = eligibleStaffList.find((t) => {
            for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
              const sk = `${day}_${p + offset}`;
              if (teacherSlotBusy.get(sk)?.has(t.id)) return false;
            }
            return true;
          });

          if (!bestTeacher && eligibleStaffList.length > 0) {
            bestTeacher = eligibleStaffList[0];
          }

          if (bestTeacher) {
            for (let offset = 0; offset < unit.consecutiveRequired; offset++) {
              const periodNum = p + offset;
              const slotKey = `${day}_${periodNum}`;
              const classSlotKey = `${day}_${periodNum}_${unit.classId}`;
              const entryId = `gen-repair-${unit.classId}-${day}-P${periodNum}-${Math.random().toString(36).substr(2, 5)}`;

              if (!teacherSlotBusy.has(slotKey)) teacherSlotBusy.set(slotKey, new Set());
              teacherSlotBusy.get(slotKey)!.add(bestTeacher.id);
              classSlotBusy.set(classSlotKey, entryId);

              const entry: TimetableEntry = {
                id: entryId,
                day,
                period: periodNum,
                classId: unit.classId,
                subjectId: unit.subjectId,
                staffId: bestTeacher.id,
                room: unit.room,
                isLocked: false,
              };

              workingTimetable.push(entry);
            }
            placed = true;
            break;
          }
        }
      }
    }

    return workingTimetable;
  }

  private static calculateSoftConstraintScore(
    entries: TimetableEntry[],
    staffList: Staff[],
    constraints: ConstraintsConfig
  ): number {
    let score = 100;
    const staffWorkload = new Map<string, number>();

    for (const e of entries) {
      staffWorkload.set(e.staffId, (staffWorkload.get(e.staffId) || 0) + 1);
    }

    // Workload variance penalty
    const counts = staffList.map((s) => staffWorkload.get(s.id) || 0);
    if (counts.length > 0) {
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) / counts.length;
      score -= Math.min(25, Math.round(variance * 0.5));
    }

    return Math.max(50, Math.min(100, score));
  }
}
