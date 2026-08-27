import React, { useState } from 'react';
import {
  User,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ClassInfo,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ExportService } from '../services/exportService';
import { computePeriodTimeRanges } from '../utils/scheduleHelper';

interface StaffTimetableGridProps {
  staffList: Staff[];
  classesList: ClassInfo[];
  subjectsList: Subject[];
  scheduleConfig: ScheduleConfig;
  entries: TimetableEntry[];
  onToggleStaffAvailability?: (staffId: string, day: string, period: number) => void;
}

export const StaffTimetableGrid: React.FC<StaffTimetableGridProps> = ({
  staffList,
  classesList,
  subjectsList,
  scheduleConfig,
  entries,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const staffMap = new Map<string, Staff>(staffList.map((s) => [s.id, s]));
  const subjectMap = new Map<string, Subject>(subjectsList.map((s) => [s.id, s]));
  const classMap = new Map<string, ClassInfo>(classesList.map((c) => [c.id, c]));

  const departments = Array.from(new Set(staffList.map((s) => s.department)));

  const filteredStaff = staffList.filter(
    (s) => deptFilter === 'ALL' || s.department === deptFilter
  );

  const activeStaff = staffMap.get(selectedStaffId) || filteredStaff[0] || staffList[0];

  const staffEntries = activeStaff
    ? entries.filter((e) => e.staffId === activeStaff.id)
    : [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!activeStaff) return;
    ExportService.exportStaffToCsv(activeStaff, entries, classesList, subjectsList, scheduleConfig);
  };

  const handleExportExcel = () => {
    if (!activeStaff) return;
    ExportService.exportStaffToExcel(activeStaff, entries, classesList, subjectsList, scheduleConfig);
  };

  const handleExportPdf = () => {
    if (!activeStaff) return;
    ExportService.exportStaffToPdf(activeStaff, entries, classesList, subjectsList, scheduleConfig);
  };

  const assignedCount = staffEntries.length;
  const maxWorkload = activeStaff?.maxPeriodsPerWeek || 20;
  const workloadPct = Math.min(100, Math.round((assignedCount / maxWorkload) * 100));

  if (staffList.length === 0) {
    return (
      <div id="staff-timetable-view" className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Faculty Members Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please add faculty members from the Faculty tab to view their personal timetables and workload distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="staff-timetable-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter & Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Filter Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                const first = staffList.find(
                  (s) => e.target.value === 'ALL' || s.department === e.target.value
                );
                if (first) setSelectedStaffId(first.id);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
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
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Select Faculty Member
            </label>
            <select
              id="staff-selector"
              value={activeStaff?.id || ''}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-indigo-300 bg-indigo-50/50 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500"
            >
              {filteredStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            title="Export Excel Worksheet (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            title="Print Schedule"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Staff Timetable Card Canvas */}
      {activeStaff ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
          {/* Header on Printable View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{activeStaff.name} Schedule</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeStaff.designation} • <span className="font-medium text-slate-700">{activeStaff.department}</span> • Cap: <span className="font-medium text-slate-700">{activeStaff.maxPeriodsPerWeek} p/wk</span>
              </p>
            </div>

            {/* Workload Progress Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Load Balance</span>
                <span className="font-bold text-slate-900">
                  {assignedCount} / {maxWorkload} periods ({workloadPct}%)
                </span>
              </div>
              <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    assignedCount > maxWorkload
                      ? 'bg-rose-500'
                      : workloadPct >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, workloadPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Clean Minimalism Responsive Table Grid */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-left w-28 border-r border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Day / Per
                  </th>
                  {computePeriodTimeRanges(scheduleConfig).map((slotInfo) => {
                    const p = slotInfo.period;
                    return (
                      <th key={p} className="p-2.5 border-r border-slate-200 last:border-r-0 min-w-[110px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">P{p}</p>
                        <p className="text-[10px] text-slate-500 font-normal">{slotInfo.timeRange}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scheduleConfig.workingDays.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-left font-bold text-slate-700 bg-slate-50/60 border-r border-slate-200">
                      {day.slice(0, 3).toUpperCase()}
                    </td>
                    {Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => {
                      const p = i + 1;
                      const entry = staffEntries.find((e) => e.day === day && e.period === p);
                      const sub = entry ? subjectMap.get(entry.subjectId) : null;
                      const cls = entry ? classMap.get(entry.classId) : null;
                      const isUnavailable = activeStaff.unavailableSlots?.some(
                        (u) => u.day === day && u.period === p
                      );

                      return (
                        <td
                          key={p}
                          className={`p-3 border-r border-slate-200 last:border-r-0 align-top transition-colors ${
                            isUnavailable
                              ? 'bg-rose-50/30'
                              : entry
                              ? 'bg-white'
                              : 'bg-slate-50/10'
                          }`}
                        >
                          {entry ? (
                            <div className="text-left space-y-0.5">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-xs text-slate-900">{cls?.name || entry.classId}</p>
                                <span className="text-[10px] font-semibold text-indigo-700">
                                  {sub?.code}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate" title={sub?.name}>
                                {sub?.name}
                              </p>
                              {entry.room && (
                                <p className="text-[9px] text-slate-400 truncate">
                                  {entry.room}
                                </p>
                              )}
                            </div>
                          ) : isUnavailable ? (
                            <div className="h-10 flex items-center justify-center text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                              Unavailable
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                              Free
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
    </div>
  );
};
