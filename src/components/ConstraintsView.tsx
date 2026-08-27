import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ClassInfo,
  ConstraintsConfig,
  DayOfWeek,
  DynamicCustomConstraint,
  HardConstraintsConfig,
  SoftConstraintsConfig,
  Staff,
  Subject,
} from '../types';

interface ConstraintsViewProps {
  constraintsConfig: ConstraintsConfig;
  staffList: Staff[];
  subjectsList: Subject[];
  classesList: ClassInfo[];
  onSaveConstraints: (config: ConstraintsConfig) => void;
}

export const ConstraintsView: React.FC<ConstraintsViewProps> = ({
  constraintsConfig,
  staffList,
  subjectsList,
  classesList,
  onSaveConstraints,
}) => {
  const [hard, setHard] = useState<HardConstraintsConfig>(constraintsConfig.hard);
  const [soft, setSoft] = useState<SoftConstraintsConfig>(constraintsConfig.soft);
  const [dynamic, setDynamic] = useState<DynamicCustomConstraint[]>(
    constraintsConfig.dynamic || []
  );
  const [savedMessage, setSavedMessage] = useState(false);

  // New dynamic constraint form state
  const [dynType, setDynType] = useState<DynamicCustomConstraint['type']>('TEACHER_TIME_WINDOW');
  const [dynStaffId, setDynStaffId] = useState(staffList[0]?.id || '');
  const [dynSubjectId, setDynSubjectId] = useState(subjectsList[0]?.id || '');
  const [dynDay, setDynDay] = useState<DayOfWeek>('Monday');
  const [dynPeriod, setDynPeriod] = useState<number | string>(3);
  const [dynWindow, setDynWindow] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [dynMaxPerDay, setDynMaxPerDay] = useState<number | string>(2);

  const toggleHard = (key: keyof HardConstraintsConfig) => {
    setHard((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSoft = (key: keyof SoftConstraintsConfig) => {
    setSoft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddDynamicConstraint = () => {
    let name = '';
    const params: DynamicCustomConstraint['params'] = {};

    const activePeriod = dynPeriod === '' ? 1 : Math.max(1, Number(dynPeriod) || 1);
    const activeMaxPerDay = dynMaxPerDay === '' ? 2 : Math.max(1, Number(dynMaxPerDay) || 2);

    if (dynType === 'TEACHER_TIME_WINDOW') {
      const staffName = staffList.find((s) => s.id === dynStaffId)?.name || 'Faculty';
      name = `${staffName} available ${dynWindow.toLowerCase()} only`;
      params.staffId = dynStaffId;
      params.timeWindow = dynWindow;
    } else if (dynType === 'TEACHER_UNAVAILABLE_SPECIFIC') {
      const staffName = staffList.find((s) => s.id === dynStaffId)?.name || 'Faculty';
      name = `${staffName} unavailable on ${dynDay} P${activePeriod}`;
      params.staffId = dynStaffId;
      params.day = dynDay;
      params.period = activePeriod;
    } else if (dynType === 'SUBJECT_DAILY_MAX') {
      const subName = subjectsList.find((s) => s.id === dynSubjectId)?.name || 'Subject';
      name = `Max ${activeMaxPerDay} periods/day for ${subName}`;
      params.subjectId = dynSubjectId;
      params.maxPerDay = activeMaxPerDay;
    } else if (dynType === 'NO_SUBJECT_ON_DAY') {
      const subName = subjectsList.find((s) => s.id === dynSubjectId)?.name || 'Subject';
      name = `No ${subName} scheduled on ${dynDay}`;
      params.subjectId = dynSubjectId;
      params.day = dynDay;
    }

    const newConstraint: DynamicCustomConstraint = {
      id: `dyn-${Date.now().toString(36)}`,
      name,
      type: dynType,
      enabled: true,
      params,
    };

    setDynamic([...dynamic, newConstraint]);
  };

  const toggleDynamicConstraint = (id: string) => {
    setDynamic(
      dynamic.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const removeDynamicConstraint = (id: string) => {
    setDynamic(dynamic.filter((d) => d.id !== id));
  };

  const handleSave = () => {
    onSaveConstraints({
      hard,
      soft,
      dynamic,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div id="constraints-view" className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Constraints & Optimization Rules Manager
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hard constraints (mandatory feasibility requirements), soft constraints (quality penalties), and dynamic rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>Save Constraint Configuration</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Constraint configuration saved successfully!</span>
        </div>
      )}

      {/* 1. HARD CONSTRAINTS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Hard Constraints (Strict Non-Negotiable)</h3>
            <p className="text-[11px] text-slate-500">
              Violations produce invalid schedules and trigger instant solver backtracking.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div
            onClick={() => toggleHard('teacherConflict')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.teacherConflict
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.teacherConflict}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Teacher Conflict Check</span>
              <span className="text-[11px] text-slate-600">
                A faculty member cannot be assigned to two classes at the same period.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleHard('classConflict')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.classConflict
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.classConflict}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Class Clash Prevention</span>
              <span className="text-[11px] text-slate-600">
                A class cannot have multiple subjects scheduled at the exact same period.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleHard('teacherEligibility')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.teacherEligibility
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.teacherEligibility}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Subject Eligibility Check</span>
              <span className="text-[11px] text-slate-600">
                Teachers can only be assigned to subjects they are qualified to teach.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleHard('teacherMaxWorkload')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.teacherMaxWorkload
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.teacherMaxWorkload}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Faculty Workload Ceiling</span>
              <span className="text-[11px] text-slate-600">
                Do not exceed configured weekly maximum periods per teacher.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleHard('labConsecutive')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.labConsecutive
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.labConsecutive}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Lab Consecutiveness Constraint</span>
              <span className="text-[11px] text-slate-600">
                Labs requiring 2 or 3 consecutive periods must be scheduled contiguously.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleHard('respectUnavailability')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              hard.respectUnavailability
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={hard.respectUnavailability}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Teacher Unavailability Respect</span>
              <span className="text-[11px] text-slate-600">
                Never assign teachers to periods marked as unavailable.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SOFT CONSTRAINTS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 border-b border-slate-100 pb-3">
          <Sliders className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Soft Constraints (Quality Optimization)</h3>
            <p className="text-[11px] text-slate-500">
              Engine penalizes and minimizes violations to produce balanced, comfortable timetables.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div
            onClick={() => toggleSoft('balanceTeacherWorkload')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.balanceTeacherWorkload
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.balanceTeacherWorkload}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Balance Faculty Workload</span>
              <span className="text-[11px] text-slate-600">
                Distribute teaching load proportionally across available department staff.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleSoft('spreadSubjectsEvenlyAcrossWeek')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.spreadSubjectsEvenlyAcrossWeek
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.spreadSubjectsEvenlyAcrossWeek}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Spread Subjects Evenly</span>
              <span className="text-[11px] text-slate-600">
                Avoid scheduling all periods of a subject on the same day.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleSoft('avoidTooManyConsecutivePeriods')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.avoidTooManyConsecutivePeriods
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.avoidTooManyConsecutivePeriods}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Avoid Faculty Fatigue</span>
              <span className="text-[11px] text-slate-600">
                Limit consecutive continuous teaching periods to {soft.maxConsecutivePeriodsLimit || 3} periods.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleSoft('avoidSameHourDaily')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.avoidSameHourDaily
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.avoidSameHourDaily}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Shuffle & Rotate Subject Hours Daily</span>
              <span className="text-[11px] text-slate-600">
                Prevents the same subject from appearing at the exact same hour/period each day (e.g. shifts morning to afternoon across days).
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleSoft('shufflePeriodsRandomly')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.shufflePeriodsRandomly
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.shufflePeriodsRandomly}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Randomized Slot Shuffling</span>
              <span className="text-[11px] text-slate-600">
                Introduces dynamic tie-breaking jitter to produce lively, diversified timetable layouts upon each generation or shuffle.
              </span>
            </div>
          </div>

          <div
            onClick={() => toggleSoft('minimizeExistingChanges')}
            className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
              soft.minimizeExistingChanges
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={soft.minimizeExistingChanges}
              onChange={() => {}}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-900 block">Preserve Existing Assignments</span>
              <span className="text-[11px] text-slate-600">
                Avoid altering existing valid draft allocations when running completion.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC CUSTOM CONSTRAINTS BUILDER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900">Dynamic Constraint Builder</h3>
          <p className="text-[11px] text-slate-500">
            Define custom conditions (e.g. Teacher available only in morning, Subject max 2 periods/day, specific day restrictions).
          </p>
        </div>

        {/* Dynamic Builder Input Row */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rule Type</label>
            <select
              value={dynType}
              onChange={(e) => setDynType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TEACHER_TIME_WINDOW">Teacher Time Window (Morning / Afternoon)</option>
              <option value="TEACHER_UNAVAILABLE_SPECIFIC">Specific Slot Unavailability</option>
              <option value="SUBJECT_DAILY_MAX">Subject Daily Period Maximum</option>
              <option value="NO_SUBJECT_ON_DAY">No Subject on Specific Day</option>
            </select>
          </div>

          {dynType.startsWith('TEACHER') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Faculty</label>
              <select
                value={dynStaffId}
                onChange={(e) => setDynStaffId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dynType.startsWith('SUBJECT') || dynType === 'NO_SUBJECT_ON_DAY' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Subject</label>
              <select
                value={dynSubjectId}
                onChange={(e) => setDynSubjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {dynType === 'TEACHER_TIME_WINDOW' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Window</label>
              <select
                value={dynWindow}
                onChange={(e) => setDynWindow(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="MORNING">Morning Only (Periods 1 to 4)</option>
                <option value="AFTERNOON">Afternoon Only (Periods 4+)</option>
              </select>
            </div>
          )}

          {(dynType === 'TEACHER_UNAVAILABLE_SPECIFIC' || dynType === 'NO_SUBJECT_ON_DAY') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Day</label>
              <select
                value={dynDay}
                onChange={(e) => setDynDay(e.target.value as DayOfWeek)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dynType === 'TEACHER_UNAVAILABLE_SPECIFIC' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Period</label>
              <input
                type="number"
                min={1}
                max={10}
                value={dynPeriod}
                onChange={(e) => setDynPeriod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          )}

          {dynType === 'SUBJECT_DAILY_MAX' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Periods / Day</label>
              <input
                type="number"
                min={1}
                max={10}
                value={dynMaxPerDay}
                onChange={(e) => setDynMaxPerDay(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddDynamicConstraint}
              className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dynamic Rule</span>
            </button>
          </div>
        </div>

        {/* List of Dynamic Constraints */}
        <div className="space-y-2">
          {dynamic.map((dyn) => (
            <div
              key={dyn.id}
              className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dyn.enabled}
                  onChange={() => toggleDynamicConstraint(dyn.id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className={`font-semibold ${dyn.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {dyn.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeDynamicConstraint(dyn.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
