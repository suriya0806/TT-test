import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Menu,
  Shuffle,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab?: ActiveTab;
  onGenerateNew: () => void;
  onCompleteExisting: () => void;
  onShuffleTimetable?: () => void;
  onStartFresh?: () => void;
  onOpenImportExport: () => void;
  isSolving: boolean;
  conflictCount: number;
  totalAssigned?: number;
  totalRequired?: number;
  staffCount?: number;
  subjectCount?: number;
  classCount?: number;
  workingDaysCount?: number;
  periodsCount?: number;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'dashboard',
  onGenerateNew,
  onCompleteExisting,
  onShuffleTimetable,
  onStartFresh,
  onOpenImportExport,
  isSolving,
  conflictCount,
  staffCount = 0,
  subjectCount = 0,
  classCount = 0,
  workingDaysCount = 6,
  periodsCount = 7,
  onToggleMobileMenu,
}) => {
  const tabTitles: Record<ActiveTab, { title: string; badge: string }> = {
    dashboard: { title: 'Executive Timetable Overview', badge: 'Overview' },
    staff: { title: 'Faculty & Staff Directory', badge: `${staffCount} Faculty` },
    subjects: { title: 'Curriculum & Subject Catalog', badge: `${subjectCount} Courses` },
    classes: { title: 'Class Groups & Sections', badge: `${classCount} Classes` },
    schedule: { title: 'Working Days & Period Configuration', badge: `${workingDaysCount} Days • ${periodsCount} Periods` },
    existing: { title: 'Master Schedule Editor', badge: 'Slot Matrix' },
    constraints: { title: 'Optimization & Constraint Rules', badge: 'Hard / Soft' },
    generate: { title: 'Engine Solver & Optimization', badge: 'Constraint Solver' },
    conflicts: { title: 'Conflict Diagnostics & Auto-Resolver', badge: `${conflictCount} Issues` },
    'class-timetable': { title: 'Class Timetables & Schedules', badge: 'Class View' },
    'staff-timetable': { title: 'Faculty Timetables & Rosters', badge: 'Faculty View' },
    workload: { title: 'Workload Distribution & Equity', badge: 'Metrics' },
  };

  const currentMeta = tabTitles[activeTab] || { title: 'College Timetable Generator', badge: 'Academic' };

  return (
    <header id="app-header" className="min-h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs shrink-0 select-none">
      {/* Left: Hamburger menu (mobile) + App Title & Status Badges */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-menu-toggle"
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center transition-colors cursor-pointer"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="font-semibold text-sm sm:text-base text-slate-900 tracking-tight">
            {currentMeta.title}
          </h2>
          <span className="hidden xs:inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
            {currentMeta.badge}
          </span>
          {conflictCount === 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[11px] font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> 0 Conflicts
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200/60 rounded text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" /> {conflictCount} Conflicts
            </span>
          )}
        </div>
      </div>

      {/* Right: Action Buttons in Clean Minimalism */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          id="btn-import-export"
          onClick={onOpenImportExport}
          className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Import / Export CSV, Excel & Full Backup"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Data I/O</span>
          <span className="sm:hidden">I/O</span>
        </button>

        {onStartFresh && (
          <button
            id="btn-start-fresh"
            onClick={onStartFresh}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg bg-white hover:bg-rose-50 transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Start fresh with clean data or clear current timetable"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Start Fresh</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}

        <button
          id="btn-complete-existing-header"
          onClick={onCompleteExisting}
          disabled={isSolving}
          className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs shadow-indigo-100 flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Fill missing timetable slots without overwriting valid ones"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Complete Missing</span>
          <span className="sm:hidden">Complete</span>
        </button>

        {onShuffleTimetable && (
          <button
            id="btn-shuffle-timetable-header"
            onClick={onShuffleTimetable}
            disabled={isSolving}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-amber-800 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Shuffle & rotate period hours daily so no subject repeats in same hour every day"
          >
            <Shuffle className={`w-3.5 h-3.5 text-amber-700 ${isSolving ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Shuffle Hours</span>
            <span className="sm:hidden">Shuffle</span>
          </button>
        )}

        <button
          id="btn-generate-new-header"
          onClick={onGenerateNew}
          disabled={isSolving}
          className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Regenerate full timetable using constraint solver"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Generate All</span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>
    </header>
  );
};


