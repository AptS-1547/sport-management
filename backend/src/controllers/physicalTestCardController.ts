import { Request, Response } from 'express';
import PhysicalTestRecord from '../models/PhysicalTestRecord.js';
import PhysicalTestForm from '../models/PhysicalTestForm.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { buildPhysicalTestCard, type PhysicalTestCardData } from '../utils/physicalTestCardExport.js';

export const exportPhysicalTestCard = async (req: Request, res: Response): Promise<void> => {
  const studentId = Number(req.params.studentId);
  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    res.status(400).json({ success: false, message: '学生编号无效' });
    return;
  }

  try {
    const student = await Student.findByPk(studentId, {
      attributes: ['name', 'studentIdNational', 'gender', 'birthDate', 'ethnicityCode'],
    });
    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }
    const records = await PhysicalTestRecord.findAll({
      where: { studentId },
      include: [
        { model: Class, as: 'class', attributes: ['cohort', 'className'] },
        { model: PhysicalTestForm, as: 'form', attributes: ['academicYear', 'testDate'] },
      ],
      order: [['id', 'ASC']],
    });
    if (records.length === 0) {
      res.status(404).json({ success: false, message: '暂无体测记录可导出' });
      return;
    }

    const data = records.map(record => record.get({ plain: true }) as unknown as PhysicalTestCardData['records'][number] & {
      class: PhysicalTestCardData['records'][number]['classInfo'] | null;
    });
    if (data.some(record => !record.class || !record.form)) {
      res.status(422).json({ success: false, message: '体测记录关联信息不完整' });
      return;
    }

    const file = await buildPhysicalTestCard({
      student: student.get({ plain: true }) as PhysicalTestCardData['student'],
      records: data.map(record => ({
        classInfo: record.class!,
        form: record.form,
        testData: record.testData || {},
        scores: record.scores || {},
        totalScore: record.totalScore,
        gradeLevel: record.gradeLevel,
      })),
    });
    const fileName = `${student.get('name')}_体测登记卡.docx`.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="physical-test-${studentId}.docx"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(file);
  } catch (error) {
    console.error('导出体测登记卡失败:', error);
    const unsupportedGrade = (error as Error).message.includes('没有可导出的高中体测记录');
    res.status(unsupportedGrade ? 422 : 500).json({ success: false, message: unsupportedGrade ? (error as Error).message : '导出体测登记卡失败' });
  }
};
