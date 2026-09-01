import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  UserX,
  Layers,
  Clock,
  BookX,
  HelpCircle,
} from 'lucide-react';
import { ConflictItem, Staff, Subject, TimetableEntry } from '../types';

interface ConflictCenterViewProps {
  conflicts: ConflictItem[];
  staffList: Staff[];
  subjectsList: Subject[];
  onAutoResolveAll: () => void;
  onResolveSingleConflict: (conflict: ConflictItem, selectedStaffId: string) => void;
  onRemoveConflictingEntry: (entryId: string) => void;
  isSolving: boolean;
}

export const ConflictCenterView: React.FC<ConflictCenterViewProps> = ({
  conflicts,
  staffList,
  subjectsList,
  onAutoResolveAll,
  onResolveSingleConflict,
  onRemoveConflictingEntry,
  isSolving,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const teacherClashes = conflicts.filter((c) => c.type === 'TEACHER_CLASH');
  const classClashes = conflicts.filter((c) => c.type === 'CLASS_CLASH');
  const workloadConflicts = conflicts.filter((c) => c.type === 'WORKLOAD_OVERLOAD');
  const missingConflicts = conflicts.filter((c) => c.type === 'MISSING_PERIODS');
  const eligibilityConflicts = conflicts.filter((c) => c.type === 'ELIGIBILITY_MISMATCH');
  const otherConflicts = conflicts.filter(
    (c) =>
      c.type !== 'TEACHER_CLASH' &&
      c.type !== 'CLASS_CLASH' &&
      c.type !== 'WORKLOAD_OVERLOAD' &&
      c.type !== 'MISSING_PERIODS' &&
      c.type !== 'ELIGIBILITY_MISMATCH'
  );

  const filteredConflicts = conflicts.filter((c) => {
    const matchesFilter = filterType === 'ALL' || c.type === filterType;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div id="conflict-center-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Conflict Detection & Resolution Center</h2>
            {conflicts.length === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                0 Active Conflicts
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {conflicts.length} Pending Conflicts
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time diagnostics for faculty double-bookings, class overlap collisions, missing curriculum hours, 
            workload exceedances, and qualification mismatches.
          </p>
        </div>

        {conflicts.length > 0 && (
          <button
            id="btn-auto-resolve-master"
            onClick={onAutoResolveAll}
            disabled={isSolving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>AUTO RESOLVE ALL ({conflicts.length})</span>
          </button>
        )}
      </div>

      {/* Conflict Statistics Meter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setFilterType('ALL')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Total</span>
          <span className="text-xl font-bold">{conflicts.length}</span>
        </div>

        <div
          onClick={() => setFilterType('TEACHER_CLASH')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'TEACHER_CLASH'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-rose-50/40 dark:hover:bg-rose-950/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Teacher Clash</span>
          <span className="text-xl font-bold">{teacherClashes.length}</span>
        </div>

        <div
          onClick={() => setFilterType('CLASS_CLASH')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'CLASS_CLASH'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-rose-50/40 dark:hover:bg-rose-950/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Class Clash</span>
          <span className="text-xl font-bold">{classClashes.length}</span>
        </div>

        <div
          onClick={() => setFilterType('WORKLOAD_OVERLOAD')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'WORKLOAD_OVERLOAD'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-amber-950/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Overloads</span>
          <span className="text-xl font-bold">{workloadConflicts.length}</span>
        </div>

        <div
          onClick={() => setFilterType('MISSING_PERIODS')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'MISSING_PERIODS'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Missing Hours</span>
          <span className="text-xl font-bold">{missingConflicts.length}</span>
        </div>

        <div
          onClick={() => setFilterType('ELIGIBILITY_MISMATCH')}
          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
            filterType === 'ELIGIBILITY_MISMATCH'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-purple-50/40 dark:hover:bg-purple-950/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block">Eligibility</span>
          <span className="text-xl font-bold">{eligibilityConflicts.length}</span>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Zero Schedule Conflicts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No faculty double bookings, class collisions, or constraint violations in the current timetable.
            </p>
          </div>
        ) : (
          filteredConflicts.map((conflict) => {
            const isCritical = conflict.severity === 'CRITICAL';

            return (
              <div
                key={conflict.id}
                id={`conflict-card-${conflict.id}`}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs flex flex-col md:flex-row items-start justify-between gap-5 transition-all ${
                  isCritical ? 'border-rose-300 dark:border-rose-800' : 'border-amber-300 dark:border-amber-800'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {conflict.type.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{conflict.title}</h4>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{conflict.description}</p>

                  {conflict.suggestedAction && (
                    <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 rounded-lg text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>
                        <strong>Recommended Fix:</strong> {conflict.suggestedAction}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resolution Actions */}
                <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                  {conflict.resolutionOptions && conflict.resolutionOptions.length > 0 ? (
                    conflict.resolutionOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (opt.newStaffId) {
                            onResolveSingleConflict(conflict, opt.newStaffId);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-2xs text-left truncate cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))
                  ) : conflict.affectedEntryIds && conflict.affectedEntryIds.length > 0 ? (
                    <button
                      onClick={() => onRemoveConflictingEntry(conflict.affectedEntryIds![0])}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove Duplicate Entry
                    </button>
                  ) : (
                    <button
                      onClick={onAutoResolveAll}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Auto-Fix in Solver
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
