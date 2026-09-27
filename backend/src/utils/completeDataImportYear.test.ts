import assert from 'node:assert/strict';
import { resolveCompleteDataImportYear } from './completeDataImportYear.js';

assert.deepEqual(
  resolveCompleteDataImportYear(['2024', '2023', '2022'], '完整体质测试数据'),
  { formName: '2024学年完整体质测试数据', academicYear: '2024' },
);
assert.deepEqual(
  resolveCompleteDataImportYear(['2024', '2023', '2022'], '2026学年完整体质测试数据', '2026'),
  { formName: '2024学年完整体质测试数据', academicYear: '2024' },
);
assert.deepEqual(
  resolveCompleteDataImportYear(['2023', '2024'], '2024学年完整体质测试数据'),
  { formName: '2024学年完整体质测试数据', academicYear: '2024' },
);
assert.deepEqual(
  resolveCompleteDataImportYear(['2023', '2024'], '2024-2025学年体测'),
  { formName: '2024-2025学年体测', academicYear: '2024' },
);
assert.throws(
  () => resolveCompleteDataImportYear(['2023', '2024'], '完整体质测试数据'),
  /请在导入表单名称中写明实际测试学年/,
);
assert.throws(
  () => resolveCompleteDataImportYear(['2022', '2025'], '完整体质测试数据'),
  /无法对应同一个高中测试学年/,
);
assert.throws(
  () => resolveCompleteDataImportYear(['2024', '2023', '2022'], '2026学年体测数据'),
  /不一致/,
);
