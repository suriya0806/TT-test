import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Layers,
  X,
  Check,
  FlaskConical,
  Sparkles,
  Lock,
  Calendar,
  Clock,
} from 'lucide-react';
import { DayOfWeek, Staff, Subject, SubjectFixedSchedule, SubjectType } from '../types';
import { isNaanMudhalvanSubject } from '../utils/naanMudhalvanHelper';

interface SubjectViewProps {
  subjectsList: Subject[];
  staffList: Staff[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onClearAllSubjects?: () => void;
}

export const SubjectView: React.FC<SubjectViewProps> = ({
  subjectsList,
  staffList,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onClearAllSubjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Theory' | 'Lab'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SubjectType>('Theory');
  const [formRequiredPeriods, setFormRequiredPeriods] = useState<number | string>(4);
  const [formEligibleStaffIds, setFormEligibleStaffIds] = useState<string[]>([]);
  const [formConsecutive, setFormConsecutive] = useState<number | string>(1);
  const [formRoom, setFormRoom] = useState('');

  // Naan Mudhalvan & Fixed Schedule Fields
  const [formIsNaanMudhalvan, setFormIsNaanMudhalvan] = useState<boolean>(false);
  const [formFixedDay, setFormFixedDay] = useState<DayOfWeek>('Friday');
  const [formFixedStartPeriod, setFormFixedStartPeriod] = useState<number>(5);
  const [formFixedConsecutive, setFormFixedConsecutive] = useState<number>(4);

  const filteredSubjects = subjectsList.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAddModal = () => {
    setEditingSubject(null);
    setFormId(`subj-${Date.now().toString(36).substr(2, 4)}`);
    setFormCode('');
    setFormName('');
    setFormType('Theory');
    setFormRequiredPeriods(4);
    setFormEligibleStaffIds([]);
    setFormConsecutive(1);
    setFormRoom('LH-101');
    setFormIsNaanMudhalvan(false);
    setFormFixedDay('Friday');
    setFormFixedStartPeriod(5);
    setFormFixedConsecutive(4);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setFormId(sub.id);
    setFormCode(sub.code);
    setFormName(sub.name);
    setFormType(sub.type);
    setFormRequiredPeriods(sub.requiredPeriodsPerWeek);
    const combinedEligibleStaff = Array.from(
      new Set([
        ...(sub.eligibleStaffIds || []),
        ...staffList.filter((st) => st.subjectIds?.includes(sub.id)).map((st) => st.id),
      ])
    );
    setFormEligibleStaffIds(combinedEligibleStaff);
    setFormConsecutive(sub.consecutivePeriodsRequired || 1);
    setFormRoom(sub.roomRequired || '');

    const isNM = isNaanMudhalvanSubject(sub);
    setFormIsNaanMudhalvan(isNM);
    setFormFixedDay(sub.fixedSchedule?.day || 'Friday');
    setFormFixedStartPeriod(sub.fixedSchedule?.startPeriod || (sub.type === 'Lab' ? 5 : 1));
    setFormFixedConsecutive(sub.fixedSchedule?.consecutivePeriods || sub.consecutivePeriodsRequired || 4);
    setIsModalOpen(true);
  };

  const toggleStaff = (staffId: string) => {
    setFormEligibleStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const handleTypeChange = (type: SubjectType) => {
    setFormType(type);
    if (type === 'Lab') {
      setFormConsecutive(2);
      if (formRequiredPeriods === 4 && !formIsNaanMudhalvan) setFormRequiredPeriods(2);
      if (!formRoom || formRoom.startsWith('LH-')) setFormRoom('Specialized Lab');
    } else {
      setFormConsecutive(1);
      if (formRequiredPeriods === 2 && !formIsNaanMudhalvan) setFormRequiredPeriods(4);
    }
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    const lower = val.toLowerCase();
    if (lower.includes('naan mudhalvan') || lower.includes('naanmudhalvan') || lower.includes('naan mudalvan')) {
      setFormIsNaanMudhalvan(true);
      setFormConsecutive(4);
      setFormRequiredPeriods(4);
      setFormFixedConsecutive(4);
    }
  };

  const handleCodeChange = (val: string) => {
    setFormCode(val);
    if (val.toUpperCase().startsWith('NM')) {
      setFormIsNaanMudhalvan(true);
      setFormConsecutive(4);
      setFormRequiredPeriods(4);
      setFormFixedConsecutive(4);
    }
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    const consecutiveValue = formIsNaanMudhalvan
      ? Number(formFixedConsecutive) || 4
      : formConsecutive === ''
      ? 1
      : Math.max(1, Number(formConsecutive) || 1);

    const fixedScheduleData: SubjectFixedSchedule | undefined = formIsNaanMudhalvan
      ? {
          enabled: true,
          day: formFixedDay,
          startPeriod: Number(formFixedStartPeriod) || 5,
          consecutivePeriods: consecutiveValue,
        }
      : editingSubject?.fixedSchedule?.enabled
      ? editingSubject.fixedSchedule
      : undefined;

    const subData: Subject = {
      id: formId,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      type: formType,
      requiredPeriodsPerWeek: formRequiredPeriods === '' ? 4 : Math.max(1, Number(formRequiredPeriods) || 4),
      eligibleStaffIds: formEligibleStaffIds,
      consecutivePeriodsRequired: consecutiveValue,
      roomRequired: formRoom.trim() || undefined,
      isNaanMudhalvan: formIsNaanMudhalvan,
      fixedSchedule: fixedScheduleData,
    };

    if (editingSubject) {
      onUpdateSubject(subData);
    } else {
      onAddSubject(subData);
    }
    setIsModalOpen(false);
  };

  const handleDuplicateSubject = (sub: Subject) => {
    const duplicated: Subject = {
      ...sub,
      id: `subj-${Date.now().toString(36).slice(-4)}`,
      code: `${sub.code}-CPY`,
      name: `${sub.name} (Copy)`,
    };
    onAddSubject(duplicated);
  };

  return (
    <div id="subjects-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Subject & Course Catalog</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define Theory, Labs, Naan Mudhalvan skill blocks, weekly period loads, user-fixed schedules, and eligible faculty.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClearAllSubjects && subjectsList.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all subjects from the catalog?')) {
                  onClearAllSubjects();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear all subjects"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Clear All Subjects</span>
            </button>
          )}
          <button
            id="btn-add-subject"
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            id="subject-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or subject name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            All Types ({subjectsList.length})
          </button>
          <button
            onClick={() => setTypeFilter('Theory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
              typeFilter === 'Theory'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            Theory ({subjectsList.filter((s) => s.type === 'Theory').length})
          </button>
          <button
            onClick={() => setTypeFilter('Lab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
              typeFilter === 'Lab'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            Labs ({subjectsList.filter((s) => s.type === 'Lab').length})
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No subjects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm ? 'No subjects matched your filter.' : 'Get started by creating theory, lab, or Naan Mudhalvan courses.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => {
            const isLab = sub.type === 'Lab';
            const isNM = isNaanMudhalvanSubject(sub);
            const eligibleStaff = staffList.filter(
              (s) => (sub.eligibleStaffIds && sub.eligibleStaffIds.includes(s.id)) || (s.subjectIds && s.subjectIds.includes(sub.id))
            );

            const fixedDay = sub.fixedSchedule?.day || 'Friday';
            const fixedStartP = sub.fixedSchedule?.startPeriod || (isLab ? 5 : 1);
            const fixedCount = sub.fixedSchedule?.consecutivePeriods || sub.consecutivePeriodsRequired || 4;
            const fixedEndP = fixedStartP + fixedCount - 1;

            return (
              <div
                key={sub.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                  isNM
                    ? 'border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50/20 to-white dark:from-amber-950/20 dark:to-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {sub.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                            isLab
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {isLab ? <FlaskConical className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                          {sub.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{sub.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateSubject(sub)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Duplicate Subject"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSubject(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Naan Mudhalvan / Fixed Slot Pill */}
                  {isNM && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Naan Mudhalvan (User Fixed Slot)</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-950 dark:text-amber-200">
                          <Lock className="w-2.5 h-2.5" /> Locked from Shuffle
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                        Scheduled on <span className="font-bold underline">{fixedDay}</span> • Periods <span className="font-bold underline">P{fixedStartP} to P{fixedEndP}</span> ({fixedCount} periods)
                      </p>
                      <button
                        type="button"
                        onClick={() => openEditModal(sub)}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-0.5 cursor-pointer"
                      >
                        <Edit2 className="w-2.5 h-2.5" /> Change Day & Period
                      </button>
                    </div>
                  )}

                  {/* Subject Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Weekly Load</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{sub.requiredPeriodsPerWeek} periods/week</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Consecutive</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {isNM
                          ? `${sub.consecutivePeriodsRequired || 4} periods (Fixed Block)`
                          : sub.consecutivePeriodsRequired > 1
                          ? `${sub.consecutivePeriodsRequired} periods block`
                          : '1 period (Single)'}
                      </p>
                    </div>
                  </div>

                  {/* Eligible Teachers */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Qualified Teachers ({eligibleStaff.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {eligibleStaff.length > 0 ? (
                        eligibleStaff.map((staff) => (
                          <span
                            key={staff.id}
                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                          >
                            {staff.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">⚠️ No qualified teachers assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingSubject ? `Edit Subject: ${editingSubject.code}` : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. CS601 or NM301"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Theory')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        formType === 'Theory'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Theory
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('Lab')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        formType === 'Lab'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Lab
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Artificial Intelligence or Naan Mudhalvan Skill Course"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Periods Per Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formRequiredPeriods}
                    onChange={(e) => setFormRequiredPeriods(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consecutive Periods Required
                  </label>
                  <select
                    value={formConsecutive}
                    onChange={(e) => setFormConsecutive(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value={1}>1 Period (Standard Theory)</option>
                    <option value={2}>2 Consecutive Periods (Standard Lab)</option>
                    <option value={3}>3 Consecutive Periods (Extended Lab)</option>
                    <option value={4}>4 Consecutive Periods (Naan Mudhalvan Block)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Lab Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. LH-101 or Computing Lab 2"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Naan Mudhalvan / Fixed Slot Configuration */}
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Naan Mudhalvan & Fixed User Schedule
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Assign user-chosen day & period block. This subject will NEVER be shuffled when clicking shuffle.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsNaanMudhalvan}
                      onChange={(e) => setFormIsNaanMudhalvan(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {formIsNaanMudhalvan && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Designated Day
                      </label>
                      <select
                        value={formFixedDay}
                        onChange={(e) => setFormFixedDay(e.target.value as DayOfWeek)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Starting Period
                      </label>
                      <select
                        value={formFixedStartPeriod}
                        onChange={(e) => setFormFixedStartPeriod(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value={1}>Period 1 (Morning Start)</option>
                        <option value={2}>Period 2</option>
                        <option value={3}>Period 3</option>
                        <option value={4}>Period 4</option>
                        <option value={5}>Period 5 (Afternoon Start)</option>
                        <option value={6}>Period 6</option>
                        <option value={7}>Period 7</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 mb-1 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Block Length
                      </label>
                      <select
                        value={formFixedConsecutive}
                        onChange={(e) => setFormFixedConsecutive(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value={2}>2 Periods Block</option>
                        <option value={3}>3 Periods Block</option>
                        <option value={4}>4 Periods Block (Standard NM)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Fixed Slot: <span className="font-bold underline">{formFixedDay}</span> Periods{' '}
                        <span className="font-bold underline">
                          P{formFixedStartPeriod} to P{Number(formFixedStartPeriod) + Number(formFixedConsecutive) - 1}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        ✓ Protected from Shuffle
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Eligible Teachers Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Eligible Teachers (Multiple teachers can teach the same subject)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  {staffList.map((staff) => {
                    const isSelected = formEligibleStaffIds.includes(staff.id);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => toggleStaff(staff.id)}
                        className={`p-2 rounded text-left text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-200'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="truncate">{staff.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />}
                      </button>
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
