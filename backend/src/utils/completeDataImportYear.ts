export interface CompleteDataImportYear {
  formName: string;
  academicYear: string;
}

export const DEFAULT_COMPLETE_DATA_FORM_NAME = '完整体质测试数据';

const defaultYearFormName = (year: number): string =>
  `${year}学年${DEFAULT_COMPLETE_DATA_FORM_NAME}`;

/** 只在所有入学级都能落入高中三年制时确定测试学年。 */
export const resolveCompleteDataImportYear = (
  cohorts: string[],
  formName: string,
  requestedAcademicYear?: string,
): CompleteDataImportYear => {
  const uniqueCohorts = [...new Set(cohorts)];
  if (uniqueCohorts.length === 0 || uniqueCohorts.some(cohort => !/^(?:19|20)\d{2}$/.test(cohort))) {
    throw new Error('未识别到有效的入学级，请检查文件中的班级名称');
  }

  const years = uniqueCohorts.map(Number);
  const firstPossibleYear = Math.max(...years);
  const lastPossibleYear = Math.min(...years.map(year => year + 2));
  if (firstPossibleYear > lastPossibleYear) {
    throw new Error('文件中的入学级无法对应同一个高中测试学年，请分学年导入');
  }

  const normalizedName = formName.trim() || DEFAULT_COMPLETE_DATA_FORM_NAME;
  const yearInName = normalizedName.match(/((?:19|20)\d{2})(?:\s*[-—~至]\s*(?:19|20)?\d{2})?\s*学年/)?.[1];
  const legacyYear = requestedAcademicYear?.trim();
  const isDefaultName = normalizedName === DEFAULT_COMPLETE_DATA_FORM_NAME ||
    /^(?:19|20)\d{2}学年完整体质测试数据$/.test(normalizedName);

  let academicYear: number;
  if (firstPossibleYear === lastPossibleYear) {
    academicYear = firstPossibleYear;
    if (yearInName && Number(yearInName) !== academicYear && !isDefaultName) {
      throw new Error(`表单名称中的 ${yearInName} 学年与文件识别的 ${academicYear} 学年不一致`);
    }
  } else {
    const hintedYear = yearInName || legacyYear;
    if (!hintedYear || !/^(?:19|20)\d{2}$/.test(hintedYear)) {
      throw new Error(`这些入学级可能属于 ${firstPossibleYear}—${lastPossibleYear} 学年，请在导入表单名称中写明实际测试学年`);
    }
    academicYear = Number(hintedYear);
    if (academicYear < firstPossibleYear || academicYear > lastPossibleYear) {
      throw new Error(`表单名称中的 ${academicYear} 学年与文件入学级不匹配，可用学年为 ${firstPossibleYear}—${lastPossibleYear}`);
    }
  }

  return {
    formName: isDefaultName ? defaultYearFormName(academicYear) : normalizedName,
    academicYear: String(academicYear),
  };
};
