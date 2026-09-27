import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

export interface ImportProgressUpdate {
  totalRows: number;
  processedRows: number;
  fileProgresses?: ImportFileProgress[];
  currentFileKey?: string;
  currentFileName?: string;
  currentRow?: number;
  message?: string;
}

export interface ImportContext {
  isCanceled: () => boolean;
  reportProgress?: (progress: ImportProgressUpdate) => void;
}

export interface ImportFileProgress {
  fileKey: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  progress: number;
}

export type CompleteDataImportJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "canceling"
  | "canceled";

export interface CompleteDataImportJob {
  id: string;
  status: CompleteDataImportJobStatus;
  phase: "queued" | "importing" | "completed" | "failed" | "canceled";
  files: string[];
  fileProgresses: ImportFileProgress[];
  totalRows: number;
  processedRows: number;
  progress: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedSecondsRemaining: number | null;
  currentFileKey?: string;
  currentFileName?: string;
  currentRow?: number;
  message: string;
  cancelRequested: boolean;
  result?: unknown;
  error?: string;
}

interface CompleteDataImportJobSourceFile {
  fileKey: string;
  fileName: string;
  rawRows: readonly unknown[];
}

export class CompleteDataImportCanceledError extends Error {
  constructor() {
    super("完整数据导入已取消，已回滚本次导入");
    this.name = "CompleteDataImportCanceledError";
  }
}

export const completeDataImportJobs = new Map<
  string,
  CompleteDataImportJob
>();

export const toJobSnapshot = (job: CompleteDataImportJob) => {
  const { cancelRequested, ...snapshot } = job;
  return snapshot;
};

export const updateJobProgress = (
  job: CompleteDataImportJob,
  update: Partial<CompleteDataImportJob> & {
    processedRows?: number;
    totalRows?: number;
  },
) => {
  Object.assign(job, update);
  job.updatedAt = new Date().toISOString();

  if (job.totalRows > 0) {
    job.progress = Math.min(
      100,
      Math.round((job.processedRows / job.totalRows) * 100),
    );
  }

  if (
    job.status === "running" &&
    job.processedRows > 0 &&
    job.processedRows < job.totalRows
  ) {
    const elapsedSeconds = (Date.now() - Date.parse(job.startedAt)) / 1000;
    const rowsPerSecond =
      elapsedSeconds > 0 ? job.processedRows / elapsedSeconds : 0;
    job.estimatedSecondsRemaining =
      rowsPerSecond > 0
        ? Math.ceil((job.totalRows - job.processedRows) / rowsPerSecond)
        : null;
  } else {
    job.estimatedSecondsRemaining = null;
  }
};

export const createCompleteDataImportJob = (
  files: CompleteDataImportJobSourceFile[],
) => {
  const now = new Date().toISOString();
  const job: CompleteDataImportJob = {
    id: randomUUID(),
    status: "queued",
    phase: "queued",
    files: files.map((file) => file.fileName),
    fileProgresses: files.map((file) => ({
      fileKey: file.fileKey,
      fileName: file.fileName,
      totalRows: file.rawRows.length,
      processedRows: 0,
      progress: 0,
    })),
    totalRows: files.reduce((sum, file) => sum + file.rawRows.length, 0),
    processedRows: 0,
    progress: 0,
    startedAt: now,
    updatedAt: now,
    estimatedSecondsRemaining: null,
    message: "等待开始导入",
    cancelRequested: false,
  };

  completeDataImportJobs.set(job.id, job);
  return job;
};

export const scheduleJobCleanup = (jobId: string) => {
  setTimeout(
    () => {
      completeDataImportJobs.delete(jobId);
    },
    60 * 60 * 1000,
  ).unref();
};

export const createImportContext = (
  req: Request,
  res: Response,
): ImportContext => {
  let canceled = false;

  req.on("aborted", () => {
    canceled = true;
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      canceled = true;
    }
  });

  return {
    isCanceled: () => canceled || res.destroyed,
  };
};

export const throwIfImportCanceled = (context?: ImportContext) => {
  if (context?.isCanceled()) {
    throw new CompleteDataImportCanceledError();
  }
};

export const getImportJobStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const job = completeDataImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "导入任务不存在或已过期" });
    return;
  }

  res.json({ data: toJobSnapshot(job) });
};

export const cancelImportJob = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const job = completeDataImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "导入任务不存在或已过期" });
    return;
  }

  if (
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "canceled"
  ) {
    res.json({ data: toJobSnapshot(job) });
    return;
  }

  job.cancelRequested = true;
  updateJobProgress(job, {
    status: "canceling",
    message: "正在取消导入并回滚事务",
  });

  res.json({ data: toJobSnapshot(job) });
};
