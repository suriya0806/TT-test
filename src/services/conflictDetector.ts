import {
  ClassInfo,
  ConflictItem,
  ConstraintsConfig,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';

export class ConflictDetector {
  static detectAllConflicts(
    entries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    classesList: ClassInfo[],
    scheduleConfig: ScheduleConfig,
    constraints?: ConstraintsConfig
  ): ConflictItem[] {
    const conflicts: ConflictItem[] = [];

    const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
    const subjectMap = new Map<string, Subject>(subjectsList.map((sub) => [sub.id, sub]));
    const classMap = new Map<string, ClassInfo>(classesList.map((c) => [c.id, c]));

    // 1. TEACHER CLASH DETECTION (Same teacher in multiple classes at same day & period)
    const teacherSlotMap = new Map<string, TimetableEntry[]>();
    for (const entry of entries) {
      if (!entry.staffId) continue;
      const key = `${entry.staffId}_${entry.day}_${entry.period}`;
      const list = teacherSlotMap.get(key) || [];
      list.push(entry);
      teacherSlotMap.set(key, list);
    }

    teacherSlotMap.forEach((slotEntries, key) => {
      if (slotEntries.length > 1) {
        const staff = staffMap.get(slotEntries[0].staffId);
        const day = slotEntries[0].day;
        const period = slotEntries[0].period;
        const classNames = slotEntries
          .map((e) => classMap.get(e.classId)?.name || e.classId)
          .join(' and ');

        // Find available alternative teachers for the subject
        const targetEntry = slotEntries[1];
        const subject = subjectMap.get(targetEntry.subjectId);
        const altTeachers = (subject?.eligibleStaffIds || [])
          .filter((id) => id !== targetEntry.staffId)
          .map((id) => staffMap.get(id)?.name || id);

        conflicts.push({
          id: `conflict-teacher-clash-${key}`,
          type: 'TEACHER_CLASH',
          severity: 'CRITICAL',
          title: `Teacher Clash: ${staff?.name || 'Staff'} double-booked`,
          description: `${staff?.name || 'Staff'} is assigned simultaneously to ${slotEntries.length} classes (${classNames}) on ${day} Period ${period}.`,
          day,
          period,
          staffId: slotEntries[0].staffId,
          staffName: staff?.name,
          affectedEntryIds: slotEntries.map((e) => e.id),
          suggestedAction: altTeachers.length
            ? `Reassign one class to eligible teacher: ${altTeachers.join(', ')}`
            : 'Move one class period to another available time slot.',
          resolutionOptions: (subject?.eligibleStaffIds || [])
            .filter((id) => id !== targetEntry.staffId)
            .map((id) => ({
              actionType: 'reassign_teacher',
              label: `Assign to ${staffMap.get(id)?.name || id}`,
              newStaffId: id,
            })),
        });
      }
    });

    // 2. CLASS CLASH DETECTION (Same class having multiple subjects at same day & period)
    const classSlotMap = new Map<string, TimetableEntry[]>();
    for (const entry of entries) {
      if (!entry.classId) continue;
      const key = `${entry.classId}_${entry.day}_${entry.period}`;
      const list = classSlotMap.get(key) || [];
      list.push(entry);
      classSlotMap.set(key, list);
    }

    classSlotMap.forEach((slotEntries, key) => {
      if (slotEntries.length > 1) {
        const cls = classMap.get(slotEntries[0].classId);
        const day = slotEntries[0].day;
        const period = slotEntries[0].period;
        const subjectNames = slotEntries
          .map((e) => subjectMap.get(e.subjectId)?.name || e.subjectId)
          .join(' and ');

        conflicts.push({
          id: `conflict-class-clash-${key}`,
          type: 'CLASS_CLASH',
          severity: 'CRITICAL',
          title: `Class Clash: ${cls?.name || 'Class'} double-booked`,
          description: `Class ${cls?.name || 'Class'} is assigned multiple subjects (${subjectNames}) simultaneously on ${day} Period ${period}.`,
          day,
          period,
          classId: slotEntries[0].classId,
          className: cls?.name,
          affectedEntryIds: slotEntries.map((e) => e.id),
          suggestedAction: 'Remove duplicate entry or move one subject to a free period slot.',
          resolutionOptions: [
            {
              actionType: 'remove_entry',
              label: `Remove duplicate entry for ${subjectMap.get(slotEntries[1].subjectId)?.name || 'Subject'}`,
            },
          ],
        });
      }
    });

    // 3. TEACHER ELIGIBILITY VIOLATION
    for (const entry of entries) {
      if (!entry.staffId || !entry.subjectId) continue;
      const staff = staffMap.get(entry.staffId);
      const subject = subjectMap.get(entry.subjectId);

      if (staff && subject) {
        const isEligible =
          staff.subjectIds.includes(subject.id) ||
          subject.eligibleStaffIds.includes(staff.id);

        if (!isEligible) {
          const eligibleNames = subject.eligibleStaffIds
            .map((id) => staffMap.get(id)?.name || id)
            .join(', ');

          conflicts.push({
            id: `conflict-eligibility-${entry.id}`,
            type: 'ELIGIBILITY_MISMATCH',
            severity: 'CRITICAL',
            title: `Teacher Eligibility Conflict: ${staff.name}`,
            description: `${staff.name} is assigned to teach "${subject.name}" on ${entry.day} P${entry.period}, but is not qualified/registered for this subject.`,
            day: entry.day,
            period: entry.period,
            classId: entry.classId,
            className: classMap.get(entry.classId)?.name,
            staffId: staff.id,
            staffName: staff.name,
            subjectId: subject.id,
            subjectName: subject.name,
            affectedEntryIds: [entry.id],
            suggestedAction: `Reassign to qualified faculty: ${eligibleNames || 'None'}`,
            resolutionOptions: subject.eligibleStaffIds.map((id) => ({
              actionType: 'reassign_teacher',
              label: `Assign to ${staffMap.get(id)?.name || id}`,
              newStaffId: id,
            })),
          });
        }
      }
    }

    // 4. TEACHER WORKLOAD OVERLOAD
    const staffWorkload = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.staffId) continue;
      staffWorkload.set(entry.staffId, (staffWorkload.get(entry.staffId) || 0) + 1);
    }

    staffWorkload.forEach((assignedCount, staffId) => {
      const staff = staffMap.get(staffId);
      if (staff && assignedCount > staff.maxPeriodsPerWeek) {
        const excess = assignedCount - staff.maxPeriodsPerWeek;
        conflicts.push({
          id: `conflict-workload-${staffId}`,
          type: 'WORKLOAD_OVERLOAD',
          severity: 'CRITICAL',
          title: `Workload Overload: ${staff.name}`,
          description: `${staff.name} has ${assignedCount} allocated periods, exceeding the weekly maximum limit of ${staff.maxPeriodsPerWeek} periods by ${excess} period(s).`,
          staffId: staff.id,
          staffName: staff.name,
          suggestedAction: `Reassign ${excess} period(s) to other available teachers or increase workload threshold.`,
        });
      }
    });

    // 5. TEACHER UNAVAILABLE SLOT VIOLATION
    for (const entry of entries) {
      if (!entry.staffId) continue;
      const staff = staffMap.get(entry.staffId);
      if (staff && staff.unavailableSlots) {
        const isUnavailable = staff.unavailableSlots.some(
          (slot) => slot.day === entry.day && slot.period === entry.period
        );
        if (isUnavailable) {
          conflicts.push({
            id: `conflict-unavail-${entry.id}`,
            type: 'UNAVAILABLE_SLOT',
            severity: 'CRITICAL',
            title: `Unavailable Slot Conflict: ${staff.name}`,
            description: `${staff.name} is scheduled on ${entry.day} Period ${entry.period}, which is marked as an unavailable period.`,
            day: entry.day,
            period: entry.period,
            staffId: staff.id,
            staffName: staff.name,
            classId: entry.classId,
            className: classMap.get(entry.classId)?.name,
            affectedEntryIds: [entry.id],
            suggestedAction: 'Move this period to another time slot or reassign teacher.',
          });
        }
      }
    }

    // 6. MISSING AND EXCESS SUBJECT PERIODS PER CLASS
    for (const cls of classesList) {
      const classEntries = entries.filter((e) => e.classId === cls.id);
      for (const req of cls.subjects) {
        const subject = subjectMap.get(req.subjectId);
        const subjectName = subject?.name || req.subjectId;
        const allocatedCount = classEntries.filter((e) => e.subjectId === req.subjectId).length;

        if (allocatedCount < req.periodsPerWeek) {
          const missing = req.periodsPerWeek - allocatedCount;
          conflicts.push({
            id: `conflict-missing-${cls.id}-${req.subjectId}`,
            type: 'MISSING_PERIODS',
            severity: 'WARNING',
            title: `Missing Periods: ${subjectName} in ${cls.name}`,
            description: `Class ${cls.name} requires ${req.periodsPerWeek} periods/week for ${subjectName}, but only ${allocatedCount} are allocated (${missing} missing).`,
            classId: cls.id,
            className: cls.name,
            subjectId: req.subjectId,
            subjectName: subjectName,
            suggestedAction: `Click "Complete Existing Timetable" to schedule the remaining ${missing} period(s).`,
          });
        } else if (allocatedCount > req.periodsPerWeek) {
          const excess = allocatedCount - req.periodsPerWeek;
          conflicts.push({
            id: `conflict-excess-${cls.id}-${req.subjectId}`,
            type: 'EXCESS_PERIODS',
            severity: 'WARNING',
            title: `Excess Periods: ${subjectName} in ${cls.name}`,
            description: `Class ${cls.name} has ${allocatedCount} allocated periods for ${subjectName}, exceeding requirement of ${req.periodsPerWeek} by ${excess} period(s).`,
            classId: cls.id,
            className: cls.name,
            subjectId: req.subjectId,
            subjectName: subjectName,
            suggestedAction: `Remove ${excess} unneeded period(s) for ${subjectName}.`,
          });
        }
      }
    }

    // 7. CONSECUTIVE PERIODS CHECK (Labs / Naan Mudhalvan skill blocks)
    for (const cls of classesList) {
      const classEntries = entries.filter((e) => e.classId === cls.id);
      for (const req of cls.subjects) {
        const subject = subjectMap.get(req.subjectId);
        if (subject && subject.consecutivePeriodsRequired > 1) {
          const subEntries = classEntries.filter((e) => e.subjectId === req.subjectId);
          // Group by day
          const dayGroups = new Map<string, number[]>();
          for (const se of subEntries) {
            const periods = dayGroups.get(se.day) || [];
            periods.push(se.period);
            dayGroups.set(se.day, periods);
          }

          dayGroups.forEach((periods, day) => {
            periods.sort((a, b) => a - b);
            if (periods.length === 1 && subject.consecutivePeriodsRequired > 1) {
              conflicts.push({
                id: `conflict-lab-consec-${cls.id}-${req.subjectId}-${day}`,
                type: 'LAB_CONSECUTIVE_VIOLATION',
                severity: 'WARNING',
                title: `Consecutive Block Split: ${subject.name} in ${cls.name}`,
                description: `${subject.name} on ${day} is scheduled as a single period (P${periods[0]}), but requires ${subject.consecutivePeriodsRequired} consecutive periods.`,
                day: day as any,
                classId: cls.id,
                className: cls.name,
                subjectId: subject.id,
                subjectName: subject.name,
                suggestedAction: `Schedule ${subject.consecutivePeriodsRequired} contiguous periods on ${day}.`,
              });
            }
          });
        }
      }
    }

    return conflicts;
  }
}
