import { QueryTypes } from 'sequelize';
import sequelize from '../database/connection.js';
import { FormTestItem, PhysicalTestForm, PhysicalTestRecord, StudentClassRelation } from '../models/index.js';
import type { PhysicalTestFormAttributes } from '../models/PhysicalTestForm.js';
import { calculateBatchScores, calculateGradeLevel, calculateTotalScore } from '../utils/scoreCalculator.js';
import { DEFAULT_COMPLETE_DATA_FORM_NAME, resolveCompleteDataImportYear } from '../utils/completeDataImportYear.js';

interface ImportRecordRow {
  id: number;
  student_id: number;
  class_id: number;
  cohort: string;
  gender: 'male' | 'female';
  submitted_by: string;
  test_data: Record<string, number | string>;
  total_score: string | number;
}

interface RelationRow {
  id: number;
  student_id: number;
  class_id: number;
  academic_year: string;
}

const args = process.argv.slice(2);
const formIdArg = args.find(arg => arg.startsWith('--form-id='));
const formId = Number(formIdArg?.slice('--form-id='.length));
const apply = args.includes('--apply');

if (!Number.isSafeInteger(formId) || formId <= 0 || args.some(arg => arg !== formIdArg && arg !== '--apply')) {
  console.error('用法：npx tsx src/scripts/repairCompleteDataImportYear.ts --form-id=数字 [--apply]');
  process.exitCode = 1;
} else {
  (sequelize as unknown as { options: { logging: boolean } }).options.logging = false;
  const transaction = await sequelize.transaction();
  let transactionEnded = false;
  try {
    const form = await PhysicalTestForm.findByPk(formId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!form || form.get('description') !== '通过完整数据导入创建的体质测试表单') {
      throw new Error('目标表单不存在，或不是完整数据导入创建的表单');
    }
    const originalForm = form.get({ plain: true }) as PhysicalTestFormAttributes;

    const records = await sequelize.query<ImportRecordRow>(
      `SELECT r.id, r.student_id, r.class_id, r.test_data, r.total_score,
              r.submitted_by, c.cohort, s.gender
         FROM physical_test_records r
         JOIN classes c ON c.id = r.class_id
         JOIN students s ON s.id = r.student_id
        WHERE r.form_id = :formId
        FOR UPDATE OF r`,
      { replacements: { formId }, type: QueryTypes.SELECT, transaction },
    );
    if (records.length === 0 || records.some(record => record.submitted_by !== '完整数据导入')) {
      throw new Error('目标表单没有记录，或包含非完整导入的记录');
    }

    const cohorts = [...new Set(records.map(record => record.cohort))].sort();
    const formCohorts = [...originalForm.participatingCohorts].sort();
    if (cohorts.join(',') !== formCohorts.join(',')) {
      throw new Error('表单参与级别与记录级别不一致，停止修复');
    }
    const resolved = resolveCompleteDataImportYear(cohorts, DEFAULT_COMPLETE_DATA_FORM_NAME);
    if (originalForm.academicYear === resolved.academicYear) {
      throw new Error('目标表单的学年已经正确，无需修复');
    }

    const oldName = `${originalForm.academicYear}学年${DEFAULT_COMPLETE_DATA_FORM_NAME}`;
    if (originalForm.formName !== oldName) {
      throw new Error('表单名称不是预期的默认名称，停止自动改名');
    }
    const duplicateForm = await PhysicalTestForm.findOne({
      where: { formName: resolved.formName, academicYear: resolved.academicYear },
      transaction,
    });
    if (duplicateForm) throw new Error('目标学年已有同名表单，停止修复');

    const relations = await sequelize.query<RelationRow>(
      `SELECT rel.id, rel.student_id, rel.class_id, rel.academic_year
         FROM student_class_relations rel
         JOIN physical_test_records r ON r.student_id = rel.student_id
        WHERE r.form_id = :formId
          AND rel.academic_year IN (:oldYear, :newYear)
        FOR UPDATE OF rel`,
      {
        replacements: { formId, oldYear: originalForm.academicYear, newYear: resolved.academicYear },
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    const relationByStudent = new Map(relations.map(relation => [relation.student_id, relation]));
    if (relations.length !== records.length || relationByStudent.size !== records.length ||
        records.some(record => {
          const relation = relationByStudent.get(record.student_id);
          return !relation || relation.academic_year !== originalForm.academicYear || relation.class_id !== record.class_id;
        })) {
      throw new Error('现有班级关系不完整或目标学年有冲突，停止修复');
    }

    const testItems = (await FormTestItem.findAll({ where: { formId }, transaction }))
      .map(item => item.get({ plain: true }));
    if (testItems.length === 0) throw new Error('表单缺少评分项目');

    const updates = records.map(record => {
      const grade = Number(resolved.academicYear) - Number(record.cohort) + 1;
      const applicableItems = testItems.filter(item => item.genderLimit == null || item.genderLimit === record.gender);
      const scores = calculateBatchScores(record.test_data, applicableItems, record.gender, grade);
      const totalScore = calculateTotalScore(scores, applicableItems);
      return { id: record.id, scores, totalScore, gradeLevel: calculateGradeLevel(totalScore) };
    });
    const oldFailures = records.filter(record => Number(record.total_score) < 60).length;
    const newFailures = updates.filter(record => record.totalScore < 60).length;
    const zeroScores = updates.filter(record => record.totalScore === 0).length;
    console.log(JSON.stringify({
      mode: apply ? '应用' : '预览',
      formId,
      oldAcademicYear: originalForm.academicYear,
      newAcademicYear: resolved.academicYear,
      cohorts,
      records: records.length,
      oldFailures,
      newFailures,
      zeroScores,
    }));
    if (zeroScores > 0) throw new Error('重算后仍有 0 分记录，停止修复');

    if (apply) {
      await form.update({ formName: resolved.formName, academicYear: resolved.academicYear }, { transaction });
      await StudentClassRelation.update(
        { academicYear: resolved.academicYear },
        { where: { id: relations.map(relation => relation.id) }, transaction },
      );
      for (const update of updates) {
        await PhysicalTestRecord.update(
          { scores: update.scores, totalScore: update.totalScore, gradeLevel: update.gradeLevel },
          { where: { id: update.id }, transaction },
        );
      }
      const verified = await sequelize.query<{ records: string; failures: string; zero_scores: string }>(
        `SELECT COUNT(*) AS records,
                COUNT(*) FILTER (WHERE total_score < 60) AS failures,
                COUNT(*) FILTER (WHERE total_score = 0) AS zero_scores
           FROM physical_test_records WHERE form_id = :formId`,
        { replacements: { formId }, type: QueryTypes.SELECT, transaction },
      );
      if (Number(verified[0]?.records) !== records.length ||
          Number(verified[0]?.failures) !== newFailures ||
          Number(verified[0]?.zero_scores) !== 0) {
        throw new Error('写入后的记录数或分数校验失败，事务已回滚');
      }
      const verifiedRelations = await StudentClassRelation.count({
        where: { id: relations.map(relation => relation.id), academicYear: resolved.academicYear },
        transaction,
      });
      if (verifiedRelations !== records.length ||
          form.get('academicYear') !== resolved.academicYear ||
          form.get('formName') !== resolved.formName) {
        throw new Error('写入后的学年或班级关系校验失败，事务已回滚');
      }
      await transaction.commit();
      transactionEnded = true;
      console.log('修复已提交');
    } else {
      await transaction.rollback();
      transactionEnded = true;
      console.log('仅预览，未写入数据库');
    }
  } catch (error) {
    if (!transactionEnded) await transaction.rollback();
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
