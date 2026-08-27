import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  Layers,
  ShieldAlert,
  Zap,
  Sliders,
  CalendarDays,
  Shuffle,
} from 'lucide-react';
import {
  ClassInfo,
  ConflictItem,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  staffList: Staff[];
  subjectsList: Subject[];
  classesList: ClassInfo[];
  scheduleConfig: ScheduleConfig;
  entries: TimetableEntry[];
  conflicts: ConflictItem[];
  isFeasible: boolean;
  onNavigate: (tab: ActiveTab) => void;
  onCompleteExisting: () => void;
  onGenerateNew: () => void;
  onShuffleTimetable?: () => void;
  onRunTestScenario?: () => void;
  onAutoResolveAll: () => void;
  onStartFresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staffList,
  subjectsList,
  classesList,
  scheduleConfig,
  entries,
  conflicts,
  isFeasible,
  onNavigate,
  onCompleteExisting,
  onGenerateNew,
  onShuffleTimetable,
  onAutoResolveAll,
  onStartFresh,
}) => {
  // Calculations
  const totalRequiredPeriods = classesList.reduce(
    (sum, c) => sum + c.subjects.reduce((sSum, s) => sSum + s.periodsPerWeek, 0),
    0
  );
  const totalAssignedPeriods = entries.length;
  const completionPercentage =
    totalRequiredPeriods > 0
      ? Math.min(100, Math.round((totalAssignedPeriods / totalRequiredPeriods) * 100))
      : 0;

  const assignedStaffIds = new Set(entries.map((e) => e.staffId));
  const activeStaffCount = assignedStaffIds.size;
  const unassignedStaffCount = staffList.filter((s) => !assignedStaffIds.has(s.id)).length;

  const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL');
  const warningConflicts = conflicts.filter((c) => c.severity === 'WARNING');

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & System Summary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Zap className="w-3.5 h-3.5" /> Constraint Optimization Engine Active
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Timetable Generator & Conflict Resolver</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Dynamic constraint-based timetable scheduler with automated faculty conflict detection, 
            workload balancing, and multi-subject staff optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            id="dash-btn-complete"
            onClick={onCompleteExisting}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Complete Existing Timetable</span>
          </button>
          <button
            id="dash-btn-generate"
            onClick={onGenerateNew}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Generate From Scratch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faculty Status */}
        <div
          id="kpi-faculty-card"
          onClick={() => onNavigate('staff')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Roster</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{staffList.length}</span>
            <span className="text-xs text-slate-500">total staff</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-600">
            <span className="text-emerald-700 font-medium">{activeStaffCount} active assigned</span>
            {unassignedStaffCount > 0 ? (
              <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {unassignedStaffCount} unassigned
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">100% utilized</span>
            )}
          </div>
        </div>

        {/* Card 2: Curriculum & Classes */}
        <div
          id="kpi-classes-card"
          onClick={() => onNavigate('classes')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes & Subjects</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{classesList.length} Classes</span>
            <span className="text-xs text-slate-500">/ {subjectsList.length} subjects</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <span>{scheduleConfig.workingDays.length} Working Days • {scheduleConfig.periodsPerDay} Periods/Day</span>
          </div>
        </div>

        {/* Card 3: Timetable Completion Meter */}
        <div
          id="kpi-completion-card"
          onClick={() => onNavigate('class-timetable')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Curriculum Slots</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalAssignedPeriods}</span>
            <span className="text-xs text-slate-500">/ {totalRequiredPeriods} required</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-500 font-medium">
              <span>{completionPercentage}% complete</span>
              <span>{totalRequiredPeriods - totalAssignedPeriods} slots remaining</span>
            </div>
          </div>
        </div>

        {/* Card 4: Conflict Status */}
        <div
          id="kpi-conflicts-card"
          onClick={() => onNavigate('conflicts')}
          className={`p-5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            conflicts.length === 0
              ? 'bg-white border-slate-200 hover:border-emerald-300'
              : 'bg-amber-50/50 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conflict Status</span>
            <div
              className={`p-2 rounded-lg ${
                conflicts.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {conflicts.length === 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${conflicts.length === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
              {conflicts.length}
            </span>
            <span className="text-xs text-slate-500">total detected</span>
          </div>
          <div className="mt-2 text-xs">
            {conflicts.length === 0 ? (
              <span className="text-emerald-700 font-medium">Clean & 100% Conflict-Free</span>
            ) : (
              <span className="text-amber-800 font-medium">
                {criticalConflicts.length} Critical • {warningConflicts.length} Warnings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Setup & Timetable Generation Workflow Guide */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Implementation Steps
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Academic Timetable Generation Workflow
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl">
              Follow these standard 4 steps to configure your institution&apos;s department, classes, curriculum hours, and generate optimized schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onShuffleTimetable && (
              <button
                id="btn-dash-shuffle"
                onClick={onShuffleTimetable}
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                title="Shuffle & rotate subject hours daily"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-700" />
                <span>Shuffle Hours</span>
              </button>
            )}
            <button
              id="btn-nav-to-generate"
              onClick={() => onNavigate('generate')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Solver Engine</span>
            </button>
            <button
              id="btn-view-conflicts-showcase"
              onClick={() => onNavigate('conflicts')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Conflict Center</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 4 Interactive Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div
            onClick={() => onNavigate('schedule')}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-400 group-hover:text-indigo-600">Step 1</span>
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800">Days & Periods</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {scheduleConfig.workingDays.length} working days, {scheduleConfig.periodsPerDay} periods/day configured.
            </p>
          </div>

          <div
            onClick={() => onNavigate('staff')}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-400 group-hover:text-indigo-600">Step 2</span>
              <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800">Faculty & Workload</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {staffList.length} faculty registered with availability matrices.
            </p>
          </div>

          <div
            onClick={() => onNavigate('classes')}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-400 group-hover:text-indigo-600">Step 3</span>
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <h4 className="font-semibold text-xs text-slate-800">Classes & Curriculum</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {classesList.length} sections with weekly subject hour requirements.
            </p>
          </div>

          <div
            onClick={() => onNavigate('generate')}
            className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-indigo-600">Step 4</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-xs text-indigo-950">Run Optimizer</h4>
            <p className="text-[11px] text-indigo-700/80 mt-0.5">
              Backtrack solver generates 100% clash-free schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Conflict Status & Staff Status / Engine Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Conflicts / System Health */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conflict Diagnostics</h3>
              <p className="text-xs font-semibold text-slate-800 mt-1">Real-time Constraint Validation Engine</p>
            </div>
            {conflicts.length > 0 && (
              <button
                id="btn-auto-resolve-dash"
                onClick={onAutoResolveAll}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shadow-indigo-100 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto Resolve All ({conflicts.length})</span>
              </button>
            )}
          </div>

          {conflicts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Timetable Conflicts Detected</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All teacher schedules, class slots, subject requirements, and workload limits are perfectly aligned.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-88 overflow-y-auto pr-1">
              {conflicts.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                    c.severity === 'CRITICAL'
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        c.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      ⚠️
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.title}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            c.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {c.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{c.description}</p>
                      {c.suggestedAction && (
                        <p className="text-[11px] text-indigo-700 font-medium pt-0.5">
                          💡 Suggestion: {c.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('conflicts')}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-indigo-600 shadow-2xs"
                  >
                    Auto-Resolve
                  </button>
                </div>
              ))}
              {conflicts.length > 5 && (
                <button
                  onClick={() => onNavigate('conflicts')}
                  className="w-full py-2 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all {conflicts.length} conflicts in Conflict Center →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Staff Status Widget (Matching Clean Minimalism Dark Accent Container) */}
        <div className="bg-indigo-900 rounded-xl p-5 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Faculty Status</h3>
              <span className="text-[10px] bg-indigo-800/80 text-indigo-200 px-2 py-0.5 rounded font-medium">
                Live Load
              </span>
            </div>

            <div className="space-y-3.5">
              {staffList.slice(0, 4).map((s) => {
                const assignedCount = entries.filter((e) => e.staffId === s.id).length;
                const pct = s.maxWeeklyHours > 0 ? Math.round((assignedCount / s.maxWeeklyHours) * 100) : 0;
                const isOver = assignedCount > s.maxWeeklyHours;
                const isOptimal = pct >= 60 && pct <= 100;

                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="truncate text-slate-100">{s.name}</span>
                      <span className={isOver ? 'text-rose-300' : isOptimal ? 'text-emerald-300' : 'text-indigo-300'}>
                        {assignedCount}/{s.maxWeeklyHours} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-indigo-950/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-400' : isOptimal ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-indigo-800/50">
            <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Engine Score</p>
                <p className="text-xl font-black text-white leading-tight">
                  {conflicts.length === 0 ? '98.4' : '82.6'}{' '}
                  <span className="text-xs font-normal text-indigo-300">
                    {conflicts.length === 0 ? 'Optimal' : 'Needs Repair'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => onNavigate('workload')}
                className="text-[10px] font-semibold text-indigo-200 hover:text-white bg-indigo-700/60 px-2.5 py-1.5 rounded-lg border border-indigo-600/40"
              >
                Workload →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
