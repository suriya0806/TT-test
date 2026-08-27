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
} from 'lucide-react';
import { ClassInfo, ClassSubjectRequirement, ScheduleConfig, Subject } from '../types';

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
  const [formSubjects, setFormSubjects] = useState<{ subjectId: string; periodsPerWeek: number | string }[]>([]);

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
    setFormSubjects(c.subjects.map((s) => ({ subjectId: s.subjectId, periodsPerWeek: s.periodsPerWeek })) || []);
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
      : dept.split(' ')[0] || 'CLASS';
    setFormName(`${deptPrefix} ${year} ${sec}`.trim());
  };

  const toggleSubjectRequirement = (subject: Subject) => {
    const exists = formSubjects.find((s) => s.subjectId === subject.id);
    if (exists) {
      setFormSubjects((prev) => prev.filter((s) => s.subjectId !== subject.id));
    } else {
      setFormSubjects((prev) => [
        ...prev,
        { subjectId: subject.id, periodsPerWeek: subject.requiredPeriodsPerWeek || 4 },
      ]);
    }
  };

  const updateSubjectPeriods = (subjectId: string, periods: number | string) => {
    setFormSubjects((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, periodsPerWeek: periods } : s))
    );
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const classData: ClassInfo = {
      id: formId,
      department: formDept.trim() || 'General',
      year: formYear.trim() || '1',
      section: formSection.trim() || 'A',
      name: formName.trim(),
      room: formRoom.trim() || undefined,
      subjects: formSubjects.map((s) => ({
        subjectId: s.subjectId,
        periodsPerWeek: s.periodsPerWeek === '' ? 1 : Math.max(1, Number(s.periodsPerWeek) || 1),
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
    (sum, s) => sum + (s.periodsPerWeek === '' ? 0 : Number(s.periodsPerWeek) || 0),
    0
  );

  return (
    <div id="classes-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Class & Curriculum Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure student cohorts, departments, sections, and assigned subject weekly loads.
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
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear all classes"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Classes</span>
            </button>
          )}
          <button
            id="btn-add-class"
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Section</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="class-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class name or department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Weekly Slot Budget: <strong className="text-slate-800">{totalSlotsPerClass} slots/week</strong>
        </div>
      </div>

      {/* Empty State or Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {classesList.length === 0 ? 'No Classes or Cohorts Configured' : 'No matching classes found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {classesList.length === 0
              ? 'Add your grade sections, year groups, or degree cohorts. All fields and subject allocations are editable.'
              : 'Try adjusting your search keywords.'}
          </p>
          {classesList.length === 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Class</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const totalReqPeriods = cls.subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);
            const isOverloaded = totalReqPeriods > totalSlotsPerClass;

            return (
              <div
                key={cls.id}
                id={`class-card-${cls.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        {cls.name}
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Year {cls.year} • Sec {cls.section}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{cls.department}</span>
                        {cls.room && <span>• {cls.room}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateClass(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                        title="Duplicate Class"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                        title="Edit Class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Period Budget Summary */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Required Load</span>
                      <p className="font-bold text-slate-900">{totalReqPeriods} periods / week</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Free Slots</span>
                      <p className="font-semibold text-emerald-600">
                        {Math.max(0, totalSlotsPerClass - totalReqPeriods)} free slots
                      </p>
                    </div>
                  </div>

                  {isOverloaded && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Demand exceeds weekly total slots ({totalSlotsPerClass})!</span>
                    </div>
                  )}

                  {/* Subjects Roster */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Subject Requirements ({cls.subjects.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {cls.subjects.map((req) => {
                        const subject = subjectsList.find((s) => s.id === req.subjectId);
                        return (
                          <div
                            key={req.subjectId}
                            className="flex items-center justify-between text-xs p-2 bg-slate-50/70 rounded border border-slate-200"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 font-mono text-[11px]">
                                {subject?.code || req.subjectId}
                              </span>
                              <span className="text-slate-600 truncate max-w-[140px]">
                                {subject?.name || req.subjectId}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[11px] border border-indigo-100">
                              {req.periodsPerWeek} p/wk
                            </span>
                          </div>
                        );
                      })}
                      {cls.subjects.length === 0 && (
                        <p className="text-xs text-amber-600 italic py-1">No subjects assigned yet.</p>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                {editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Class Section'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => {
                      setFormDept(e.target.value);
                      updateAutoName(e.target.value, formYear, formSection);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <select
                    value={formYear}
                    onChange={(e) => {
                      setFormYear(e.target.value);
                      updateAutoName(formDept, e.target.value, formSection);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="I">Year I (1st Year)</option>
                    <option value="II">Year II (2nd Year)</option>
                    <option value="III">Year III (3rd Year)</option>
                    <option value="IV">Year IV (4th Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={formSection}
                    onChange={(e) => {
                      setFormSection(e.target.value);
                      updateAutoName(formDept, formYear, e.target.value);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Display Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CSE III A"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Classroom</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. Room 301"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Subject Curriculum Configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Subject Requirements & Weekly Periods
                  </label>
                  <div className="text-xs font-medium">
                    Total: <span className="font-bold text-indigo-700">{formTotalPeriods}</span> / {totalSlotsPerClass} periods
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                  {subjectsList.map((subject) => {
                    const assigned = formSubjects.find((s) => s.subjectId === subject.id);
                    const isSelected = !!assigned;

                    return (
                      <div
                        key={subject.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-white border-indigo-300 shadow-2xs'
                            : 'bg-slate-100/70 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubjectRequirement(subject)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div>
                            <span className="font-bold text-slate-800 font-mono text-[11px] mr-1.5">
                              {subject.code}
                            </span>
                            <span className="font-medium text-slate-800">{subject.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-semibold">
                              ({subject.type})
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">Periods/wk:</span>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={assigned.periodsPerWeek}
                              onChange={(e) =>
                                updateSubjectPeriods(subject.id, e.target.value)
                              }
                              className="w-16 px-2 py-1 text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
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
