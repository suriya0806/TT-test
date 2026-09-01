import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  ClassInfo,
  ConstraintsConfig,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';
import { ExportService } from '../services/exportService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  subjectsList: Subject[];
  classesList: ClassInfo[];
  scheduleConfig: ScheduleConfig;
  constraintsConfig: ConstraintsConfig;
  entries: TimetableEntry[];
  onImportStaff: (staff: Staff[]) => void;
  onImportSubjects: (subjects: Subject[]) => void;
  onImportClasses: (classes: ClassInfo[]) => void;
  onImportAllBackup: (data: {
    staff: Staff[];
    subjects: Subject[];
    classes: ClassInfo[];
    scheduleConfig: ScheduleConfig;
    constraints: ConstraintsConfig;
    entries: TimetableEntry[];
  }) => void;
  onClearTimetableOnly?: () => void;
  onWipeAllData?: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  staffList,
  subjectsList,
  classesList,
  scheduleConfig,
  constraintsConfig,
  entries,
  onImportStaff,
  onImportSubjects,
  onImportClasses,
  onImportAllBackup,
  onClearTimetableOnly,
  onWipeAllData,
}) => {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!isOpen) return null;

  const handleJsonBackupDownload = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      staff: staffList,
      subjects: subjectsList,
      classes: classesList,
      scheduleConfig,
      constraints: constraintsConfig,
      entries,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_timetable_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.staff && parsed.subjects && parsed.classes) {
          onImportAllBackup(parsed);
          setImportStatus({
            type: 'success',
            message: `Successfully imported backup with ${parsed.staff.length} staff, ${parsed.subjects.length} subjects, and ${parsed.entries?.length || 0} timetable slots.`,
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'Invalid backup file structure. Missing required collections.',
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Error parsing JSON file. Please ensure it is a valid format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = (type: 'staff' | 'subject' | 'class') => {
    let csvContent = '';
    let filename = '';

    if (type === 'staff') {
      csvContent = 'name,department,designation,email,maxPeriodsPerWeek,subjectsCanTeach\nDr. Example Faculty,Computer Science,Associate Professor,example@college.edu,20,CS601;CS602';
      filename = 'staff_import_template.csv';
    } else if (type === 'subject') {
      csvContent = 'code,name,type,requiredPeriodsPerWeek,consecutivePeriodsRequired,roomRequired\nCS601,Artificial Intelligence,Theory,4,1,LH-101\nCS605,AI Lab,Lab,2,2,Computing Lab 1';
      filename = 'subject_import_template.csv';
    } else if (type === 'class') {
      csvContent = 'name,department,year,section,room,subjectRequirements\nCSE III A,Computer Science,III,A,Room 301,CS601:4;CS602:4;CS605:2';
      filename = 'class_import_template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Data Import & Export Center</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importStatus && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Section 1: Full System Backup */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Full System JSON Backup & Restore</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your entire timetable setup (all staff, subjects, classes, constraints, and locked allocations) into a single reusable JSON archive.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleJsonBackupDownload}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export System JSON Backup</span>
              </button>

              <label className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Restore From JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonBackupUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 2: CSV Templates & Entity Imports */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Download CSV Import Templates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleDownloadCsvTemplate('staff')}
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-colors space-y-1 cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Faculty Roster</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">staff_import_template.csv</span>
              </button>

              <button
                onClick={() => handleDownloadCsvTemplate('subject')}
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-colors space-y-1 cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Subject Catalog</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">subject_import_template.csv</span>
              </button>

              <button
                onClick={() => handleDownloadCsvTemplate('class')}
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-colors space-y-1 cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">Class Sections</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">class_import_template.csv</span>
              </button>
            </div>
          </div>

          {/* Section 3: Reset & Clear (Start Fresh for New Academic Use) */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-200/80 dark:border-rose-900/60 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Reset & Start Fresh Slate</span>
            </h4>
            <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
              Clear previous demo schedules or wipe all entries to set up a brand new college timetable with your own custom faculty, subjects, and classes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {onClearTimetableOnly && (
                <button
                  onClick={() => {
                    onClearTimetableOnly();
                    setImportStatus({
                      type: 'success',
                      message: 'Timetable allocations cleared. Faculty, subjects, and classes were retained.',
                    });
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Clear Timetable Slots Only</span>
                </button>
              )}

              {onWipeAllData && (
                <>
                  {!confirmWipe ? (
                    <button
                      onClick={() => setConfirmWipe(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Wipe All & Start Fresh</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Are you sure?</span>
                      <button
                        onClick={() => {
                          onWipeAllData();
                          setConfirmWipe(false);
                          setImportStatus({
                            type: 'success',
                            message: 'All data wiped. You now have a completely fresh slate.',
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
                      >
                        Confirm Wipe
                      </button>
                      <button
                        onClick={() => setConfirmWipe(false)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
