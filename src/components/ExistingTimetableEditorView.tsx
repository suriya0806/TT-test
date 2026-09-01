import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  ClassInfo,
  DayOfWeek,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';

interface ExistingTimetableEditorViewProps {
  entries: TimetableEntry[];
  staffList: Staff[];
  subjectsList: Subject[];
  classesList: ClassInfo[];
  scheduleConfig: ScheduleConfig;
  onUpdateEntries: (entries: TimetableEntry[]) => void;
  onCompleteExisting: () => void;
  onResetToSampleScenario?: () => void;
}

export const ExistingTimetableEditorView: React.FC<ExistingTimetableEditorViewProps> = ({
  entries,
  staffList,
  subjectsList,
  classesList,
  scheduleConfig,
  onUpdateEntries,
  onCompleteExisting,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classesList[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjectsList[0]?.id || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [room, setRoom] = useState<string>('LH-101');

  const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
  const subjectMap = new Map<string, Subject>(subjectsList.map((s) => [s.id, s]));
  const classMap = new Map<string, ClassInfo>(classesList.map((c) => [c.id, c]));

  const currentClass = classMap.get(selectedClassId);

  // Filter entries for the selected class
  const classEntries = entries.filter((e) => e.classId === selectedClassId);

  // Locked entries count
  const lockedEntriesCount = entries.filter((e) => e.isLocked).length;
  const activeStaffAssigned = new Set(entries.map((e) => e.staffId)).size;

  // Handle cell assignment
  const handleAssignSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !selectedStaffId) return;

    const existingIndex = entries.findIndex(
      (e) => e.classId === selectedClassId && e.day === selectedDay && e.period === selectedPeriod
    );

    const newEntry: TimetableEntry = {
      id: existingIndex !== -1 ? entries[existingIndex].id : `entry-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      day: selectedDay,
      period: selectedPeriod,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      staffId: selectedStaffId,
      room: room.trim() || undefined,
      isLocked: true,
    };

    if (existingIndex !== -1) {
      const updated = [...entries];
      updated[existingIndex] = newEntry;
      onUpdateEntries(updated);
    } else {
      onUpdateEntries([...entries, newEntry]);
    }
  };

  const handleClearSlot = (day: DayOfWeek, period: number) => {
    onUpdateEntries(
      entries.filter(
        (e) => !(e.classId === selectedClassId && e.day === day && e.period === period)
      )
    );
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateEntries(entries.filter((e) => e.id !== id));
  };

  const handleClearAllExisting = () => {
    if (confirm('Are you sure you want to clear all existing timetable allocations?')) {
      onUpdateEntries([]);
    }
  };

  return (
    <div id="existing-timetable-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Master Schedule & Draft Editor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manually lock specific slots, assign faculty preferences, and manage class schedules.
            The engine respects all locked slots and fills in remaining curriculum requirements automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleClearAllExisting}
            className="px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Clear all allocated slots"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Clear All Slots</span>
          </button>
          <button
            onClick={onCompleteExisting}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Complete Missing Slots</span>
          </button>
        </div>
      </div>

      {/* Schedule Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs transition-colors">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Total Allocations</span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{entries.length} slots</span>
          </div>
          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold rounded">
            {classEntries.length} in {currentClass?.name || 'Selected Class'}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs transition-colors">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Locked Manual Slots</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lockedEntriesCount} locked
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {entries.length > 0 ? Math.round((lockedEntriesCount / entries.length) * 100) : 0}% locked
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs transition-colors">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Faculty Utilization</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeStaffAssigned} of {staffList.length} Active
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              activeStaffAssigned === staffList.length
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
            }`}
          >
            {activeStaffAssigned === staffList.length ? '100% Engaged' : `${staffList.length - activeStaffAssigned} Available`}
          </span>
        </div>
      </div>

      {/* Interactive Slot Assignment Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Quick Slot Assignment Tool</h3>

        <form onSubmit={handleAssignSlot} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Day of Week</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {scheduleConfig.workingDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Period Number</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Period {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjectMap.get(e.target.value);
                if (sub?.eligibleStaffIds?.[0]) setSelectedStaffId(sub.eligibleStaffIds[0]);
                if (sub?.roomRequired) setRoom(sub.roomRequired);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Teacher</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign / Lock Slot</span>
            </button>
          </div>
        </form>
      </div>

      {/* Class Schedule Grid Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Interactive Grid: <span className="text-indigo-600 dark:text-indigo-400">{currentClass?.name}</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({classEntries.length} slots assigned)
            </span>
          </div>

          <button
            onClick={handleClearAllExisting}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Drafts</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="p-3 text-left w-28 border-r border-slate-200 dark:border-slate-800">Day</th>
                {Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => (
                  <th key={i} className="p-3 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                    P{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {scheduleConfig.workingDays.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-left font-bold text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">{day}</td>
                  {Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => {
                    const p = i + 1;
                    const entry = classEntries.find((e) => e.day === day && e.period === p);
                    const sub = entry ? subjectMap.get(entry.subjectId) : null;
                    const staff = entry ? staffMap.get(entry.staffId) : null;

                    return (
                      <td key={p} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top min-w-[120px]">
                        {entry ? (
                          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2 text-left relative group">
                            <div className="font-bold text-indigo-950 dark:text-indigo-200 text-xs line-clamp-2 leading-tight pr-4" title={sub?.name || sub?.code || entry.subjectId}>
                              {sub?.name || sub?.code || entry.subjectId}
                            </div>
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-medium mt-0.5" title={staff?.name}>
                              {staff?.name || entry.staffId}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {sub?.code && <span className="font-mono">{sub.code}</span>}
                              <span>{entry.room || ''}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleClearSlot(day, p)}
                              className="absolute top-1 right-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                              title="Clear slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setSelectedDay(day);
                              setSelectedPeriod(p);
                            }}
                            className="h-14 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 cursor-pointer transition-all"
                          >
                            + Assign
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
