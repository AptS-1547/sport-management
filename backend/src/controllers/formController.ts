import { Request, Response } from 'express';
import PhysicalTestForm from '../models/PhysicalTestForm.js';
import FormTestItem from '../models/FormTestItem.js';
import { defaultTestItems } from '../config/defaultTestItems.js';
import sequelize from '../database/connection.js';
import { validateCohorts } from '../utils/cohortHelper.js';
import { Class, PhysicalTestRecord, Student } from '../models/index.js';
import {
  buildSelectedRawDataExport,
  getRawExportGrade,
  RawDataExportSelectionError,
  type RawDataExportRecord,
} from '../utils/rawDataExport.js';

/**
 * 获取所有表单（支持分页和状态筛选）
 */
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 10,
      status,
      sortBy = 'created_at',
      order = 'DESC',
    } = req.query;

    const limit = parseInt(pageSize as string);
    const offset = (parseInt(page as string) - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const { count, rows } = await PhysicalTestForm.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy as string, order as string]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page as string),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('获取表单列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取表单列表失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 获取表单详情（包含测试项目）
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await PhysicalTestForm.findByPk(id, {
      include: [
        {
          model: FormTestItem,
          as: 'items',
        },
      ],
    });

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error('获取表单详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取表单详情失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 创建表单（同时创建默认国标测试项目）
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const {
      formName,
      academicYear,
      participatingCohorts,
      testDate,
      startTime,
      endTime,
      description,
    } = req.body;

    // 验证必填字段
    if (!formName || !academicYear) {
      res.status(400).json({
        success: false,
        error: '表单名称和学年为必填项',
      });
      return;
    }

    // 验证参与年级
    const cohortError = validateCohorts(participatingCohorts);
    if (cohortError) {
      res.status(400).json({
        success: false,
        error: cohortError,
      });
      return;
    }

    // 处理日期字段 - 将 'Invalid date' 或空字符串转换为 null
    const processedTestDate = testDate && testDate !== 'Invalid date' ? testDate : null;
    const processedStartTime = startTime && startTime !== 'Invalid date' ? startTime : null;
    const processedEndTime = endTime && endTime !== 'Invalid date' ? endTime : null;

    // 创建表单
    const form = await PhysicalTestForm.create(
      {
        formName,
        academicYear,
        participatingCohorts,
        testDate: processedTestDate,
        startTime: processedStartTime,
        endTime: processedEndTime,
        description,
        status: 'draft',
        createdBy: req.user?.id,
      },
      { transaction }
    );

    // 创建默认测试项目
    const testItems = defaultTestItems.map((item) => ({
      formId: (form.get('id') as number),
      itemCode: item.itemCode,
      itemName: item.itemName,
      itemUnit: item.itemUnit,
      genderLimit: item.genderLimit,
      isRequired: item.isRequired,
      sortOrder: item.sortOrder,
      weight: item.weight || 0,
      scoringStandard: item.scoringStandard,
      validationRules: item.validationRules,
      isCalculated: item.isCalculated || false,
    }));

    await FormTestItem.bulkCreate(testItems, { transaction });

    await transaction.commit();

    // 查询完整的表单数据（包含测试项目）
    const formWithItems = await PhysicalTestForm.findByPk(form.get('id') as number, {
      include: [
        {
          model: FormTestItem,
          as: 'items',
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: formWithItems,
      message: '表单创建成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建表单失败:', error);
    res.status(500).json({
      success: false,
      error: '创建表单失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 更新表单基本信息
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      formName,
      academicYear,
      participatingCohorts,
      testDate,
      startTime,
      endTime,
      description,
    } = req.body;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    // 检查表单状态：已发布或已关闭的表单不能编辑
    if (form.get('status') !== 'draft') {
      res.status(400).json({
        success: false,
        error: '只有草稿状态的表单可以编辑',
      });
      return;
    }

    // 如果提供了 participatingCohorts,验证其合法性
    if (participatingCohorts !== undefined) {
      const cohortError = validateCohorts(participatingCohorts);
      if (cohortError) {
        res.status(400).json({
          success: false,
          error: cohortError,
        });
        return;
      }
    }

    // 处理日期字段 - 将 'Invalid date' 或空字符串转换为 null
    const processedTestDate = testDate !== undefined
      ? (testDate && testDate !== 'Invalid date' ? testDate : null)
      : form.get('testDate');
    const processedStartTime = startTime !== undefined
      ? (startTime && startTime !== 'Invalid date' ? startTime : null)
      : form.get('startTime');
    const processedEndTime = endTime !== undefined
      ? (endTime && endTime !== 'Invalid date' ? endTime : null)
      : form.get('endTime');

    await form.update({
      formName: formName || form.get('formName'),
      academicYear: academicYear || form.get('academicYear'),
      participatingCohorts: participatingCohorts || form.get('participatingCohorts'),
      testDate: processedTestDate,
      startTime: processedStartTime,
      endTime: processedEndTime,
      description: description !== undefined ? description : form.get('description'),
    });

    res.json({
      success: true,
      data: form,
      message: '表单更新成功',
    });
  } catch (error) {
    console.error('更新表单失败:', error);
    res.status(500).json({
      success: false,
      error: '更新表单失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 删除表单
 */
export const deleteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    // 检查表单状态：只有草稿状态的表单可以删除
    if (form.get('status') !== 'draft') {
      res.status(400).json({
        success: false,
        error: '只有草稿状态的表单可以删除',
      });
      return;
    }

    // 删除表单（关联的测试项目会级联删除）
    await form.destroy();

    res.json({
      success: true,
      message: '表单删除成功',
    });
  } catch (error) {
    console.error('删除表单失败:', error);
    res.status(500).json({
      success: false,
      error: '删除表单失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 发布表单（draft → published）
 */
export const publish = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    if (form.get('status') !== 'draft') {
      res.status(400).json({
        success: false,
        error: '只有草稿状态的表单可以发布',
      });
      return;
    }

    await form.update({ status: 'published' });

    res.json({
      success: true,
      data: form,
      message: '表单发布成功',
    });
  } catch (error) {
    console.error('发布表单失败:', error);
    res.status(500).json({
      success: false,
      error: '发布表单失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 关闭表单（published → closed）
 */
export const close = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    if (form.get('status') !== 'published') {
      res.status(400).json({
        success: false,
        error: '只有已发布的表单可以关闭',
      });
      return;
    }

    await form.update({ status: 'closed' });

    res.json({
      success: true,
      data: form,
      message: '表单关闭成功',
    });
  } catch (error) {
    console.error('关闭表单失败:', error);
    res.status(500).json({
      success: false,
      error: '关闭表单失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 获取表单的测试项目
 */
export const getTestItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    const testItems = await FormTestItem.findAll({
      where: { formId: id },
      order: [['sortOrder', 'ASC']],
    });

    res.json({
      success: true,
      data: testItems,
    });
  } catch (error) {
    console.error('获取测试项目失败:', error);
    res.status(500).json({
      success: false,
      error: '获取测试项目失败',
      message: (error as Error).message,
    });
  }
};

/**
 * 按示例上报表结构导出表单内的原始测试数据。
 */
export const getRawDataExportGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const form = await PhysicalTestForm.findByPk(req.params.id);
    if (!form) {
      res.status(404).json({ success: false, error: '表单不存在' });
      return;
    }

    const records = await PhysicalTestRecord.findAll({
      where: { formId: form.get('id') as number },
      attributes: ['id'],
      include: [{ model: Class, as: 'class', attributes: ['cohort'] }],
    });
    const groups = new Map<number, { gradeLevel: number; cohort: string; recordCount: number }>();
    for (const record of records) {
      const data = record.get({ plain: true }) as unknown as { class: { cohort: string } | null };
      if (!data.class) throw new Error(`记录 ${record.get('id')} 的班级信息缺失`);
      const gradeLevel = getRawExportGrade(data.class.cohort, form.get('academicYear') as string);
      const group = groups.get(gradeLevel);
      if (group) group.recordCount++;
      else groups.set(gradeLevel, { gradeLevel, cohort: data.class.cohort, recordCount: 1 });
    }

    res.json({
      success: true,
      data: [...groups.values()].sort((left, right) => left.gradeLevel - right.gradeLevel),
    });
  } catch (error) {
    console.error('获取可导出年级失败:', error);
    const isGradeMismatch = (error as Error).message.includes('无法导出年级编号');
    res.status(isGradeMismatch ? 422 : 500).json({
      success: false,
      error: isGradeMismatch ? (error as Error).message : '获取可导出年级失败',
    });
  }
};

export const exportRawData = async (req: Request, res: Response): Promise<void> => {
  try {
    const selected = req.query.grades;
    if (typeof selected !== 'string' || !/^[1-3](,[1-3]){0,2}$/.test(selected)) {
      res.status(400).json({ success: false, error: '请至少选择一个有效年级' });
      return;
    }
    const selectedGrades = [...new Set(selected.split(',').map(Number))].sort();
    const form = await PhysicalTestForm.findByPk(req.params.id);
    if (!form) {
      res.status(404).json({ success: false, error: '表单不存在' });
      return;
    }

    const records = await PhysicalTestRecord.findAll({
      where: { formId: form.get('id') as number },
      include: [
        { model: Student, as: 'student', attributes: ['studentIdNational', 'ethnicityCode', 'name', 'gender', 'birthDate'] },
        { model: Class, as: 'class', attributes: ['cohort', 'className'] },
      ],
      order: [['id', 'ASC']],
    });

    const exportRecords = records.map((record) => {
      const data = record.get({ plain: true }) as unknown as {
        student: RawDataExportRecord['student'] | null;
        class: RawDataExportRecord['classInfo'] | null;
        testData: RawDataExportRecord['testData'];
      };
      if (!data.student || !data.class) {
        throw new Error(`记录 ${record.get('id')} 的学生或班级信息缺失`);
      }
      return { student: data.student, classInfo: data.class, testData: data.testData };
    });

    const { file, fileName, contentType } = await buildSelectedRawDataExport(
      exportRecords,
      form.get('academicYear') as string,
      selectedGrades,
      form.get('formName') as string,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="raw-data-${form.get('id')}.${selectedGrades.length === 1 ? 'xlsx' : 'zip'}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(file);
  } catch (error) {
    console.error('导出原始数据失败:', error);
    const isGradeMismatch = (error as Error).message.includes('无法导出年级编号');
    const status = error instanceof RawDataExportSelectionError ? 400 : isGradeMismatch ? 422 : 500;
    res.status(status).json({
      success: false,
      error: status !== 500 ? (error as Error).message : '导出原始数据失败',
    });
  }
};

/**
 * 更新测试项目配置
 */
export const updateTestItems = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { items } = req.body;

    const form = await PhysicalTestForm.findByPk(id);

    if (!form) {
      res.status(404).json({
        success: false,
        error: '表单不存在',
      });
      return;
    }

    // 检查表单状态：已发布或已关闭的表单不能编辑测试项目
    if (form.get('status') !== 'draft') {
      res.status(400).json({
        success: false,
        error: '只有草稿状态的表单可以编辑测试项目',
      });
      return;
    }

    if (!items || !Array.isArray(items)) {
      res.status(400).json({
        success: false,
        error: '测试项目数据格式不正确',
      });
      return;
    }

    // 更新每个测试项目
    for (const item of items) {
      await FormTestItem.update(
        {
          itemName: item.itemName,
          itemUnit: item.itemUnit,
          genderLimit: item.genderLimit,
          isRequired: item.isRequired,
          sortOrder: item.sortOrder,
          scoringStandard: item.scoringStandard,
        },
        {
          where: { itemCode: item.itemCode, formId: id },
          transaction,
        }
      );
    }

    await transaction.commit();

    // 查询更新后的测试项目
    const updatedItems = await FormTestItem.findAll({
      where: { formId: id },
      order: [['sortOrder', 'ASC']],
    });

    res.json({
      success: true,
      data: updatedItems,
      message: '测试项目更新成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新测试项目失败:', error);
    res.status(500).json({
      success: false,
      error: '更新测试项目失败',
      message: (error as Error).message,
    });
  }
};
