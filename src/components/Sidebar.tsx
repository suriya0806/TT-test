import React from 'react';
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Sliders,
  Sparkles,
  AlertTriangle,
  Grid3X3,
  UserCheck,
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  X,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'staff'
  | 'subjects'
  | 'classes'
  | 'schedule'
  | 'existing'
  | 'constraints'
  | 'generate'
  | 'conflicts'
  | 'class-timetable'
  | 'staff-timetable'
  | 'workload';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conflictCount: number;
  isFeasible?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conflictCount,
  isFeasible = true,
  isOpen = false,
  onClose,
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'classes', label: 'Class Groups', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'schedule', label: 'Working Days & Periods', icon: <Clock className="w-4 h-4" /> },
    { id: 'existing', label: 'Master Schedule Draft', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'constraints', label: 'Constraints', icon: <Sliders className="w-4 h-4" /> },
    { id: 'generate', label: 'Generate & Optimize', icon: <Sparkles className="w-4 h-4 text-indigo-600" /> },
    {
      id: 'conflicts',
      label: 'Conflict Center',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: conflictCount > 0 ? conflictCount : undefined,
      badgeColor: conflictCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700',
    },
    { id: 'class-timetable', label: 'Class Timetables', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'staff-timetable', label: 'Staff Timetables', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'workload', label: 'Workload Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Fixed overlay on mobile, static on md+ screens) */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none shadow-xl md:shadow-none transition-transform duration-200 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic text-lg shadow-xs shadow-indigo-200">
              S
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-indigo-950 leading-none">
                SMART <span className="font-light text-indigo-600">TIME</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
                Academic Generator
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            id="btn-close-mobile-sidebar"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {menuItems.slice(0, 5).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Optimizer & Constraints
          </div>
          {menuItems.slice(5, 9).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      item.badgeColor || 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Reports & Views
          </div>
          {menuItems.slice(9).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Current Session Info Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Session</p>
              <ShieldCheck className={`w-3.5 h-3.5 ${isFeasible ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>
            <p className="text-xs font-semibold text-slate-800">Academic Year 2024–25</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {conflictCount === 0 ? 'Optimal & Conflict-free' : `${conflictCount} conflict(s) detected`}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

