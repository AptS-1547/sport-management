import assert from 'node:assert/strict';
import { test } from 'node:test';
import JSZip from 'jszip';
import { buildPhysicalTestCard, type PhysicalTestCardData } from './physicalTestCardExport.js';

const makeRecord = (academicYear: string, score: number): PhysicalTestCardData['records'][number] => ({
  classInfo: { cohort: '2024', className: '8班' },
  form: { academicYear, testDate: `${academicYear}-10-01` },
  testData: { bmi: 18.6, lung_capacity: 2908, sprint_50m: 7.5, run_1000m: '3:37', pullup: 4 },
  scores: { bmi: 100, lung_capacity: 64, sprint_50m: 80, run_1000m: 90, pullup: 30 },
  totalScore: score,
  gradeLevel: score >= 80 ? 'good' : 'pass',
});

test('导出三学年登记卡包含学生信息和对应年级成绩，未补造毕业成绩', async () => {
  const file = await buildPhysicalTestCard({
    student: { name: '测试<学生>', studentIdNational: 'G123&456', gender: 'male', birthDate: '2008-10-03' },
    records: [makeRecord('2024', 77), makeRecord('2025', 82.8), makeRecord('2026', 77.6)],
  });
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file('word/document.xml')!.async('string');
  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('_rels/.rels'));
  assert.match(xml, /测试&lt;学生&gt;/);
  assert.match(xml, /G123&amp;456/);
  assert.match(xml, /高一/);
  assert.match(xml, /高二/);
  assert.match(xml, /高三/);
  assert.match(xml, /77\.6/);
  assert.match(xml, /毕业成绩/);
  assert.ok(xml.includes('学籍号'));
  assert.ok(!xml.includes('Gxxx1132007100xxx'));
  assert.ok(!xml.includes('广东第二师范学院番禺附属中'));
  assert.ok(!xml.includes('（高中样表）'));
  assert.ok(!xml.includes('李四'));
});

test('缺少年级数据时保留空白列，女性使用对应项目', async () => {
  const record = makeRecord('2024', 75);
  record.testData = { run_800m: '3:45', situp_1min: 45 };
  record.scores = { run_800m: 80, situp_1min: 90 };
  const file = await buildPhysicalTestCard({
    student: { name: '王同学', studentIdNational: 'G789', gender: 'female' },
    records: [record],
  });
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file('word/document.xml')!.async('string');
  assert.match(xml, /800米跑/);
  assert.match(xml, /仰卧起坐/);
  assert.doesNotMatch(xml, /1000米跑/);
  assert.doesNotMatch(xml, /引体向上/);
  assert.match(xml, /3:45/);
  assert.ok(!xml.includes('4010'));
  assert.ok(!xml.includes('77.6'));
});
