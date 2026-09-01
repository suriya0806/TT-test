import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  Layers,
  X,
  Check,
  Building,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ClassInfo, ClassSubjectRequirement, ScheduleConfig, Subject } from '../types';
import { getResolvedFixedSchedule, isNaanMudhalvanSubject } from '../utils/naanMudhalvanHelper';

interface ClassViewProps {
  classesList: ClassInfo[];
  subjectsList: Subject[];
  scheduleConfig: ScheduleConfig;
  onAddClass: (newClass: ClassInfo) => void;
  onUpdateClass: (updatedClass: ClassInfo) => void;
  onDeleteClass: (classId: string) => void;
  onClearAllClasses?: () => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  classesList,
  subjectsList,
  scheduleConfig,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onClearAllClasses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formYear, setFormYear] = useState('III');
  const [formSection, setFormSection] = useState('A');
  const [formName, setFormName] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formSubjects, setFormSubjects] = useState<ClassSubjectRequirement[]>([]);

  const totalSlotsPerClass = scheduleConfig.workingDays.length * scheduleConfig.periodsPerDay;

  const filteredClasses = classesList.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingClass(null);
    setFormId(`class-${Date.now().toString(36).substr(2, 4)}`);
    setFormDept('');
    setFormYear('III');
    setFormSection('A');
    setFormName('');
    setFormRoom('');
    setFormSubjects([]);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassInfo) => {
    setEditingClass(c);
    setFormId(c.id);
    setFormDept(c.department);
    setFormYear(c.year.toString());
    setFormSection(c.section);
    setFormName(c.name);
    setFormRoom(c.room || '');
    setFormSubjects(
      c.subjects.map((s) => ({
        subjectId: s.subjectId,
        periodsPerWeek: s.periodsPerWeek,
        preferredStaffId: s.preferredStaffId,
        fixedSchedule: s.fixedSchedule,
      })) || []
    );
    setIsModalOpen(true);
  };

  const handleDuplicateClass = (c: ClassInfo) => {
    const duplicated: ClassInfo = {
      ...c,
      id: `class-${Date.now().toString(36).slice(-4)}`,
      name: `${c.name} (Copy)`,
      section: `${c.section}-Copy`,
    };
    onAddClass(duplicated);
  };

  const updateAutoName = (dept: string, year: string, sec: string) => {
    if (!dept && !year && !sec) return;
    if (formName && !formName.includes(year) && !formName.includes(sec)) return;
    const deptPrefix = dept.includes('Computer')
      ? 'CSE'
      : dept.includes('Information')
      ? 'IT'
      : dept.includes('Electrical')
      ? 'ECE'
      : dept.includes('Mechanical')
      ? 'MECH'
      : dept.includes('Civil')
      ? 'CIVIL'
      : dept.slice(0, 4).toUpperCase();
    setFormName(`${deptPrefix} ${year} ${sec}`.trim());
  };

  const toggleSubjectRequirement = (sub: Subject) => {
    const isNM = isNaanMudhalvanSubject(sub);
    const existing = formSubjects.find((s) => s.subjectId === sub.id);
    if (existing) {
      setFormSubjects(formSubjects.filter((s) => s.subjectId !== sub.id));
    } else {
      setFormSubjects([
        ...formSubjects,
        {
          subjectId: sub.id,
          periodsPerWeek: isNM ? (sub.consecutivePeriodsRequired || 4) : sub.requiredPeriodsPerWeek || 4,
          fixedSchedule: sub.fixedSchedule,
        },
      ]);
    }
  };

  const updateSubjectPeriods = (subjectId: string, periods: number | string) => {
    const parsed = periods === '' ? 1 : Math.max(1, Number(periods) || 1);
    setFormSubjects(
      formSubjects.map((s) => (s.subjectId === subjectId ? { ...s, periodsPerWeek: parsed } : s))
    );
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDept.trim()) return;

    const classData: ClassInfo = {
      id: formId,
      department: formDept.trim(),
      year: formYear,
      section: formSection.trim().toUpperCase(),
      name: formName.trim(),
      room: formRoom.trim() || undefined,
      subjects: formSubjects.map((s) => ({
        subjectId: s.subjectId,
        periodsPerWeek: Math.max(1, Number(s.periodsPerWeek) || 1),
        preferredStaffId: s.preferredStaffId,
        fixedSchedule: s.fixedSchedule,
      })),
    };

    if (editingClass) {
      onUpdateClass(classData);
    } else {
      onAddClass(classData);
    }
    setIsModalOpen(false);
  };

  const formTotalPeriods = formSubjects.reduce(
    (sum, s) => sum + (Number(s.periodsPerWeek) || 0),
    0
  );

  return (
    <div id="classes-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Classes & Curriculums</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure student cohorts, year/section divisions, homerooms, and weekly subject requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllClasses && classesList.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all classes from the roster?')) {
                  onClearAllClasses();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear all classes"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Clear All Classes</span>
            </button>
          )}
          <button
            id="btn-add-class"
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            id="class-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class name or department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total Classes: <span className="font-bold text-slate-900 dark:text-slate-100">{classesList.length}</span>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No classes configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm ? 'No classes matched your filter.' : 'Add your first class section to begin scheduling.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const totalReqPeriods = cls.subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);
            const isOverloaded = totalReqPeriods > totalSlotsPerClass;

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {cls.name}
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          Year {cls.year} • Sec {cls.section}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{cls.department}</span>
                        {cls.room && <span>• {cls.room}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateClass(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Duplicate Class"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Edit Class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Period Budget Summary */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Total Required Load</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{totalReqPeriods} periods / week</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Free Slots</span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.max(0, totalSlotsPerClass - totalReqPeriods)} free slots
                      </p>
                    </div>
                  </div>

                  {isOverloaded && (
                    <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Demand exceeds weekly total slots ({totalSlotsPerClass})!</span>
                    </div>
                  )}

                  {/* Subjects Roster */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Subject Requirements ({cls.subjects.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {cls.subjects.map((req) => {
                        const subject = subjectsList.find((s) => s.id === req.subjectId);
                        const isNM = isNaanMudhalvanSubject(subject);
                        const fixedSched = subject ? getResolvedFixedSchedule(subject, req, scheduleConfig) : null;

                        return (
                          <div
                            key={req.subjectId}
                            className={`flex flex-col gap-1 text-xs p-2 rounded border ${
                              isNM
                                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70'
                                : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                  {subject?.code || req.subjectId}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                  {subject?.name || req.subjectId}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 font-bold rounded text-[11px] border ${
                                  isNM
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800'
                                }`}
                              >
                                {req.periodsPerWeek} p/wk
                              </span>
                            </div>

                            {isNM && fixedSched && (
                              <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300/90 font-medium">
                                <span className="flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                                  Fixed: {fixedSched.day} (P{fixedSched.startPeriod} to P{fixedSched.startPeriod + (fixedSched.consecutivePeriods || 4) - 1})
                                </span>
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                                  Locked from Shuffle
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {cls.subjects.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 italic py-1">No subjects assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Class Section'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => {
                      setFormDept(e.target.value);
                      updateAutoName(e.target.value, formYear, formSection);
                    }}
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Year / Cohort</label>
                    <select
                      value={formYear}
                      onChange={(e) => {
                        setFormYear(e.target.value);
                        updateAutoName(formDept, e.target.value, formSection);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="I">I Year</option>
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                    <input
                      type="text"
                      required
                      value={formSection}
                      onChange={(e) => {
                        setFormSection(e.target.value);
                        updateAutoName(formDept, formYear, e.target.value);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class Display Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CSE III A"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Classroom</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. Room 301 or LH-101"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Subject Curriculum Configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject Requirements & Weekly Periods
                  </label>
                  <div className="text-xs font-medium dark:text-slate-300">
                    Total: <span className="font-bold text-indigo-700 dark:text-indigo-400">{formTotalPeriods}</span> / {totalSlotsPerClass} periods
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  {subjectsList.map((subject) => {
                    const assigned = formSubjects.find((s) => s.subjectId === subject.id);
                    const isSelected = !!assigned;
                    const isNM = isNaanMudhalvanSubject(subject);
                    const fixedSched = getResolvedFixedSchedule(subject, assigned, scheduleConfig);

                    return (
                      <div
                        key={subject.id}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? isNM
                              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-600 shadow-2xs'
                            : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubjectRequirement(subject)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                {subject.code}
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{subject.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                                ({subject.type})
                              </span>
                            </div>
                            {isNM && fixedSched && (
                              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                User Fixed Slot: {fixedSched.day} (P{fixedSched.startPeriod}-P{fixedSched.startPeriod + (fixedSched.consecutivePeriods || 4) - 1}) • Locked from Shuffle
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Periods/wk:</span>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={assigned.periodsPerWeek}
                              onChange={(e) =>
                                updateSubjectPeriods(subject.id, e.target.value)
                              }
                              className="w-16 px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
