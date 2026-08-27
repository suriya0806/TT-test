import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle,
  X,
  Check,
  Building,
} from 'lucide-react';
import { DayOfWeek, ScheduleConfig, Staff, Subject, TimeSlot } from '../types';

const DEFAULT_WORKING_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface StaffViewProps {
  staffList: Staff[];
  subjectsList: Subject[];
  scheduleConfig?: ScheduleConfig;
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (staffId: string) => void;
  onClearAllStaff?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  subjectsList,
  scheduleConfig,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onClearAllStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Computer Science & Engineering');
  const [formEmail, setFormEmail] = useState('');
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([]);
  const [formMaxPeriods, setFormMaxPeriods] = useState<number | string>(20);
  const [formUnavailableSlots, setFormUnavailableSlots] = useState<TimeSlot[]>([]);
  const [formPreferredSlots, setFormPreferredSlots] = useState<TimeSlot[]>([]);
  const [formMaxConsecutive, setFormMaxConsecutive] = useState<number | string>(3);
  const [validationError, setValidationError] = useState('');

  // Working days and periods with safe fallbacks
  const workingDays: DayOfWeek[] =
    scheduleConfig?.workingDays && scheduleConfig.workingDays.length > 0
      ? (scheduleConfig.workingDays as DayOfWeek[])
      : DEFAULT_WORKING_DAYS;
  const periodsCount = scheduleConfig?.periodsPerDay || 7;

  // Departments List
  const departments = Array.from(
    new Set([
      'Computer Science & Engineering',
      'Information Technology',
      'Artificial Intelligence & DS',
      'Electronics & Communication',
      'Mechanical Engineering',
      ...staffList.map((s) => s.department),
    ])
  );

  // Filtered Staff
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesSubject =
      subjectFilter === 'ALL' ||
      (s.subjectIds && s.subjectIds.includes(subjectFilter)) ||
      subjectsList.some((sub) => sub.id === subjectFilter && sub.eligibleStaffIds?.includes(s.id));
    return matchesSearch && matchesDept && matchesSubject;
  });

  const openAddModal = () => {
    setEditingStaff(null);
    setFormId(`staff-${Date.now().toString(36).slice(-4)}`);
    setFormName('');
    setFormDept(departments[0] || 'Computer Science & Engineering');
    setFormEmail('');
    setFormSubjectIds([]);
    setFormMaxPeriods(20);
    setFormUnavailableSlots([]);
    setFormPreferredSlots([]);
    setFormMaxConsecutive(3);
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormId(staff.id);
    setFormName(staff.name);
    setFormDept(staff.department);
    setFormEmail(staff.email || '');
    setFormSubjectIds(staff.subjectIds || []);
    setFormMaxPeriods(staff.maxPeriodsPerWeek || 20);
    setFormUnavailableSlots(staff.unavailableSlots || []);
    setFormPreferredSlots(staff.preferredSlots || []);
    setFormMaxConsecutive(staff.maxConsecutivePeriods || 3);
    setValidationError('');
    setIsModalOpen(true);
  };

  const toggleSubject = (subId: string) => {
    setFormSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleSlotStatus = (
    day: DayOfWeek,
    period: number,
    type: 'UNAVAILABLE' | 'PREFERRED'
  ) => {
    if (type === 'UNAVAILABLE') {
      const exists = formUnavailableSlots.some((s) => s.day === day && s.period === period);
      if (exists) {
        setFormUnavailableSlots((prev) =>
          prev.filter((s) => !(s.day === day && s.period === period))
        );
      } else {
        setFormPreferredSlots((prev) =>
          prev.filter((s) => !(s.day === day && s.period === period))
        );
        setFormUnavailableSlots((prev) => [...prev, { day, period }]);
      }
    } else {
      const exists = formPreferredSlots.some((s) => s.day === day && s.period === period);
      if (exists) {
        setFormPreferredSlots((prev) =>
          prev.filter((s) => !(s.day === day && s.period === period))
        );
      } else {
        setFormUnavailableSlots((prev) =>
          prev.filter((s) => !(s.day === day && s.period === period))
        );
        setFormPreferredSlots((prev) => [...prev, { day, period }]);
      }
    }
  };

  const setAllSlotsFree = () => {
    setFormUnavailableSlots([]);
  };

  const setMorningBusy = () => {
    const morningSlots: TimeSlot[] = [];
    workingDays.forEach((day) => {
      for (let p = 1; p <= Math.min(4, periodsCount); p++) {
        morningSlots.push({ day, period: p });
      }
    });
    setFormUnavailableSlots(morningSlots);
  };

  const setAfternoonBusy = () => {
    const afternoonSlots: TimeSlot[] = [];
    workingDays.forEach((day) => {
      for (let p = 5; p <= periodsCount; p++) {
        afternoonSlots.push({ day, period: p });
      }
    });
    setFormUnavailableSlots(afternoonSlots);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setValidationError('Please enter a valid faculty name');
      return;
    }
    if (!formId.trim()) {
      setValidationError('Please enter a valid faculty ID');
      return;
    }

    // Check duplicate ID when adding new
    if (!editingStaff && staffList.some((s) => s.id.toLowerCase() === formId.trim().toLowerCase())) {
      setValidationError(`Faculty ID "${formId}" already exists. Please choose a unique ID.`);
      return;
    }

    const staffData: Staff = {
      id: formId.trim(),
      name: formName.trim(),
      department: formDept.trim() || 'Computer Science & Engineering',
      email: formEmail.trim() || undefined,
      subjectIds: formSubjectIds,
      maxPeriodsPerWeek: Math.max(1, Number(formMaxPeriods) || 20),
      unavailableSlots: formUnavailableSlots,
      preferredSlots: formPreferredSlots,
      maxConsecutivePeriods: Math.max(1, Number(formMaxConsecutive) || 3),
    };

    if (editingStaff) {
      onUpdateStaff(staffData);
    } else {
      onAddStaff(staffData);
    }
    setIsModalOpen(false);
  };

  const handleDuplicateStaff = (staff: Staff) => {
    const duplicated: Staff = {
      ...staff,
      id: `staff-${Date.now().toString(36).slice(-4)}`,
      name: `${staff.name} (Copy)`,
    };
    onAddStaff(duplicated);
  };

  return (
    <div id="staff-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Faculty Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure faculty qualifications, max workload limits, custom departments, and time slot availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllStaff && staffList.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all faculty members from the roster?')) {
                  onClearAllStaff();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear all faculty"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Faculty</span>
            </button>
          )}
          <button
            id="btn-add-staff"
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="staff-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by faculty name or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="staff-dept-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            id="staff-subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Subjects</option>
            {subjectsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State or Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {staffList.length === 0 ? 'No Faculty Members Configured' : 'No matching faculty found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {staffList.length === 0
              ? 'Start by adding your professors, lecturers, and instructors. All values and parameters are fully customizable.'
              : 'Try adjusting your search keywords or department filters.'}
          </p>
          {staffList.length === 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Faculty</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const eligibleSubjects = subjectsList.filter((s) => staff.subjectIds.includes(s.id));
            return (
              <div
                key={staff.id}
                id={`staff-card-${staff.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {staff.name}
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {staff.id}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{staff.department}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateStaff(staff)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                        title="Duplicate Faculty"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(staff)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                        title="Edit Faculty"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStaff(staff.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Workload & Constraints summary */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Workload</span>
                      <p className="font-semibold text-slate-800">{staff.maxPeriodsPerWeek} periods/week</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Unavail. Slots</span>
                      <p className="font-semibold text-slate-800">
                        {staff.unavailableSlots?.length ? `${staff.unavailableSlots.length} slot(s)` : 'None'}
                      </p>
                    </div>
                  </div>

                  {/* Qualified Subjects (Multi-subject showcase) */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Qualified Subjects ({eligibleSubjects.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {eligibleSubjects.length > 0 ? (
                        eligibleSubjects.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded border border-indigo-100"
                          >
                            {sub.code} ({sub.name})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-600 italic">No subjects assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                {editingStaff ? `Edit Faculty: ${editingStaff.name}` : 'Add New Faculty Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => {
                      setFormId(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="e.g. staff-cse-01"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="e.g. Dr. Suriya"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="staff-department-options"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Type or pick department"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <datalist id="staff-department-options">
                    {departments.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Periods Per Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={formMaxPeriods}
                    onChange={(e) => setFormMaxPeriods(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Consecutive Periods
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formMaxConsecutive}
                    onChange={(e) => setFormMaxConsecutive(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Multi-Subject Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Eligible / Qualified Subjects
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Selected: {formSubjectIds.length} subject(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                  {subjectsList.map((sub) => {
                    const isSelected = formSubjectIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`p-2 rounded text-left text-xs transition-colors flex items-center justify-between border ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">
                          {sub.code} - {sub.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                  {subjectsList.length === 0 && (
                    <div className="col-span-3 text-center py-4 text-xs text-slate-400">
                      No subjects available in database yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Grid */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block">
                      Slot Availability Matrix
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Click slots: Gray = FREE, Red = BUSY (Unavailable)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={setAllSlotsFree}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                    >
                      All Free
                    </button>
                    <button
                      type="button"
                      onClick={setMorningBusy}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                    >
                      Busy Morning
                    </button>
                    <button
                      type="button"
                      onClick={setAfternoonBusy}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                    >
                      Busy Afternoon
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50 p-2">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 text-left font-semibold text-slate-600 text-[11px]">Day</th>
                        {Array.from({ length: periodsCount }, (_, i) => (
                          <th key={i} className="p-1 font-semibold text-slate-600 text-[11px]">
                            P{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workingDays.map((day) => (
                        <tr key={day} className="border-t border-slate-200">
                          <td className="p-1 text-left font-medium text-slate-700 text-[11px]">{day}</td>
                          {Array.from({ length: periodsCount }, (_, i) => {
                            const p = i + 1;
                            const isUnavail = formUnavailableSlots.some(
                              (s) => s.day === day && s.period === p
                            );
                            return (
                              <td key={p} className="p-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleSlotStatus(day, p, 'UNAVAILABLE')}
                                  className={`w-full py-1 text-[10px] font-bold rounded transition-colors ${
                                    isUnavail
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {isUnavail ? 'BUSY' : 'FREE'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  {editingStaff ? 'Save Changes' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
