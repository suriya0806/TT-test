import React, { useEffect, useState, useMemo } from 'react';
import {
  ActiveTab,
  Sidebar,
} from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StaffView } from './components/StaffView';
import { SubjectView } from './components/SubjectView';
import { ClassView } from './components/ClassView';
import { ScheduleConfigView } from './components/ScheduleConfigView';
import { ExistingTimetableEditorView } from './components/ExistingTimetableEditorView';
import { ConstraintsView } from './components/ConstraintsView';
import { GenerateView } from './components/GenerateView';
import { ConflictCenterView } from './components/ConflictCenterView';
import { ClassTimetableGrid } from './components/ClassTimetableGrid';
import { StaffTimetableGrid } from './components/StaffTimetableGrid';
import { WorkloadDashboardView } from './components/WorkloadDashboardView';
import { ImportExportModal } from './components/ImportExportModal';

import { StorageService } from './services/storage';
import { ConflictDetector } from './services/conflictDetector';
import { ConstraintSolver } from './services/constraintSolver';
import { ConflictResolver } from './services/conflictResolver';
import {
  ClassInfo,
  ConflictItem,
  ConstraintsConfig,
  ScheduleConfig,
  SolveResult,
  Staff,
  Subject,
  TimetableEntry,
} from './types';
import {
  SAMPLE_STAFF,
  SAMPLE_SUBJECTS,
  SAMPLE_CLASSES,
  SAMPLE_EXISTING_ENTRIES,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_CONSTRAINTS,
} from './data/sampleData';

export default function App() {
  // State Initialization
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(DEFAULT_SCHEDULE_CONFIG);
  const [constraintsConfig, setConstraintsConfig] = useState<ConstraintsConfig>(DEFAULT_CONSTRAINTS);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  
  // Solver State
  const [isSolving, setIsSolving] = useState(false);
  const [lastSolveResult, setLastSolveResult] = useState<SolveResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync theme with document class and local storage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load from Storage on Initial Render and reconcile two-way subject-staff assignments
  useEffect(() => {
    const loadedStaff = StorageService.getStaff();
    const loadedSubjects = StorageService.getSubjects();
    const loadedClasses = StorageService.getClasses();
    const loadedSchedule = StorageService.getScheduleConfig();
    const loadedConstraints = StorageService.getConstraints();
    const loadedEntries = StorageService.getTimetableEntries();

    // Reconcile two-way relationship between staff.subjectIds and subject.eligibleStaffIds
    let staffUpdated = false;
    let subjectsUpdated = false;

    const reconciledStaff = loadedStaff.map((st) => {
      const additionalSubjectIds = loadedSubjects
        .filter((sub) => sub.eligibleStaffIds?.includes(st.id) && !st.subjectIds?.includes(sub.id))
        .map((sub) => sub.id);
      if (additionalSubjectIds.length > 0) {
        staffUpdated = true;
        return {
          ...st,
          subjectIds: Array.from(new Set([...(st.subjectIds || []), ...additionalSubjectIds])),
        };
      }
      return st;
    });

    const reconciledSubjects = loadedSubjects.map((sub) => {
      const additionalStaffIds = reconciledStaff
        .filter((st) => st.subjectIds?.includes(sub.id) && !sub.eligibleStaffIds?.includes(st.id))
        .map((st) => st.id);
      if (additionalStaffIds.length > 0) {
        subjectsUpdated = true;
        return {
          ...sub,
          eligibleStaffIds: Array.from(new Set([...(sub.eligibleStaffIds || []), ...additionalStaffIds])),
        };
      }
      return sub;
    });

    if (staffUpdated) {
      StorageService.saveStaff(reconciledStaff);
    }
    if (subjectsUpdated) {
      StorageService.saveSubjects(reconciledSubjects);
    }

    setStaffList(reconciledStaff);
    setSubjectsList(reconciledSubjects);
    setClassesList(loadedClasses);
    setScheduleConfig(loadedSchedule);
    setConstraintsConfig(loadedConstraints);
    setEntries(loadedEntries);
  }, []);

  // Compute Conflicts in Real-Time
  const conflicts: ConflictItem[] = useMemo(() => {
    return ConflictDetector.detectAllConflicts(
      entries,
      staffList,
      subjectsList,
      classesList,
      scheduleConfig,
      constraintsConfig
    );
  }, [entries, staffList, subjectsList, classesList, scheduleConfig, constraintsConfig]);

  // Entity Handlers
  const handleAddStaff = (newStaff: Staff) => {
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    StorageService.saveStaff(updated);

    // Sync subjects list so that subjects have this staff member in their eligibleStaffIds
    if (newStaff.subjectIds && newStaff.subjectIds.length > 0) {
      const updatedSubjects = subjectsList.map((sub) => {
        if (newStaff.subjectIds.includes(sub.id) && !sub.eligibleStaffIds?.includes(newStaff.id)) {
          return {
            ...sub,
            eligibleStaffIds: [...(sub.eligibleStaffIds || []), newStaff.id],
          };
        }
        return sub;
      });
      setSubjectsList(updatedSubjects);
      StorageService.saveSubjects(updatedSubjects);
    }

    showToast(`Added faculty member ${newStaff.name}`, 'success');
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const updated = staffList.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaffList(updated);
    StorageService.saveStaff(updated);

    // Sync subjects list
    const updatedSubjects = subjectsList.map((sub) => {
      const isQualified = updatedStaff.subjectIds?.includes(sub.id);
      const currentlyHas = sub.eligibleStaffIds?.includes(updatedStaff.id);
      if (isQualified && !currentlyHas) {
        return { ...sub, eligibleStaffIds: [...(sub.eligibleStaffIds || []), updatedStaff.id] };
      } else if (!isQualified && currentlyHas) {
        return { ...sub, eligibleStaffIds: (sub.eligibleStaffIds || []).filter((id) => id !== updatedStaff.id) };
      }
      return sub;
    });
    setSubjectsList(updatedSubjects);
    StorageService.saveSubjects(updatedSubjects);

    showToast(`Updated ${updatedStaff.name}`, 'success');
  };

  const handleDeleteStaff = (staffId: string) => {
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    StorageService.saveStaff(updated);

    // Remove from subjects eligibleStaffIds
    const updatedSubjects = subjectsList.map((sub) => ({
      ...sub,
      eligibleStaffIds: (sub.eligibleStaffIds || []).filter((id) => id !== staffId),
    }));
    setSubjectsList(updatedSubjects);
    StorageService.saveSubjects(updatedSubjects);

    // Remove from classes preferredStaffId
    const updatedClasses = classesList.map((cls) => ({
      ...cls,
      subjects: cls.subjects.map((s) =>
        s.preferredStaffId === staffId ? { ...s, preferredStaffId: undefined } : s
      ),
    }));
    setClassesList(updatedClasses);
    StorageService.saveClasses(updatedClasses);

    showToast('Faculty removed from roster', 'info');
  };

  const handleAddSubject = (newSubject: Subject) => {
    const updated = [...subjectsList, newSubject];
    setSubjectsList(updated);
    StorageService.saveSubjects(updated);

    // Sync staff directory so selected teachers have this subject in their subjectIds
    if (newSubject.eligibleStaffIds && newSubject.eligibleStaffIds.length > 0) {
      const updatedStaff = staffList.map((st) => {
        if (newSubject.eligibleStaffIds.includes(st.id) && !st.subjectIds?.includes(newSubject.id)) {
          return {
            ...st,
            subjectIds: [...(st.subjectIds || []), newSubject.id],
          };
        }
        return st;
      });
      setStaffList(updatedStaff);
      StorageService.saveStaff(updatedStaff);
    }

    showToast(`Added subject ${newSubject.name}`, 'success');
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    const updated = subjectsList.map((s) => (s.id === updatedSubject.id ? updatedSubject : s));
    setSubjectsList(updated);
    StorageService.saveSubjects(updated);

    // Sync staff directory: ensure teachers assigned to this subject have it in their subjectIds, and vice versa
    const updatedStaff = staffList.map((st) => {
      const isEligible = updatedSubject.eligibleStaffIds?.includes(st.id);
      const currentlyHas = st.subjectIds?.includes(updatedSubject.id);
      if (isEligible && !currentlyHas) {
        return {
          ...st,
          subjectIds: [...(st.subjectIds || []), updatedSubject.id],
        };
      } else if (!isEligible && currentlyHas) {
        return {
          ...st,
          subjectIds: (st.subjectIds || []).filter((id) => id !== updatedSubject.id),
        };
      }
      return st;
    });
    setStaffList(updatedStaff);
    StorageService.saveStaff(updatedStaff);

    showToast(`Updated subject ${updatedSubject.code}`, 'success');
  };

  const handleDeleteSubject = (subjectId: string) => {
    const updated = subjectsList.filter((s) => s.id !== subjectId);
    setSubjectsList(updated);
    StorageService.saveSubjects(updated);

    // Remove subject from all staff members' subjectIds
    const updatedStaff = staffList.map((st) => ({
      ...st,
      subjectIds: (st.subjectIds || []).filter((id) => id !== subjectId),
    }));
    setStaffList(updatedStaff);
    StorageService.saveStaff(updatedStaff);

    // Remove from class curriculums
    const updatedClasses = classesList.map((cls) => ({
      ...cls,
      subjects: cls.subjects.filter((s) => s.subjectId !== subjectId),
    }));
    setClassesList(updatedClasses);
    StorageService.saveClasses(updatedClasses);

    // Remove from timetable entries
    const updatedEntries = entries.filter((e) => e.subjectId !== subjectId);
    if (updatedEntries.length !== entries.length) {
      setEntries(updatedEntries);
      StorageService.saveTimetableEntries(updatedEntries);
    }

    showToast('Subject deleted', 'info');
  };

  const handleAddClass = (newClass: ClassInfo) => {
    const updated = [...classesList, newClass];
    setClassesList(updated);
    StorageService.saveClasses(updated);
    showToast(`Added class ${newClass.name}`, 'success');
  };

  const handleUpdateClass = (updatedClass: ClassInfo) => {
    const updated = classesList.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClassesList(updated);
    StorageService.saveClasses(updated);
    showToast(`Updated class ${updatedClass.name}`, 'success');
  };

  const handleDeleteClass = (classId: string) => {
    const updated = classesList.filter((c) => c.id !== classId);
    setClassesList(updated);
    StorageService.saveClasses(updated);
    showToast('Class removed', 'info');
  };

  const handleSaveScheduleConfig = (config: ScheduleConfig) => {
    setScheduleConfig(config);
    StorageService.saveScheduleConfig(config);
    showToast('Schedule settings updated', 'success');
  };

  const handleSaveConstraints = (config: ConstraintsConfig) => {
    setConstraintsConfig(config);
    StorageService.saveConstraints(config);
    showToast('Constraint configuration saved', 'success');
  };

  const handleUpdateEntries = (newEntries: TimetableEntry[]) => {
    setEntries(newEntries);
    StorageService.saveTimetableEntries(newEntries);
  };

  const handleClearAllStaff = () => {
    setStaffList([]);
    StorageService.saveStaff([]);
    showToast('All faculty members cleared.', 'info');
  };

  const handleClearAllSubjects = () => {
    setSubjectsList([]);
    StorageService.saveSubjects([]);
    showToast('All subjects cleared.', 'info');
  };

  const handleClearAllClasses = () => {
    setClassesList([]);
    StorageService.saveClasses([]);
    showToast('All classes cleared.', 'info');
  };

  // Clear timetable entries only (keep faculty & curriculum)
  const handleClearTimetableOnly = () => {
    setEntries([]);
    StorageService.saveTimetableEntries([]);
    showToast('Cleared all timetable allocations. Faculty & subjects retained.', 'info');
  };

  // Wipe all data to start a completely fresh institution schedule
  const handleWipeAllData = () => {
    setStaffList([]);
    setSubjectsList([]);
    setClassesList([]);
    setEntries([]);
    StorageService.saveStaff([]);
    StorageService.saveSubjects([]);
    StorageService.saveClasses([]);
    StorageService.saveTimetableEntries([]);
    showToast('All sample data wiped. Ready for your institution timetable!', 'success');
  };

  // Reset to Sample Template if needed
  const handleResetToSampleScenario = () => {
    setStaffList(SAMPLE_STAFF);
    setSubjectsList(SAMPLE_SUBJECTS);
    setClassesList(SAMPLE_CLASSES);
    setScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    setConstraintsConfig(DEFAULT_CONSTRAINTS);
    setEntries(SAMPLE_EXISTING_ENTRIES);

    StorageService.saveStaff(SAMPLE_STAFF);
    StorageService.saveSubjects(SAMPLE_SUBJECTS);
    StorageService.saveClasses(SAMPLE_CLASSES);
    StorageService.saveScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    StorageService.saveConstraints(DEFAULT_CONSTRAINTS);
    StorageService.saveTimetableEntries(SAMPLE_EXISTING_ENTRIES);

    showToast('Loaded sample data template', 'info');
  };

  // Solver Executions
  const handleGenerateNew = () => {
    setIsSolving(true);
    setTimeout(() => {
      const result = ConstraintSolver.solve(
        { mode: 'NEW_TIMETABLE', preserveValidExisting: false },
        staffList,
        subjectsList,
        classesList,
        scheduleConfig,
        constraintsConfig,
        []
      );

      setLastSolveResult(result);
      if (result.timetable && result.timetable.length > 0) {
        handleUpdateEntries(result.timetable);
        if (result.success) {
          showToast('Timetable Generated Successfully!', 'success');
        } else {
          showToast(`Timetable Generated with ${result.validation.conflicts.length} notice(s)`, 'info');
        }
      } else {
        showToast(result.message || 'Unable to generate timetable', 'error');
      }
      setIsSolving(false);
      setActiveTab('generate');
    }, 150);
  };

  const handleShuffleTimetable = () => {
    setIsSolving(true);
    setTimeout(() => {
      const result = ConstraintSolver.solve(
        { mode: 'NEW_TIMETABLE', preserveValidExisting: false, shufflePeriods: true },
        staffList,
        subjectsList,
        classesList,
        scheduleConfig,
        constraintsConfig,
        []
      );

      setLastSolveResult(result);
      if (result.timetable && result.timetable.length > 0) {
        handleUpdateEntries(result.timetable);
        if (result.success) {
          showToast('Timetable Shuffled & Subject Hours Rotated Successfully!', 'success');
        } else {
          showToast(`Timetable Shuffled with ${result.validation.conflicts.length} notice(s)`, 'info');
        }
      } else {
        showToast(result.message || 'Unable to shuffle timetable', 'error');
      }
      setIsSolving(false);
    }, 150);
  };

  const handleCompleteExisting = () => {
    setIsSolving(true);
    setTimeout(() => {
      const result = ConstraintSolver.solve(
        { mode: 'COMPLETE_EXISTING', preserveValidExisting: true },
        staffList,
        subjectsList,
        classesList,
        scheduleConfig,
        constraintsConfig,
        entries
      );

      setLastSolveResult(result);
      if (result.timetable && result.timetable.length > 0) {
        handleUpdateEntries(result.timetable);
        if (result.success) {
          showToast('Existing Timetable Completed Successfully!', 'success');
        } else {
          showToast(`Timetable Updated with ${result.validation.conflicts.length} notice(s)`, 'info');
        }
      } else {
        showToast(result.message || 'Unable to complete timetable', 'error');
      }
      setIsSolving(false);
      setActiveTab('generate');
    }, 150);
  };

  // Auto Resolve All Conflicts
  const handleAutoResolveAll = () => {
    setIsSolving(true);
    setTimeout(() => {
      const result = ConflictResolver.autoResolveAll(
        entries,
        staffList,
        subjectsList,
        classesList,
        scheduleConfig,
        constraintsConfig
      );

      setLastSolveResult(result);
      if (result.timetable && result.timetable.length > 0) {
        handleUpdateEntries(result.timetable);
        if (result.success) {
          showToast('All conflicts resolved and timetable completed!', 'success');
        } else {
          showToast(`Conflicts resolved with ${result.validation.conflicts.length} notice(s)`, 'info');
        }
      } else {
        showToast(result.message || 'Unable to resolve conflicts', 'error');
      }
      setIsSolving(false);
    }, 150);
  };

  // Resolve Single Conflict
  const handleResolveSingleConflict = (conflict: ConflictItem, selectedStaffId: string) => {
    const updated = ConflictResolver.resolveSingleConflict(
      conflict,
      selectedStaffId,
      entries
    );
    handleUpdateEntries(updated);
    showToast('Conflict resolved by reassigning faculty.', 'success');
  };

  const handleRemoveConflictingEntry = (entryId: string) => {
    handleUpdateEntries(entries.filter((e) => e.id !== entryId));
    showToast('Conflicting entry removed.', 'info');
  };

  const handleImportAllBackup = (data: {
    staff: Staff[];
    subjects: Subject[];
    classes: ClassInfo[];
    scheduleConfig: ScheduleConfig;
    constraints: ConstraintsConfig;
    entries: TimetableEntry[];
  }) => {
    const reconciledStaff = (data.staff || []).map((st) => {
      const additionalSubjectIds = (data.subjects || [])
        .filter((sub) => sub.eligibleStaffIds?.includes(st.id) && !st.subjectIds?.includes(sub.id))
        .map((sub) => sub.id);
      return {
        ...st,
        subjectIds: Array.from(new Set([...(st.subjectIds || []), ...additionalSubjectIds])),
      };
    });

    const reconciledSubjects = (data.subjects || []).map((sub) => {
      const additionalStaffIds = reconciledStaff
        .filter((st) => st.subjectIds?.includes(sub.id) && !sub.eligibleStaffIds?.includes(st.id))
        .map((st) => st.id);
      return {
        ...sub,
        eligibleStaffIds: Array.from(new Set([...(sub.eligibleStaffIds || []), ...additionalStaffIds])),
      };
    });

    setStaffList(reconciledStaff);
    setSubjectsList(reconciledSubjects);
    setClassesList(data.classes);
    if (data.scheduleConfig) setScheduleConfig(data.scheduleConfig);
    if (data.constraints) setConstraintsConfig(data.constraints);
    if (data.entries) setEntries(data.entries);

    StorageService.saveStaff(reconciledStaff);
    StorageService.saveSubjects(reconciledSubjects);
    StorageService.saveClasses(data.classes);
    if (data.scheduleConfig) StorageService.saveScheduleConfig(data.scheduleConfig);
    if (data.constraints) StorageService.saveConstraints(data.constraints);
    if (data.entries) StorageService.saveTimetableEntries(data.entries);

    showToast('Backup restored successfully!', 'success');
  };

  return (
    <div id="smart-timetable-app" className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased transition-colors duration-150">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in shadow-lg">
          <div
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-950 dark:border-slate-700'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        conflictCount={conflicts.length}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Header
          activeTab={activeTab}
          conflictCount={conflicts.length}
          staffCount={staffList.length}
          subjectCount={subjectsList.length}
          classCount={classesList.length}
          workingDaysCount={scheduleConfig.workingDays.length}
          periodsCount={scheduleConfig.periodsPerDay}
          onGenerateNew={handleGenerateNew}
          onCompleteExisting={handleCompleteExisting}
          onShuffleTimetable={handleShuffleTimetable}
          onOpenImportExport={() => setIsImportModalOpen(true)}
          onStartFresh={() => setIsImportModalOpen(true)}
          isSolving={isSolving}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/90 transition-colors duration-150">
          {activeTab === 'dashboard' && (
            <DashboardView
              staffList={staffList}
              subjectsList={subjectsList}
              classesList={classesList}
              scheduleConfig={scheduleConfig}
              entries={entries}
              conflicts={conflicts}
              isFeasible={true}
              onNavigate={setActiveTab}
              onGenerateNew={handleGenerateNew}
              onCompleteExisting={handleCompleteExisting}
              onShuffleTimetable={handleShuffleTimetable}
              onAutoResolveAll={handleAutoResolveAll}
              onStartFresh={() => setIsImportModalOpen(true)}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staffList={staffList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onClearAllStaff={handleClearAllStaff}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectView
              subjectsList={subjectsList}
              staffList={staffList}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onClearAllSubjects={handleClearAllSubjects}
            />
          )}

          {activeTab === 'classes' && (
            <ClassView
              classesList={classesList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onClearAllClasses={handleClearAllClasses}
            />
          )}

          {activeTab === 'schedule-config' && (
            <ScheduleConfigView
              scheduleConfig={scheduleConfig}
              onSaveScheduleConfig={handleSaveScheduleConfig}
            />
          )}

          {activeTab === 'existing-editor' && (
            <ExistingTimetableEditorView
              entries={entries}
              staffList={staffList}
              subjectsList={subjectsList}
              classesList={classesList}
              scheduleConfig={scheduleConfig}
              onUpdateEntries={handleUpdateEntries}
              onCompleteExisting={handleCompleteExisting}
              onResetToSampleScenario={handleResetToSampleScenario}
            />
          )}

          {activeTab === 'constraints' && (
            <ConstraintsView
              constraintsConfig={constraintsConfig}
              staffList={staffList}
              subjectsList={subjectsList}
              classesList={classesList}
              onSaveConstraints={handleSaveConstraints}
            />
          )}

          {activeTab === 'generate' && (
            <GenerateView
              onGenerateNew={handleGenerateNew}
              onCompleteExisting={handleCompleteExisting}
              onShuffleTimetable={handleShuffleTimetable}
              onNavigate={setActiveTab}
              lastSolveResult={lastSolveResult}
              isSolving={isSolving}
              staffList={staffList}
              classesList={classesList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              entries={entries}
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictCenterView
              conflicts={conflicts}
              staffList={staffList}
              subjectsList={subjectsList}
              onAutoResolveAll={handleAutoResolveAll}
              onResolveSingleConflict={handleResolveSingleConflict}
              onRemoveConflictingEntry={handleRemoveConflictingEntry}
              isSolving={isSolving}
            />
          )}

          {activeTab === 'class-timetable' && (
            <ClassTimetableGrid
              classesList={classesList}
              staffList={staffList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              entries={entries}
              onShuffleTimetable={handleShuffleTimetable}
              onUpdateEntries={handleUpdateEntries}
            />
          )}

          {activeTab === 'staff-timetable' && (
            <StaffTimetableGrid
              staffList={staffList}
              classesList={classesList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              entries={entries}
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadDashboardView
              staffList={staffList}
              classesList={classesList}
              subjectsList={subjectsList}
              scheduleConfig={scheduleConfig}
              entries={entries}
            />
          )}
        </main>
      </div>

      {/* Import / Export Modal */}
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        staffList={staffList}
        subjectsList={subjectsList}
        classesList={classesList}
        scheduleConfig={scheduleConfig}
        constraintsConfig={constraintsConfig}
        entries={entries}
        onImportStaff={(staff) => {
          setStaffList(staff);
          StorageService.saveStaff(staff);
        }}
        onImportSubjects={(subjects) => {
          setSubjectsList(subjects);
          StorageService.saveSubjects(subjects);
        }}
        onImportClasses={(classes) => {
          setClassesList(classes);
          StorageService.saveClasses(classes);
        }}
        onImportAllBackup={handleImportAllBackup}
        onClearTimetableOnly={handleClearTimetableOnly}
        onWipeAllData={handleWipeAllData}
      />
    </div>
  );
}
