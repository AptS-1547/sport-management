import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { calculateGradeLevel } from './gradeHelper.js';
import { formatHighSchoolClassName } from './classNameFormatter.js';

export interface PhysicalTestCardData {
  student: {
    name: string;
    studentIdNational: string;
    gender: 'male' | 'female';
    birthDate?: string | null;
    ethnicityCode?: string | null;
  };
  records: Array<{
    classInfo: { cohort: string; className: string };
    form: { academicYear: string; testDate?: string | null };
    testData: Record<string, unknown>;
    scores: Record<string, unknown>;
    totalScore: number | string | null;
    gradeLevel: string | null;
  }>;
}

type CardRecord = PhysicalTestCardData['records'][number];
type RowEdits = Record<number, Record<number, string>>;

const escapeXml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const displayValue = (value: unknown): string =>
  value === null || value === undefined || value === '' ? '' : String(value);

const scoreValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const score = Number(value);
  return Number.isFinite(score) ? String(Number(score.toFixed(2))) : '';
};

const gradeName = (grade: string | null): string => ({
  excellent: '优秀', good: '良好', pass: '及格', fail: '不及格',
}[grade || ''] || '');

const itemGrade = (score: unknown, isBmi = false): string => {
  if (score === null || score === undefined || score === '') return '';
  const number = Number(score);
  if (!Number.isFinite(number)) return '';
  if (isBmi && number >= 100) return '正常';
  if (number >= 90) return '优秀';
  if (number >= 80) return '良好';
  if (number >= 60) return '及格';
  return '不及格';
};

const replaceTags = (xml: string, tag: string, modify: (element: string, index: number) => string): string => {
  let index = 0;
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, 'g');
  return xml.replace(pattern, element => modify(element, index++));
};

const replaceCellText = (cell: string, value: string): string => {
  let first = true;
  const updated = cell.replace(/(<w:t(?:\s[^>]*)?>)[\s\S]*?(<\/w:t>)/g, (_all, open: string, close: string) => {
    const content = first ? escapeXml(value) : '';
    first = false;
    return `${open}${content}${close}`;
  });
  if (first && value) throw new Error('登记卡模板中的数据单元格缺少文本节点');
  return updated;
};

const patchTable = (table: string, edits: RowEdits): string => {
  const seenRows = new Set<number>();
  const updated = replaceTags(table, 'w:tr', (row, rowIndex) => {
    const cells = edits[rowIndex];
    if (!cells) return row;
    seenRows.add(rowIndex);
    const seenCells = new Set<number>();
    const patched = replaceTags(row, 'w:tc', (cell, cellIndex) => {
      if (!(cellIndex in cells)) return cell;
      seenCells.add(cellIndex);
      return replaceCellText(cell, cells[cellIndex]);
    });
    if (seenCells.size !== Object.keys(cells).length) {
      throw new Error(`登记卡模板第 ${rowIndex + 1} 行结构不匹配`);
    }
    return patched;
  });
  if (seenRows.size !== Object.keys(edits).length) throw new Error('登记卡模板行结构不匹配');
  return updated;
};

const templatePath = (): string => {
  const packaged = Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg);
  const runtimeDir = packaged ? __dirname : path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(runtimeDir, packaged ? 'assets' : '../assets', 'physicalTestCardTemplate.base64');
};

const makeEdits = (data: PhysicalTestCardData): [RowEdits, RowEdits] => {
  const byGrade = new Map<number, CardRecord>();
  for (const record of data.records) {
    const grade = calculateGradeLevel(record.classInfo.cohort, record.form.academicYear);
    if (grade && grade >= 1 && grade <= 3) byGrade.set(grade, record);
  }
  const latest = data.records[data.records.length - 1];
  if (!latest || byGrade.size === 0) throw new Error('没有可导出的高中体测记录');
  const grades = [byGrade.get(1), byGrade.get(2), byGrade.get(3)];
  const infoEdits: RowEdits = {
    0: { 1: data.student.name, 3: data.student.gender === 'male' ? '男' : '女', 4: '学籍号', 5: data.student.studentIdNational },
    1: {
      1: formatHighSchoolClassName(latest.classInfo.cohort, latest.classInfo.className),
      3: displayValue(data.student.ethnicityCode),
      5: displayValue(data.student.birthDate),
    },
  };
  const scoreEdits: RowEdits = {};
  const itemCodes = [
    'bmi', 'lung_capacity', 'sprint_50m', 'standing_jump', 'sit_reach',
    data.student.gender === 'male' ? 'run_1000m' : 'run_800m',
    data.student.gender === 'male' ? 'pullup' : 'situp_1min',
  ];
  for (let itemIndex = 0; itemIndex < itemCodes.length; itemIndex++) {
    const code = itemCodes[itemIndex];
    const row: Record<number, string> = {};
    if (data.student.gender === 'female' && itemIndex === 5) row[0] = '800米跑 (分·秒)';
    if (data.student.gender === 'female' && itemIndex === 6) row[0] = '仰卧起坐 (次)';
    grades.forEach((record, gradeIndex) => {
      const offset = 1 + gradeIndex * 3;
      row[offset] = record ? displayValue(record.testData?.[code]) : '';
      row[offset + 1] = record ? scoreValue(record.scores?.[code]) : '';
      row[offset + 2] = record ? itemGrade(record.scores?.[code], code === 'bmi') : '';
    });
    row[10] = '';
    row[11] = '';
    scoreEdits[itemIndex + 2] = row;
  }
  for (const rowIndex of [9, 13, 14]) {
    const row: Record<number, string> = {};
    grades.forEach((record, gradeIndex) => {
      row[gradeIndex + 1] = record
        ? rowIndex === 14 ? gradeName(record.gradeLevel) : scoreValue(record.totalScore)
        : '';
    });
    row[4] = '';
    row[5] = '';
    scoreEdits[rowIndex] = row;
  }
  const bonusCodes = data.student.gender === 'male' ? ['pullup', 'run_1000m'] : ['situp_1min', 'run_800m'];
  for (const [bonusIndex, code] of bonusCodes.entries()) {
    const row: Record<number, string> = {};
    if (data.student.gender === 'female') row[0] = bonusIndex === 0 ? '仰卧起坐(女) (次)' : '800米(女) (分·秒)';
    grades.forEach((record, gradeIndex) => {
      row[1 + gradeIndex * 2] = record ? displayValue(record.testData?.[code]) : '';
      row[2 + gradeIndex * 2] = '';
    });
    row[7] = '';
    row[8] = '';
    scoreEdits[11 + bonusIndex] = row;
  }
  for (const rowIndex of [15, 16, 17]) {
    scoreEdits[rowIndex] = { 1: '', 2: '', 3: '', 4: '', 5: '' };
  }
  return [infoEdits, scoreEdits];
};

/** 直接填充示例 DOCX 的现有文本节点，保留页面、表格、字体、边框和签字栏格式。 */
export const buildPhysicalTestCard = async (data: PhysicalTestCardData): Promise<Buffer> => {
  const [infoEdits, scoreEdits] = makeEdits(data);
  const template = Buffer.from((await readFile(templatePath(), 'utf8')).trim(), 'base64');
  const zip = await JSZip.loadAsync(template);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('登记卡模板缺少正文');
  const source = await entry.async('string');
  let tablesSeen = 0;
  let document = replaceTags(source, 'w:tbl', (table, index) => {
    tablesSeen++;
    if (index === 0) return patchTable(table, infoEdits);
    if (index === 1) return patchTable(table, scoreEdits);
    return table;
  });
  if (tablesSeen !== 3) throw new Error('登记卡模板表格结构不匹配');
  document = document.replace('（高中样表）', '（高中）');
  document = document.replace('广东第二师范学院番禺附属中', '____________________');
  document = document.replace(/(<w:t>____________________<\/w:t>[\s\S]*?<w:t>)学(<\/w:t>)/, '$1$2');
  if (document.includes('广东第二师范学院番禺附属中') || document.includes('（高中样表）')) {
    throw new Error('登记卡模板示例值未清除');
  }
  zip.file('word/document.xml', document);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};
