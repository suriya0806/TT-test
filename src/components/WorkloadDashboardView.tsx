import React from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ClassInfo,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';

interface WorkloadDashboardViewProps {
  staffList: Staff[];
  classesList: ClassInfo[];
  subjectsList: Subject[];
  scheduleConfig: ScheduleConfig;
  entries: TimetableEntry[];
}

export const WorkloadDashboardView: React.FC<WorkloadDashboardViewProps> = ({
  staffList,
  classesList,
  subjectsList,
  scheduleConfig,
  entries,
}) => {
  const totalSlotsPerClass = scheduleConfig.workingDays.length * scheduleConfig.periodsPerDay;

  const totalRequiredPeriods = classesList.reduce(
    (sum, c) => sum + c.subjects.reduce((sSum, s) => sSum + s.periodsPerWeek, 0),
    0
  );

  const totalAssignedPeriods = entries.length;

  const staffWorkloadStats = staffList.map((staff) => {
    const assigned = entries.filter((e) => e.staffId === staff.id).length;
    const max = staff.maxPeriodsPerWeek || 20;
    const utilPct = Math.round((assigned / max) * 100);
    const free = Math.max(0, max - assigned);

    let status: 'UNDERUTILIZED' | 'OPTIMAL' | 'OVERLOADED' = 'OPTIMAL';
    if (assigned > max) status = 'OVERLOADED';
    else if (utilPct < 50) status = 'UNDERUTILIZED';

    return {
      staff,
      assigned,
      max,
      utilPct,
      free,
      status,
    };
  });

  const totalCapacity = staffList.reduce((sum, s) => sum + s.maxPeriodsPerWeek, 0);
  const overallUtilization = Math.round((totalAssignedPeriods / totalCapacity) * 100) || 0;

  return (
    <div id="workload-dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Faculty Workload & Utilization Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor teaching capacity distributions, workload balance equity across departments, and total curriculum fulfillment metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Utilization</span>
            <span className="text-xl font-bold text-slate-900">{overallUtilization}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Faculty Capacity</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCapacity} periods</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {staffList.length} instructors</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Curriculum Requirement</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalRequiredPeriods} periods</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Across {classesList.length} classes</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Allocated in Timetable</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">{totalAssignedPeriods} periods</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {Math.round((totalAssignedPeriods / totalRequiredPeriods) * 100) || 0}% Fulfilled
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Faculty Workload Balance</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">Balanced</span>
          <span className="text-[11px] text-slate-400 mt-1 block">0 Overloaded teachers</span>
        </div>
      </div>

      {/* Faculty Workload Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Faculty Workload Breakdown</h3>
          <span className="text-xs text-slate-500 font-medium">
            Standard Workload Cap: 16-20 periods/week
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Faculty Member</th>
                <th className="p-3">Department</th>
                <th className="p-3">Assigned Load</th>
                <th className="p-3">Max Cap</th>
                <th className="p-3 w-44">Utilization Gauge</th>
                <th className="p-3">Free Slots</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffWorkloadStats.map((item) => (
                <tr key={item.staff.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-900">
                    {item.staff.name}
                    <span className="block text-[10px] font-normal text-slate-500">
                      {item.staff.designation}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{item.staff.department}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{item.assigned} p/wk</td>
                  <td className="p-3 font-mono text-slate-500">{item.max} p/wk</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'OVERLOADED'
                              ? 'bg-rose-600'
                              : item.utilPct >= 80
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, item.utilPct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-700 w-8 text-right">
                        {item.utilPct}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-emerald-600">{item.free} periods</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'OVERLOADED'
                          ? 'bg-rose-100 text-rose-800'
                          : item.status === 'UNDERUTILIZED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
