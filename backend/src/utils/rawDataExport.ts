import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { calculateGradeLevel } from './gradeHelper.js';
import { extractClassNumberFromClassName } from './classNameFormatter.js';

export const RAW_DATA_HEADERS = [
  '年级编号', '班级编号', '班级名称', '学籍号', '民族代码', '姓名', '性别',
  '出生日期', '家庭住址', '身高', '体重', '肺活量', '50米跑', '立定跳远',
  '坐位体前屈', '800米跑', '1000米跑', '一分钟仰卧起坐', '引体向上',
] as const;

export interface RawDataExportRecord {
  student: {
    studentIdNational: string;
    ethnicityCode?: string | null;
    name: string;
    gender: 'male' | 'female';
    birthDate?: string | null;
  };
  classInfo: {
    cohort: string;
    className: string;
  };
  testData: Record<string, unknown>;
}

export const getRawExportGrade = (cohort: string, academicYear: string): number => {
  const grade = calculateGradeLevel(cohort, academicYear);
  if (!Number.isInteger(grade) || grade < 1 || grade > 3) {
    throw new Error(`${cohort}级与${academicYear}学年不匹配，无法导出年级编号`);
  }
  return grade;
};

const excelDate = (value?: string | null): number | string => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) return value;
  return Math.round((timestamp - Date.UTC(1899, 11, 30)) / 86_400_000);
};

const rawValue = (value: unknown): string | number => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  return '';
};

const runTime = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  const seconds = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return String(value);

  const hundredths = Math.round(seconds * 100);
  const minutes = Math.floor(hundredths / 6000);
  const remainder = hundredths % 6000;
  const wholeSeconds = String(Math.floor(remainder / 100)).padStart(2, '0');
  const fraction = String(remainder % 100).padStart(2, '0').replace(/0+$/, '');
  return `${minutes}'${wholeSeconds}${fraction ? `.${fraction}` : ''}`;
};

export const buildRawDataExport = (
  records: RawDataExportRecord[],
  academicYear: string,
): Buffer => {
  const rows: Array<Array<string | number>> = [Array.from(RAW_DATA_HEADERS)];

  for (const record of records) {
    const { student, classInfo, testData } = record;
    const grade = getRawExportGrade(classInfo.cohort, academicYear);

    const classNumber = extractClassNumberFromClassName(classInfo.className);
    const classCode = `${classInfo.cohort}3${String(classNumber).padStart(2, '0')}`;
    rows.push([
      30 + grade,
      classCode,
      `高中${classInfo.cohort}级${classNumber}班`,
      student.studentIdNational,
      student.ethnicityCode || '',
      student.name,
      student.gender === 'male' ? 1 : 2,
      excelDate(student.birthDate),
      '',
      rawValue(testData.height),
      rawValue(testData.weight),
      rawValue(testData.lung_capacity),
      rawValue(testData.sprint_50m),
      rawValue(testData.standing_jump),
      rawValue(testData.sit_reach),
      runTime(testData.run_800m),
      runTime(testData.run_1000m),
      rawValue(testData.situp_1min),
      rawValue(testData.pullup),
    ]);
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const columnWidths = [12, 14, 22, 24, 12, 14, 8, 14, 18, 10, 10, 12, 10, 12, 14, 12, 12, 20, 12];
  worksheet['!cols'] = columnWidths.map((wch) => ({ wch }));
  for (let row = 2; row <= rows.length; row++) {
    const dateCell = worksheet[`H${row}`];
    if (dateCell?.t === 'n') dateCell.z = 'yyyy-mm-dd';
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, '原始数据');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
};

export class RawDataExportSelectionError extends Error {}

export const buildSelectedRawDataExport = async (
  records: RawDataExportRecord[],
  academicYear: string,
  selectedGrades: number[],
  formName: string,
): Promise<{ file: Buffer; fileName: string; contentType: string }> => {
  const grades = [...new Set(selectedGrades)].sort((left, right) => left - right);
  if (!grades.length || grades.some((grade) => !Number.isInteger(grade) || grade < 1 || grade > 3)) {
    throw new RawDataExportSelectionError('请至少选择一个有效年级');
  }
  const grouped = new Map<number, RawDataExportRecord[]>(
    grades.map((grade) => [grade, []]),
  );
  for (const record of records) {
    const grade = getRawExportGrade(record.classInfo.cohort, academicYear);
    grouped.get(grade)?.push(record);
  }
  if (grades.some((grade) => grouped.get(grade)?.length === 0)) {
    throw new RawDataExportSelectionError('所选年级没有原始数据，请重新选择');
  }

  const safeFormName = formName.replace(/[<>:"/\\|?*\r\n]/g, '_').trim().slice(0, 100) || '体测表单';
  const gradeNames: Record<number, string> = { 1: '高一', 2: '高二', 3: '高三' };
  if (grades.length === 1) {
    const grade = grades[0];
    return {
      file: buildRawDataExport(grouped.get(grade)!, academicYear),
      fileName: `${safeFormName}_${gradeNames[grade]}_原始数据.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  const zip = new JSZip();
  for (const grade of grades) {
    zip.file(
      `${safeFormName}_${gradeNames[grade]}_原始数据.xlsx`,
      buildRawDataExport(grouped.get(grade)!, academicYear),
    );
  }
  return {
    file: await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' }),
    fileName: `${safeFormName}_原始数据.zip`,
    contentType: 'application/zip',
  };
};
