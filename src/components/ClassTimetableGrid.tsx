import React, { useState } from 'react';
import {
  Grid3X3,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Building,
  Shuffle,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import {
  ClassInfo,
  DayOfWeek,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ExportService } from '../services/exportService';
import { computePeriodTimeRanges } from '../utils/scheduleHelper';

interface ClassTimetableGridProps {
  classesList: ClassInfo[];
  staffList: Staff[];
  subjectsList: Subject[];
  scheduleConfig: ScheduleConfig;
  entries: TimetableEntry[];
  onShuffleTimetable?: () => void;
  onUpdateEntries?: (entries: TimetableEntry[]) => void;
}

export const ClassTimetableGrid: React.FC<ClassTimetableGridProps> = ({
  classesList,
  staffList,
  subjectsList,
  scheduleConfig,
  entries,
  onShuffleTimetable,
  onUpdateEntries,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classesList[0]?.id || '');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Slot Edit Modal State
  const [editingSlot, setEditingSlot] = useState<{ day: DayOfWeek; period: number; entry?: TimetableEntry } | null>(null);
  const [slotSubjectId, setSlotSubjectId] = useState<string>('');
  const [slotStaffId, setSlotStaffId] = useState<string>('');
  const [slotRoom, setSlotRoom] = useState<string>('');
  const [slotIsLocked, setSlotIsLocked] = useState<boolean>(false);

  const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
  const subjectMap = new Map<string, Subject>(subjectsList.map((s) => [s.id, s]));
  const classMap = new Map<string, ClassInfo>(classesList.map((c) => [c.id, c]));

  const departments = Array.from(new Set(classesList.map((c) => c.department)));

  const filteredClasses = classesList.filter(
    (c) => deptFilter === 'ALL' || c.department === deptFilter
  );

  const activeClass = classMap.get(selectedClassId) || filteredClasses[0] || classesList[0];

  const classEntries = activeClass
    ? entries.filter((e) => e.classId === activeClass.id)
    : [];

  const openSlotEdit = (day: DayOfWeek, period: number, existing?: TimetableEntry) => {
    if (!onUpdateEntries) return;
    setEditingSlot({ day, period, entry: existing });
    setSlotSubjectId(existing?.subjectId || (activeClass?.subjects[0]?.subjectId || subjectsList[0]?.id || ''));
    setSlotStaffId(existing?.staffId || staffList[0]?.id || '');
    setSlotRoom(existing?.room || activeClass?.room || 'LH-101');
    setSlotIsLocked(existing?.isLocked || false);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !activeClass || !onUpdateEntries) return;

    // Filter out previous entry at this class, day, period
    const remaining = entries.filter(
      (e) => !(e.classId === activeClass.id && e.day === editingSlot.day && e.period === editingSlot.period)
    );

    if (slotSubjectId && slotStaffId) {
      const newEntry: TimetableEntry = {
        id: editingSlot.entry?.id || `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        classId: activeClass.id,
        subjectId: slotSubjectId,
        staffId: slotStaffId,
        day: editingSlot.day,
        period: editingSlot.period,
        room: slotRoom.trim() || undefined,
        isLocked: slotIsLocked,
      };
      onUpdateEntries([...remaining, newEntry]);
    } else {
      onUpdateEntries(remaining);
    }
    setEditingSlot(null);
  };

  const handleClearSlot = () => {
    if (!editingSlot || !activeClass || !onUpdateEntries) return;
    const remaining = entries.filter(
      (e) => !(e.classId === activeClass.id && e.day === editingSlot.day && e.period === editingSlot.period)
    );
    onUpdateEntries(remaining);
    setEditingSlot(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!activeClass) return;
    ExportService.exportClassToCsv(activeClass, entries, staffList, subjectsList, scheduleConfig);
  };

  const handleExportExcel = () => {
    if (!activeClass) return;
    ExportService.exportClassToExcel(activeClass, entries, staffList, subjectsList, scheduleConfig);
  };

  const handleExportPdf = () => {
    if (!activeClass) return;
    ExportService.exportClassToPdf(activeClass, entries, staffList, subjectsList, scheduleConfig);
  };

  if (classesList.length === 0) {
    return (
      <div id="class-timetable-view" className="p-6 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Classes Available</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Please add at least one Class Section from the Classes tab to view and edit its master timetable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="class-timetable-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter & Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Filter Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                const firstInDept = classesList.find(
                  (c) => e.target.value === 'ALL' || c.department === e.target.value
                );
                if (firstInDept) setSelectedClassId(firstInDept.id);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Select Class Section
            </label>
            <select
              id="class-selector"
              value={activeClass?.id || ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.department.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2">
          {onShuffleTimetable && (
            <button
              onClick={onShuffleTimetable}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Shuffle & rotate subject hours daily across days"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Shuffle Schedule</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Export Excel Worksheet (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Export Clean PDF Document"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Print Schedule"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Class Timetable Grid Canvas */}
      {activeClass ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 transition-colors">
          {/* Header on Printable View */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{activeClass.name} Master Schedule</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Department: <span className="font-medium text-slate-700 dark:text-slate-300">{activeClass.department}</span> • Year: <span className="font-medium text-slate-700 dark:text-slate-300">{activeClass.year}</span> • Section: <span className="font-medium text-slate-700 dark:text-slate-300">{activeClass.section}</span> • Room: <span className="font-medium text-slate-700 dark:text-slate-300">{activeClass.room || 'LH-101'}</span>
              </p>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Weekly Budget</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{classEntries.length} periods assigned</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Click any cell to edit</span>
            </div>
          </div>

          {/* Clean Minimalism Responsive Table Grid */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 text-left w-28 border-r border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Day / Per
                  </th>
                  {computePeriodTimeRanges(scheduleConfig).map((slotInfo) => {
                    const p = slotInfo.period;
                    return (
                      <th key={p} className="p-2.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-w-[110px]">
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">P{p}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{slotInfo.timeRange}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {scheduleConfig.workingDays.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-left font-bold text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                      {day.slice(0, 3).toUpperCase()}
                    </td>
                    {Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => {
                      const p = i + 1;
                      const entry = classEntries.find((e) => e.day === day && e.period === p);
                      const sub = entry ? subjectMap.get(entry.subjectId) : null;
                      const staff = entry ? staffMap.get(entry.staffId) : null;
                      const isLab = sub?.type === 'Lab';

                      return (
                        <td
                          key={p}
                          onClick={() => openSlotEdit(day, p, entry)}
                          className={`p-3 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top transition-all cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:z-10 ${
                            entry
                              ? isLab
                                ? 'bg-indigo-50/30 dark:bg-indigo-950/30'
                                : 'bg-white dark:bg-slate-900'
                              : 'bg-slate-50/10 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                          }`}
                          title="Click to edit or assign this period"
                        >
                          {entry ? (
                            <div className="text-left space-y-0.5">
                              <div className="flex items-start justify-between gap-1">
                                <p
                                  className={`font-bold text-xs leading-tight line-clamp-2 ${
                                    isLab ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                  title={sub?.name || sub?.code || entry.subjectId}
                                >
                                  {sub?.name || sub?.code || entry.subjectId}
                                </p>
                                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                                  {entry.isLocked && <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
                                  {isLab && (
                                    <span className="text-[9px] font-bold uppercase px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                      LAB
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={staff?.name}>
                                {staff?.name ? `Prof. ${staff.name.replace(/^Prof\.\s*|^Dr\.\s*/, '')}` : entry.staffId}
                              </p>
                              <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500">
                                {sub?.code && <span className="font-mono text-slate-400 dark:text-slate-500">{sub.code}</span>}
                                {entry.room && <span className="truncate">{entry.room}</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wider hover:text-indigo-500 dark:hover:text-indigo-400">
                              + Free
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
      ) : null}

      {/* Interactive Slot Edit Modal */}
      {editingSlot && activeClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Edit {editingSlot.day} Period {editingSlot.period}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeClass.name}</p>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- No Subject (Free Slot) --</option>
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty Member</label>
                <select
                  value={slotStaffId}
                  onChange={(e) => setSlotStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Select Faculty --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Classroom / Lab Location</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder="e.g. LH-101 or Computing Lab"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lock-slot-check"
                  checked={slotIsLocked}
                  onChange={(e) => setSlotIsLocked(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="lock-slot-check" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Lock this slot (solver will keep this fixed)
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                {editingSlot.entry ? (
                  <button
                    type="button"
                    onClick={handleClearSlot}
                    className="px-3 py-1.5 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Slot</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg font-semibold shadow-xs cursor-pointer"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
