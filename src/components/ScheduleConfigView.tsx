import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Save,
  Plus,
  Trash2,
  Coffee,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BreakConfig, DayOfWeek, ScheduleConfig } from '../types';

interface ScheduleConfigViewProps {
  scheduleConfig: ScheduleConfig;
  onSaveScheduleConfig: (config: ScheduleConfig) => void;
}

const ALL_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ScheduleConfigView: React.FC<ScheduleConfigViewProps> = ({
  scheduleConfig,
  onSaveScheduleConfig,
}) => {
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>(scheduleConfig.workingDays);
  const [periodsPerDay, setPeriodsPerDay] = useState<number | string>(scheduleConfig.periodsPerDay);
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number | string>(
    scheduleConfig.periodDurationMinutes
  );
  const [startTime, setStartTime] = useState<string>(scheduleConfig.startTime);
  const [breaks, setBreaks] = useState<{ afterPeriod: number; label: string; durationMinutes: number | string }[]>(
    scheduleConfig.breaks || []
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applyPreset5Days9Periods = () => {
    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setPeriodsPerDay(9);
    setPeriodDurationMinutes(45);
    setStartTime('09:00');
    setBreaks([
      { afterPeriod: 3, label: 'Morning Tea Break', durationMinutes: 15 },
      { afterPeriod: 5, label: 'Lunch Break', durationMinutes: 45 },
      { afterPeriod: 7, label: 'Afternoon Break', durationMinutes: 15 },
    ]);
  };

  const applyPreset5Days8Periods = () => {
    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setPeriodsPerDay(8);
    setPeriodDurationMinutes(50);
    setStartTime('09:00');
    setBreaks([
      { afterPeriod: 2, label: 'Morning Tea Break', durationMinutes: 15 },
      { afterPeriod: 4, label: 'Lunch Break', durationMinutes: 45 },
      { afterPeriod: 6, label: 'Short Break', durationMinutes: 10 },
    ]);
  };

  const applyPreset6Days7Periods = () => {
    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    setPeriodsPerDay(7);
    setPeriodDurationMinutes(50);
    setStartTime('09:00');
    setBreaks([
      { afterPeriod: 2, label: 'Morning Tea Break', durationMinutes: 15 },
      { afterPeriod: 4, label: 'Lunch Break', durationMinutes: 45 },
    ]);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (workingDays.includes(day)) {
      if (workingDays.length <= 1) return; // Must have at least 1 working day
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const addBreak = () => {
    const activePeriods = periodsPerDay === '' ? 9 : Number(periodsPerDay) || 9;
    setBreaks([
      ...breaks,
      {
        afterPeriod: Math.min(activePeriods - 1, 4),
        label: 'Break Interval',
        durationMinutes: 15,
      },
    ]);
  };

  const updateBreak = (
    index: number,
    updated: Partial<{ afterPeriod: number; label: string; durationMinutes: number | string }>
  ) => {
    setBreaks(breaks.map((b, i) => (i === index ? { ...b, ...updated } : b)));
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const finalPeriods = periodsPerDay === '' ? 9 : Math.max(1, Math.min(10, Number(periodsPerDay) || 9));
    const finalDuration =
      periodDurationMinutes === '' ? 45 : Math.max(15, Number(periodDurationMinutes) || 45);
    const newConfig: ScheduleConfig = {
      workingDays,
      periodsPerDay: finalPeriods,
      periodDurationMinutes: finalDuration,
      startTime: startTime || '09:00',
      breaks: breaks.map((b) => ({
        afterPeriod: Number(b.afterPeriod) || 2,
        label: b.label || 'Break',
        durationMinutes: b.durationMinutes === '' ? 15 : Math.max(5, Number(b.durationMinutes) || 15),
      })),
    };
    onSaveScheduleConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Helper to compute period time strings
  const getPeriodTimes = () => {
    const times: { period: number; start: string; end: string; breakAfter?: string }[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    let currentTotalMinutes = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 0 : startM);
    const activePeriods = periodsPerDay === '' ? 9 : Number(periodsPerDay) || 9;
    const activeDuration = periodDurationMinutes === '' ? 45 : Number(periodDurationMinutes) || 45;

    for (let p = 1; p <= activePeriods; p++) {
      const startStr = `${String(Math.floor(currentTotalMinutes / 60)).padStart(2, '0')}:${String(
        currentTotalMinutes % 60
      ).padStart(2, '0')}`;
      currentTotalMinutes += activeDuration;
      const endStr = `${String(Math.floor(currentTotalMinutes / 60)).padStart(2, '0')}:${String(
        currentTotalMinutes % 60
      ).padStart(2, '0')}`;

      const matchedBreak = breaks.find((b) => b.afterPeriod === p);
      if (matchedBreak) {
        const breakDur = matchedBreak.durationMinutes === '' ? 15 : Number(matchedBreak.durationMinutes) || 15;
        currentTotalMinutes += breakDur;
      }

      times.push({
        period: p,
        start: startStr,
        end: endStr,
        breakAfter: matchedBreak ? `${matchedBreak.label} (${matchedBreak.durationMinutes}m)` : undefined,
      });
    }

    return times;
  };

  const periodTimeline = getPeriodTimes();
  const effectivePeriodsPerDay = periodsPerDay === '' ? 9 : Number(periodsPerDay) || 9;
  const totalWeeklySlots = workingDays.length * effectivePeriodsPerDay;

  return (
    <div id="schedule-config-view" className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Working Days & Schedule Configuration</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure working days (Monday-Saturday), daily periods, start times, and college breaks.
          </p>
        </div>

        <button
          id="btn-save-schedule-config"
          onClick={handleSave}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Schedule Settings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Schedule configuration successfully saved and applied to timetable engine!</span>
        </div>
      )}

      {/* Quick Setup Presets */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">Quick Schedule Presets</span>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300">Apply standard institution working calendars with one click:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyPreset5Days9Periods}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>⭐ 5 Days (Mon-Fri) & 9 Periods</span>
          </button>
          <button
            type="button"
            onClick={applyPreset5Days8Periods}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <span>5 Days (Mon-Fri) & 8 Periods</span>
          </button>
          <button
            type="button"
            onClick={applyPreset6Days7Periods}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <span>6 Days (Mon-Sat) & 7 Periods</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Section 1: Working Days Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Active Working Days ({workingDays.length} Selected)
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {workingDays.length === 5 && !workingDays.includes('Saturday') && !workingDays.includes('Sunday')
                ? '✅ 5-Day Academic Week (Mon - Fri)'
                : `${workingDays.join(', ')}`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_DAYS.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{day.slice(0, 3)}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{day}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Period & Duration Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Periods Per Day (1 to 10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={periodsPerDay}
              onChange={(e) => setPeriodsPerDay(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-slate-900 dark:text-slate-100"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              Configured: {effectivePeriodsPerDay} periods per day ({effectivePeriodsPerDay * workingDays.length} weekly slots)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Period Duration (Minutes)
            </label>
            <input
              type="number"
              min={30}
              max={120}
              value={periodDurationMinutes}
              onChange={(e) => setPeriodDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              Standard period: 45-50 minutes
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              College Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              First bell start time (e.g. 09:00)
            </span>
          </div>
        </div>

        {/* Section 3: Break Periods Configuration */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Break Intervals (Tea / Lunch)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Breaks automatically prevent consecutive lab blocks from spanning across meal times.
              </p>
            </div>
            <button
              type="button"
              onClick={addBreak}
              className="px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Break</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {breaks.map((b, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Break #{idx + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Label:</span>
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => updateBreak(idx, { label: e.target.value })}
                    className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">After Period:</span>
                  <select
                    value={b.afterPeriod}
                    onChange={(e) => updateBreak(idx, { afterPeriod: parseInt(e.target.value) || 2 })}
                    className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {Array.from({ length: Math.max(1, effectivePeriodsPerDay - 1) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Period {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={b.durationMinutes}
                    onChange={(e) => updateBreak(idx, { durationMinutes: e.target.value })}
                    className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-slate-500 dark:text-slate-400">mins</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeBreak(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-auto cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Schedule Timeline Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Calculated Daily Timetable Schedule Preview</span>
          </h3>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Total Weekly Capacity: {totalWeeklySlots} periods/class
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2.5">Period</th>
                <th className="p-2.5">Start Time</th>
                <th className="p-2.5">End Time</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Intermission / Break</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {periodTimeline.map((item) => (
                <tr key={item.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">Period {item.period}</td>
                  <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{item.start}</td>
                  <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{item.end}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{periodDurationMinutes} mins</td>
                  <td className="p-2.5">
                    {item.breakAfter ? (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[11px] font-semibold">
                        ☕ {item.breakAfter}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
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
