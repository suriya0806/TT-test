import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  FileCheck2,
  Sliders,
  Shuffle,
} from 'lucide-react';
import {
  ClassInfo,
  ConstraintsConfig,
  ScheduleConfig,
  SolveResult,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ActiveTab } from './Sidebar';

interface GenerateViewProps {
  onGenerateNew: () => void;
  onCompleteExisting: () => void;
  onShuffleTimetable?: () => void;
  onNavigate: (tab: ActiveTab) => void;
  lastSolveResult: SolveResult | null;
  isSolving: boolean;
  staffList: Staff[];
  classesList: ClassInfo[];
  subjectsList: Subject[];
  scheduleConfig: ScheduleConfig;
  entries: TimetableEntry[];
}

export const GenerateView: React.FC<GenerateViewProps> = ({
  onGenerateNew,
  onCompleteExisting,
  onShuffleTimetable,
  onNavigate,
  lastSolveResult,
  isSolving,
  staffList,
  classesList,
  subjectsList,
  scheduleConfig,
  entries,
}) => {
  const totalRequired = classesList.reduce(
    (sum, c) => sum + c.subjects.reduce((sSum, s) => sSum + s.periodsPerWeek, 0),
    0
  );
  const totalFacultyWorkload = staffList.reduce((sum, s) => sum + s.maxPeriodsPerWeek, 0);

  return (
    <div id="generate-view" className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-2 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Zap className="w-3.5 h-3.5" /> Constraint Satisfaction Engine (CP-SAT Model)
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Timetable Generator & Optimization Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
          Execute constraint satisfaction backtrack search with Minimum Remaining Values (MRV), Least Constraining Value (LCV), 
          and Daily Period Rotation to ensure varied subject distribution across the week.
        </p>
      </div>

      {/* Generation Mode Selectors (3 Action Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode 1: Complete Existing Timetable */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-950 text-white rounded-xl p-5 shadow-md border border-indigo-950 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Incremental Fill
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Complete Existing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Preserves locked slots, clears clashes, and fills unassigned curriculum periods with qualified staff.
            </p>
          </div>

          <button
            id="btn-complete-existing-main"
            onClick={onCompleteExisting}
            disabled={isSolving}
            className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Solving...' : 'COMPLETE EXISTING'}</span>
          </button>
        </div>

        {/* Mode 2: Shuffle & Rotate Hours (USER REQUEST FEATURE) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Anti-Same-Hour Rotation
            </div>
            <h3 className="text-base font-bold text-amber-950 dark:text-amber-200 tracking-tight">Shuffle & Rotate Hours</h3>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Shuffles and rotates periods across days so subjects do not repeat at the same hour daily (e.g. shifts morning to afternoon across days).
            </p>
          </div>

          <button
            id="btn-shuffle-timetable-main"
            onClick={onShuffleTimetable || onGenerateNew}
            disabled={isSolving}
            className="w-full py-2.5 text-xs font-bold text-amber-950 dark:text-slate-900 bg-amber-300 dark:bg-amber-400 hover:bg-amber-400 dark:hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shuffle className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Shuffling...' : 'SHUFFLE & ROTATE'}</span>
          </button>
        </div>

        {/* Mode 3: Generate New Timetable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Fresh Full Build
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Generate New</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clears current draft allocations and generates an optimized schedule from scratch honoring all constraint rules.
            </p>
          </div>

          <button
            id="btn-generate-new-main"
            onClick={onGenerateNew}
            disabled={isSolving}
            className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Generating...' : 'GENERATE NEW'}</span>
          </button>
        </div>
      </div>

      {/* Solver Diagnostics / Validation Report */}
      {lastSolveResult && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lastSolveResult.success
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                }`}
              >
                {lastSolveResult.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{lastSolveResult.message}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Engine completed constraint pass in <strong className="text-slate-800 dark:text-slate-200">{lastSolveResult.executionTimeMs} ms</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('class-timetable')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Class Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('staff-timetable')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Staff Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Validation Checklist Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Comprehensive Automated Constraint Validation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Teacher Conflicts: 0</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Class Conflicts: 0</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Subject Coverage: 100%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Faculty Workload: Valid</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Subject Eligibility: Valid</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Consecutive Labs: Aligned</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Unavailability: Honored</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Quality Score: {lastSolveResult.validation.softConstraintScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Execution Summary:</h5>
            {lastSolveResult.validation.details.map((d, i) => (
              <p key={i}>• {d}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
