import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  buildRawDataExport,
  buildSelectedRawDataExport,
  getRawExportGrade,
  RAW_DATA_HEADERS,
  type RawDataExportRecord,
} from './rawDataExport.js';

assert.deepEqual(RAW_DATA_HEADERS, [
  '年级编号', '班级编号', '班级名称', '学籍号', '民族代码', '姓名', '性别',
  '出生日期', '家庭住址', '身高', '体重', '肺活量', '50米跑', '立定跳远',
  '坐位体前屈', '800米跑', '1000米跑', '一分钟仰卧起坐', '引体向上',
]);
assert.equal(getRawExportGrade('2024', '2024'), 1);
assert.equal(getRawExportGrade('2023', '2024'), 2);
assert.equal(getRawExportGrade('2022', '2024'), 3);

const records: RawDataExportRecord[] = [
  {
    student: {
      studentIdNational: '012345678901234567',
      ethnicityCode: '01',
      name: '测试甲',
      gender: 'male',
      birthDate: '2007-07-20',
    },
    classInfo: { cohort: '2022', className: '01班' },
    testData: {
      height: 175, weight: 60, lung_capacity: 3928, sprint_50m: 7.28,
      standing_jump: 231, sit_reach: 19, run_1000m: 223.4, pullup: 6,
      bmi: 19.59,
    },
  },
  {
    student: {
      studentIdNational: '012345678901234568',
      name: '测试乙',
      gender: 'female',
      birthDate: null,
    },
    classInfo: { cohort: '2024', className: '12班' },
    testData: { run_800m: 243, situp_1min: 45 },
  },
];
const file = buildRawDataExport(records, '2024');

const workbook = XLSX.read(file, { type: 'buffer', cellNF: true });
assert.deepEqual(workbook.SheetNames, ['原始数据']);
const sheet = workbook.Sheets['原始数据'];
assert.ok(sheet);
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as Array<Array<string | number>>;
assert.deepEqual(rows[0], Array.from(RAW_DATA_HEADERS));
assert.equal(rows.length, 3);
assert.deepEqual(rows[1]?.slice(0, 9), [
  33, '2022301', '高中2022级1班', '012345678901234567', '01', '测试甲', 1,
  sheet.H2.v, '',
]);
assert.equal(sheet.D2.t, 's');
assert.equal(sheet.H2.t, 'n');
assert.equal(sheet.H2.z, 'yyyy-mm-dd');
assert.equal(
  new Date(Date.UTC(1899, 11, 30) + sheet.H2.v * 86_400_000).toISOString().slice(0, 10),
  '2007-07-20',
);
assert.deepEqual(rows[1]?.slice(9), [175, 60, 3928, 7.28, 231, 19, '', "3'43.4", '', 6]);
assert.deepEqual(rows[2]?.slice(0, 9), [31, '2024312', '高中2024级12班',
  '012345678901234568', '', '测试乙', 2, '', '']);
assert.equal(rows[2]?.[15], "4'03");
assert.equal(rows[2]?.[17], 45);
assert.throws(
  () => buildRawDataExport([{
    student: { studentIdNational: '1', name: '测试', gender: 'male' },
    classInfo: { cohort: '2020', className: '01班' },
    testData: {},
  }], '2024'),
  /无法导出年级编号/,
);
assert.equal(XLSX.utils.sheet_to_json(
  XLSX.read(buildRawDataExport([], '2024'), { type: 'buffer' }).Sheets['原始数据'],
  { header: 1 },
).length, 1);

const single = await buildSelectedRawDataExport(records, '2024', [3], '2024体测');
assert.equal(single.fileName, '2024体测_高三_原始数据.xlsx');
assert.match(single.contentType, /spreadsheetml/);
const singleSheet = XLSX.read(single.file, { type: 'buffer' }).Sheets['原始数据'];
const singleRows = XLSX.utils.sheet_to_json(singleSheet, { header: 1 }) as unknown[][];
assert.equal(singleRows.length, 2);
assert.equal(singleRows[1]?.[0], 33);
assert.equal(singleRows[1]?.[3], '012345678901234567');

const multiple = await buildSelectedRawDataExport(records, '2024', [3, 1], '2024/体测');
assert.equal(multiple.fileName, '2024_体测_原始数据.zip');
assert.equal(multiple.contentType, 'application/zip');
const zip = await JSZip.loadAsync(multiple.file);
assert.deepEqual(Object.keys(zip.files).sort(), [
  '2024_体测_高一_原始数据.xlsx',
  '2024_体测_高三_原始数据.xlsx',
]);
for (const [gradeName, gradeCode, studentId] of [
  ['高一', 31, '012345678901234568'],
  ['高三', 33, '012345678901234567'],
] as const) {
  const entry = zip.file(`2024_体测_${gradeName}_原始数据.xlsx`);
  assert.ok(entry);
  const gradeFile = await entry.async('nodebuffer');
  const gradeSheet = XLSX.read(gradeFile, { type: 'buffer' }).Sheets['原始数据'];
  const gradeRows = XLSX.utils.sheet_to_json(gradeSheet, { header: 1 }) as unknown[][];
  assert.equal(gradeRows.length, 2);
  assert.equal(gradeRows[1]?.[0], gradeCode);
  assert.equal(gradeRows[1]?.[3], studentId);
}
await assert.rejects(
  buildSelectedRawDataExport(records, '2024', [2], '2024体测'),
  /所选年级没有原始数据/,
);
