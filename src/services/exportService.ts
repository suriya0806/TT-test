import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ClassInfo,
  ScheduleConfig,
  Staff,
  Subject,
  TimetableEntry,
} from '../types';

export class ExportService {
  /**
   * Export Class Timetable to CSV
   */
  static exportClassToCsv(
    classInfo: ClassInfo,
    entries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const staffMap = new Map(staffList.map((s) => [s.id, s.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    const headers = ['Day', ...Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => `Period ${i + 1}`)];
    const rows: string[][] = [headers];

    for (const day of scheduleConfig.workingDays) {
      const row: string[] = [day];
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.classId === classInfo.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const staffName = staffMap.get(entry.staffId) || entry.staffId;
          row.push(`"${subName} (${staffName})"`);
        } else {
          row.push('"Free"');
        }
      }
      rows.push(row);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${classInfo.name.replace(/\s+/g, '_')}_Timetable.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export Class Timetable to Excel (.xlsx)
   */
  static exportClassToExcel(
    classInfo: ClassInfo,
    entries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const staffMap = new Map(staffList.map((s) => [s.id, s.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    const data: any[] = [];
    for (const day of scheduleConfig.workingDays) {
      const rowObj: any = { Day: day };
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.classId === classInfo.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const staffName = staffMap.get(entry.staffId) || entry.staffId;
          rowObj[`Period ${p}`] = `${subName} [${staffName}]`;
        } else {
          rowObj[`Period ${p}`] = 'Free';
        }
      }
      data.push(rowObj);
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
    XLSX.writeFile(workbook, `${classInfo.name.replace(/\s+/g, '_')}_Timetable.xlsx`);
  }

  /**
   * Export Class Timetable to PDF
   */
  static exportClassToPdf(
    classInfo: ClassInfo,
    entries: TimetableEntry[],
    staffList: Staff[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const staffMap = new Map(staffList.map((s) => [s.id, s.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(`Class Timetable: ${classInfo.name}`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Department: ${classInfo.department}  |  Year: ${classInfo.year}  |  Section: ${classInfo.section}  |  Room: ${classInfo.room || 'N/A'}`,
      14,
      25
    );

    const headers = ['Day', ...Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => `P${i + 1}`)];
    const body: string[][] = [];

    for (const day of scheduleConfig.workingDays) {
      const row: string[] = [day];
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.classId === classInfo.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const staffName = staffMap.get(entry.staffId) || entry.staffId;
          row.push(`${subName}\n(${staffName})`);
        } else {
          row.push('—');
        }
      }
      body.push(row);
    }

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, halign: 'center', valign: 'middle' },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left', cellWidth: 28 } },
    });

    doc.save(`${classInfo.name.replace(/\s+/g, '_')}_Timetable.pdf`);
  }

  /**
   * Export Staff Timetable to PDF
   */
  static exportStaffToPdf(
    staff: Staff,
    entries: TimetableEntry[],
    classesList: ClassInfo[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const classMap = new Map(classesList.map((c) => [c.id, c.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(`Faculty Timetable: ${staff.name}`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Department: ${staff.department}  |  Staff ID: ${staff.id}  |  Max Workload: ${staff.maxPeriodsPerWeek} periods/week`,
      14,
      25
    );

    const headers = ['Day', ...Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => `P${i + 1}`)];
    const body: string[][] = [];

    for (const day of scheduleConfig.workingDays) {
      const row: string[] = [day];
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.staffId === staff.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const className = classMap.get(entry.classId) || entry.classId;
          row.push(`${subName}\n[${className}]`);
        } else {
          row.push('Free');
        }
      }
      body.push(row);
    }

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [43, 64, 90], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, halign: 'center', valign: 'middle' },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left', cellWidth: 28 } },
    });

    doc.save(`${staff.name.replace(/\s+/g, '_')}_Timetable.pdf`);
  }

  /**
   * Export Staff Timetable to Excel
   */
  static exportStaffToExcel(
    staff: Staff,
    entries: TimetableEntry[],
    classesList: ClassInfo[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const classMap = new Map(classesList.map((c) => [c.id, c.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    const data: any[] = [];
    for (const day of scheduleConfig.workingDays) {
      const rowObj: any = { Day: day };
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.staffId === staff.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const className = classMap.get(entry.classId) || entry.classId;
          rowObj[`Period ${p}`] = `${subName} [${className}]`;
        } else {
          rowObj[`Period ${p}`] = 'Free';
        }
      }
      data.push(rowObj);
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
    XLSX.writeFile(workbook, `${staff.name.replace(/\s+/g, '_')}_Timetable.xlsx`);
  }

  /**
   * Export Staff Timetable to CSV
   */
  static exportStaffToCsv(
    staff: Staff,
    entries: TimetableEntry[],
    classesList: ClassInfo[],
    subjectsList: Subject[],
    scheduleConfig: ScheduleConfig
  ): void {
    const classMap = new Map(classesList.map((c) => [c.id, c.name]));
    const subjectMap = new Map(subjectsList.map((s) => [s.id, s.name]));

    const headers = ['Day', ...Array.from({ length: scheduleConfig.periodsPerDay }, (_, i) => `Period ${i + 1}`)];
    const rows: string[][] = [headers];

    for (const day of scheduleConfig.workingDays) {
      const row: string[] = [day];
      for (let p = 1; p <= scheduleConfig.periodsPerDay; p++) {
        const entry = entries.find((e) => e.staffId === staff.id && e.day === day && e.period === p);
        if (entry) {
          const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
          const className = classMap.get(entry.classId) || entry.classId;
          row.push(`"${subName} (${className})"`);
        } else {
          row.push('"Free"');
        }
      }
      rows.push(row);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${staff.name.replace(/\s+/g, '_')}_Timetable.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
