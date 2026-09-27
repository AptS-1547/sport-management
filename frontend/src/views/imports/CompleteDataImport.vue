<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-900">完整数据导入</h1>
    </div>

    <Card title="导入配置">
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">导入表单名称</label>
        <input v-model="importOptions.formName" type="text" :disabled="isImportLocked"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
          :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }"
          @input="resetPreviewState" />
        <p v-if="previewResult" class="mt-2 text-sm text-gray-600">
          识别测试学年：{{ previewResult.form.academicYear }} 学年
        </p>
      </div>
    </Card>

    <Card>
      <template #header>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-900">导入文件</h3>
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-blue-600 transition-colors"
              :class="canAddFileRow && !isImportLocked
                ? 'bg-blue-50 hover:bg-blue-100'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 opacity-60'"
              :disabled="!canAddFileRow || isImportLocked"
              aria-label="添加导入文件行"
              title="添加导入文件行"
              @click="addImportFileRow"
            >
              <PlusIcon class="h-5 w-5" />
            </button>
          </div>
          <div class="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800 lg:max-w-xl">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-blue-900">{{ progressStatusText }}</div>
                <div class="mt-1 truncate text-sm">{{ currentProgressText }}</div>
              </div>
              <div class="shrink-0 text-lg font-bold text-blue-900">{{ uploadProgress }}%</div>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>预计剩余：{{ importTimeSummaryText }}</span>
              <span v-if="importJob">已处理：{{ importJob.processedRows }} / {{ importJob.totalRows }} 行</span>
              <span v-else>已上传：{{ formatFileSize(uploadedBytes) }} / {{ formatFileSize(totalSelectedBytes) }}</span>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
              <div class="h-full rounded-full bg-blue-600 transition-all duration-500"
                :style="{ width: `${uploadProgress}%` }" />
            </div>
          </div>
        </div>
      </template>

      <div>
        <CompleteDataImportFileRow
          v-for="(row, index) in importFileRows"
          :key="row.id"
          :row="row"
          :index="index"
          :disabled="isImportLocked"
          :can-remove="importFileRows.length > 1"
          :preview-file="previewFileForRow(row)"
          :progress="rowProgress(row)"
          :progress-label="rowProgressLabel(row)"
          :progress-bar-class="rowProgressBarClass(row)"
          :status-class="rowStatusClass(rowProgress(row).status)"
          :sheet-hint="sheetHint(row)"
          :format-file-size="formatFileSize"
          @file-change="handleFileRowChange"
          @remove="removeImportFileRow"
          @update-sheet="updateRowSheet"
        />
      </div>
    </Card>

    <Card>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:flex-1">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ selectedRows.length }}</div>
            <div class="mt-1 text-sm text-gray-600">文件</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ detectedCohorts.length }}</div>
            <div class="mt-1 text-sm text-gray-600">识别入学年</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ previewResult?.totals.rows || 0 }}</div>
            <div class="mt-1 text-sm text-gray-600">数据行</div>
          </div>
          <div class="rounded-lg border p-4"
            :class="previewResult && previewResult.totals.issues > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'">
            <div class="text-2xl font-bold"
              :class="previewResult && previewResult.totals.issues > 0 ? 'text-red-700' : 'text-green-700'">
              {{ previewResult?.totals.issues || 0 }}
            </div>
            <div class="mt-1 text-sm"
              :class="previewResult && previewResult.totals.issues > 0 ? 'text-red-700' : 'text-green-700'">
              问题
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" :loading="previewing"
            :disabled="selectedFiles.length === 0 || importing || importCompleted" @click="handlePreviewImport">
            预检查
          </Button>
          <Button type="button" variant="primary" :loading="importing" :disabled="primaryImportDisabled"
            @click="handlePrimaryImportAction">
            {{ primaryImportButtonText }}
          </Button>
          <Button v-if="busy" type="button" variant="danger" @click="cancelActiveRequest">
            {{ cancelButtonText }}
          </Button>
          <Button v-if="selectedFiles.length > 0 || previewResult || importResult || failedResult" type="button"
            variant="ghost" :disabled="busy" @click="clearImportState">
            清空
          </Button>
        </div>
      </div>
    </Card>

    <Card v-if="importResult || failedResult">
      <div v-if="importResult" class="rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="flex items-start">
          <CheckCircleIcon class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-green-900">完整数据导入完成</h3>
            <p class="mt-1 text-sm text-green-800">
              已处理 {{ importResult.rows }} 行，新增学生 {{ importResult.studentsCreated }} 人，更新学生
              {{ importResult.studentsUpdated }} 人，新增记录 {{ importResult.recordsCreated }} 条，更新记录
              {{ importResult.recordsUpdated }} 条。
            </p>
          </div>
        </div>
      </div>

      <div v-if="failedResult" class="rounded-lg border border-red-200 bg-red-50 p-4">
        <div class="flex items-start">
          <ExclamationTriangleIcon class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-900">导入已回滚</h3>
            <p class="mt-1 text-sm text-red-800">
              共 {{ failedResult.failed }} 行失败。以下显示前 {{ Math.min(failedResult.errors.length, 50) }} 条错误。
            </p>
            <div class="mt-3 max-h-72 overflow-y-auto rounded-md border border-red-200 bg-white">
              <div v-for="error in failedResult.errors.slice(0, 50)"
                :key="`${error.fileName}-${error.row}-${error.message}`"
                class="border-b border-red-100 px-3 py-2 text-sm text-red-800 last:border-b-0">
                {{ error.fileName }} 第 {{ error.row }} 行：{{ error.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { completeDataImportAPI } from '@/api'
import type {
  CompleteDataImportJob,
  CompleteDataImportPreview,
  CompleteDataImportPreviewFile,
  CompleteDataImportResult
} from '@/api/completeDataImport'
import { useToast } from '@/composables/useToast'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import CompleteDataImportFileRow from '@/components/imports/CompleteDataImportFileRow.vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

defineOptions({ name: 'CompleteDataImport' })

type FileStatus = '待选择文件' | '待预检' | '待导入' | '上传中' | '解析中' | '导入中' | '导入成功' | '取消导入' | '失败'
type ImportOperation = 'preview' | 'import' | null

interface ImportFileRow {
  id: string
  file: File | null
  rawSheetName: string
}

interface FileProgressItem {
  uploaded: number
  remaining: number
  progress: number
  status: FileStatus
}

const toast = useToast()
const maxImportFiles = 10
let nextFileRowId = 1

const createImportFileRow = (): ImportFileRow => ({
  id: `import-file-${nextFileRowId++}`,
  file: null,
  rawSheetName: ''
})

const importOptions = reactive({
  formName: '完整体质测试数据'
})

const importFileRows = ref<ImportFileRow[]>([createImportFileRow()])

const previewing = ref(false)
const importing = ref(false)
const uploadProgress = ref(0)
const uploadedBytes = ref(0)
const uploadTotalBytes = ref(0)
const remainingSeconds = ref<number | null>(null)
const operationStartedAt = ref<number | null>(null)
const processingOnServer = ref(false)
const cancelRequested = ref(false)
const activeRequestController = ref<AbortController | null>(null)
const activeOperation = ref<ImportOperation>(null)
const progressTitle = ref('')
const progressDescription = ref('')
const previewResult = ref<CompleteDataImportPreview | null>(null)
const importResult = ref<CompleteDataImportResult | null>(null)
const failedResult = ref<CompleteDataImportResult | null>(null)
const importJob = ref<CompleteDataImportJob | null>(null)
const importJobPoller = ref<number | null>(null)

const busy = computed(() => previewing.value || importing.value)
const isImportLocked = computed(() => importing.value || previewing.value)
const importCompleted = computed(() => importJob.value?.status === 'completed')
const importCanceled = computed(() => importJob.value?.status === 'canceled' || cancelRequested.value)

const primaryImportButtonText = computed(() => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') return '重新导入'
  return '正式导入'
})

const primaryImportDisabled = computed(() => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') return false
  return selectedFiles.value.length === 0 || !previewResult.value || previewResult.value.totals.issues > 0 || previewing.value
})

const selectedRows = computed(() => {
  return importFileRows.value.filter(row => row.file)
})

const selectedFiles = computed(() => {
  return selectedRows.value.map(row => row.file).filter((file): file is File => !!file)
})

const detectedCohorts = computed(() => {
  const cohorts = new Set(previewResult.value?.files.flatMap(file => file.detectedCohorts) || [])
  return Array.from(cohorts).sort((left, right) => Number(right) - Number(left))
})

const canAddFileRow = computed(() => importFileRows.value.length < maxImportFiles)

const totalSelectedBytes = computed(() => {
  return selectedFiles.value.reduce((sum, file) => sum + file.size, 0)
})

const currentRow = computed(() => {
  if (selectedRows.value.length === 0) return null

  const uploading = selectedRows.value.find(row => rowProgress(row).status === '上传中')
  if (uploading) return uploading

  if (processingOnServer.value) {
    return selectedRows.value[0]
  }

  return selectedRows.value.find(row => rowProgress(row).status === '待导入') || selectedRows.value[0]
})

const currentProgressText = computed(() => {
  if (!currentRow.value) {
    return '未选择文件'
  }

  if (importJob.value && importJob.value.status !== 'queued') {
    return `${importJob.value.message}：${importJob.value.processedRows}/${importJob.value.totalRows} 行`
  }

  if (processingOnServer.value) {
    if (activeOperation.value === 'import' && importJob.value) {
      const file = importJob.value.currentFileName || '当前文件'
      const row = importJob.value.currentRow ? ` 第 ${importJob.value.currentRow} 行` : ''
      return `${file}${row}：${importJob.value.processedRows}/${importJob.value.totalRows} 行`
    }

    return `服务端正在预检查 ${selectedFiles.value.length} 个文件`
  }

  return `${currentRow.value.file?.name || '当前文件'} ${formatFileSize(uploadedBytes.value)} / ${formatFileSize(totalSelectedBytes.value)}`
})

const remainingTimeText = computed(() => {
  if (cancelRequested.value) return '已取消'
  if (!busy.value && selectedFiles.value.length === 0) return '未开始'
  if (processingOnServer.value) {
    if (activeOperation.value === 'import') {
      return importJob.value?.estimatedSecondsRemaining !== null && importJob.value?.estimatedSecondsRemaining !== undefined
        ? formatDuration(importJob.value.estimatedSecondsRemaining)
        : '计算中'
    }
    return '服务端预检查中'
  }
  if (remainingSeconds.value === null) return busy.value ? '计算中' : '未开始'
  if (remainingSeconds.value <= 1) return '少于 1 秒'

  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = Math.round(remainingSeconds.value % 60)
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
})

const estimatedRemainingText = computed(() => {
  if (importJob.value) {
    if (importJob.value.status === 'completed') return '0 秒'
    if (importJob.value.status === 'failed') return '已失败'
    if (importJob.value.status === 'canceled') return '已取消'
    if (importJob.value.estimatedSecondsRemaining !== null) {
      return formatDuration(importJob.value.estimatedSecondsRemaining)
    }
    return importJob.value.processedRows > 0 ? '计算中' : '等待首批数据'
  }

  return remainingTimeText.value
})

const elapsedTimeText = computed(() => {
  if (importJob.value) {
    const startedAt = Date.parse(importJob.value.startedAt)
    const endedAt = importJob.value.completedAt ? Date.parse(importJob.value.completedAt) : Date.now()

    if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt >= startedAt) {
      return formatDuration(Math.floor((endedAt - startedAt) / 1000))
    }
  }

  if (busy.value && operationStartedAt.value) {
    return formatDuration(Math.floor((Date.now() - operationStartedAt.value) / 1000))
  }

  return '0 秒'
})

const importTimeSummaryText = computed(() => {
  return `${estimatedRemainingText.value} / ${elapsedTimeText.value}`
})

const progressStatusText = computed(() => {
  if (cancelRequested.value) return '已取消'
  if (importJob.value?.status === 'completed') return '导入完成'
  if (importJob.value?.status === 'failed') return '导入失败'
  if (processingOnServer.value) {
    if (activeOperation.value === 'import' && importJob.value) {
      return `服务端导入中 ${importJob.value.progress}%`
    }
    return '服务端预检查中'
  }
  if (busy.value) return `上传中，预计剩余 ${remainingTimeText.value}`
  if (selectedFiles.value.length > 0) return previewResult.value ? '已预检查' : '待预检查'
  return '未开始'
})

const cancelButtonText = computed(() => {
  if (previewing.value) return '取消预检查'
  if (importing.value) return '取消导入'
  return '取消'
})

const getRowFileKey = (row: ImportFileRow, index: number) => {
  return row.file ? `${index}:${row.file.name}:${row.file.size}` : row.id
}

const importRequestOptions = computed(() => ({
  formName: importOptions.formName,
  sheetSelections: selectedRows.value.map((row, index) => ({
    fileKey: getRowFileKey(row, index),
    fileName: row.file!.name,
    rawSheetName: row.rawSheetName
  }))
}))

const addImportFileRow = () => {
  if (isImportLocked.value || !canAddFileRow.value) return
  importFileRows.value.push(createImportFileRow())
  resetPreviewState()
}

const removeImportFileRow = (rowId: string) => {
  if (isImportLocked.value || importFileRows.value.length <= 1) return
  importFileRows.value = importFileRows.value.filter(row => row.id !== rowId)
  resetPreviewState()
}

const updateRowSheet = (rowId: string, sheetName: string) => {
  const row = importFileRows.value.find(item => item.id === rowId)
  if (!row || row.rawSheetName === sheetName) return

  row.rawSheetName = sheetName
  resetPreviewState()
}

const handleFileRowChange = (rowId: string, event: Event) => {
  if (isImportLocked.value) return

  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  const row = importFileRows.value.find(item => item.id === rowId)

  if (row) {
    row.file = file
    row.rawSheetName = ''
  }

  resetPreviewState()
}

const resetPreviewState = () => {
  stopImportJobPolling()
  previewResult.value = null
  importResult.value = null
  failedResult.value = null
  importJob.value = null
  uploadedBytes.value = 0
  uploadTotalBytes.value = 0
  uploadProgress.value = 0
  remainingSeconds.value = null
  operationStartedAt.value = null
  processingOnServer.value = false
  cancelRequested.value = false
  activeOperation.value = null
}

const rowProgress = (row: ImportFileRow): FileProgressItem => {
  if (!row.file) {
    return {
      uploaded: 0,
      remaining: 0,
      progress: 0,
      status: '待选择文件'
    }
  }

  if (importJob.value) {
    const fileProgresses = importJob.value.fileProgresses
    const rowIndex = selectedRows.value.findIndex(item => item.id === row.id)
    const rowFileKey = getRowFileKey(row, rowIndex)
    const fileProgress = fileProgresses.find(file => file.fileKey === rowFileKey)
    const progress = fileProgress?.progress || 0
    const fileIndex = fileProgresses.findIndex(file => file.fileKey === rowFileKey)
    const currentFileIndex = importJob.value.currentFileKey
      ? fileProgresses.findIndex(file => file.fileKey === importJob.value?.currentFileKey)
      : -1
    let status: FileStatus = progress >= 100 ? '导入成功' : '待导入'

    if (importJob.value.status === 'completed') {
      status = '导入成功'
    } else if (importJob.value.status === 'canceled' || importJob.value.status === 'canceling') {
      status = '取消导入'
    } else if (importJob.value.status === 'failed') {
      status = '失败'
    } else if (currentFileIndex >= 0 && fileIndex >= 0) {
      if (fileIndex < currentFileIndex) {
        status = progress >= 100 ? '导入成功' : '导入中'
      } else if (fileIndex === currentFileIndex) {
        status = '导入中'
      } else {
        status = '待导入'
      }
    } else if (progress > 0) {
      status = '导入中'
    }

    return {
      uploaded: row.file.size,
      remaining: 0,
      progress,
      status
    }
  }

  const rowIndex = selectedRows.value.findIndex(item => item.id === row.id)
  const bytesBeforeRow = selectedRows.value
    .slice(0, Math.max(rowIndex, 0))
    .reduce((sum, item) => sum + (item.file?.size || 0), 0)
  const uploaded = Math.min(row.file.size, Math.max(0, uploadedBytes.value - bytesBeforeRow))
  const remaining = Math.max(row.file.size - uploaded, 0)
  const progress = row.file.size > 0 ? Math.round((uploaded / row.file.size) * 100) : 0
  let status: FileStatus = previewFileForRow(row) ? '待导入' : '待预检'

  if (cancelRequested.value) {
    status = '取消导入'
  } else if (busy.value) {
    if (processingOnServer.value && progress === 100) {
      status = activeOperation.value === 'import' ? '导入中' : '解析中'
    } else if (uploadedBytes.value < bytesBeforeRow) {
      status = '待导入'
    } else if (progress < 100) {
      status = '上传中'
    } else {
      status = previewing.value ? '解析中' : '待导入'
    }
  }

  return {
    uploaded,
    remaining,
    progress,
    status
  }
}

const previewFileForRow = (row: ImportFileRow): CompleteDataImportPreviewFile | null => {
  if (!row.file || !previewResult.value) return null
  const rowIndex = selectedRows.value.findIndex(item => item.id === row.id)
  return previewResult.value.files.find(file => file.fileKey === getRowFileKey(row, rowIndex)) || null
}

const applyDetectedSheets = () => {
  if (!previewResult.value) return

  importFileRows.value.forEach(row => {
    const previewFile = previewFileForRow(row)
    if (!previewFile) return

    row.rawSheetName = previewFile.rawSheetName
  })
}

const formatFileSize = (size: number) => {
  if (size <= 0) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const formatDuration = (secondsValue: number) => {
  if (secondsValue <= 1) return '少于 1 秒'

  const minutes = Math.floor(secondsValue / 60)
  const seconds = Math.round(secondsValue % 60)
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

const rowStatusClass = (status: FileStatus) => {
  if (status === '上传中' || status === '解析中' || status === '导入中') return 'bg-blue-50 text-blue-700'
  if (status === '导入成功') return importCompleted.value ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
  if (status === '待预检' || status === '待导入') return 'bg-yellow-50 text-yellow-700'
  if (status === '取消导入' || status === '失败') return 'bg-red-50 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const rowProgressBarClass = (row: ImportFileRow) => {
  const status = rowProgress(row).status

  if (status === '上传中' || status === '解析中' || status === '导入中') return 'bg-blue-500'
  if (status === '导入成功') return importCompleted.value ? 'bg-gray-400' : 'bg-green-500'
  if (status === '待预检' || status === '待导入') return 'bg-yellow-500'
  if (status === '取消导入' || status === '失败') return 'bg-red-500'
  return 'bg-gray-300'
}

const rowProgressLabel = (row: ImportFileRow) => {
  const status = rowProgress(row).status
  if (status === '导入中') return '上传完成，导入中'
  if (status === '解析中') return '上传完成，解析中'
  if (status === '导入成功') return '导入成功'
  if (status === '取消导入') return '取消导入'
  if (status === '失败') return '导入失败'
  return status
}

const sheetHint = (row: ImportFileRow) => {
  if (previewFileForRow(row)) return '可选择'
  if (row.file) return '预检查后可选'
  return '未开始'
}

const validateImportForm = () => {
  if (selectedFiles.value.length === 0) {
    toast.error('请至少选择一个完整数据 Excel 文件')
    return false
  }

  if (!importOptions.formName.trim()) {
    toast.error('请输入导入表单名称')
    return false
  }

  return true
}

const resetProgress = (title: string, description: string) => {
  uploadProgress.value = 0
  uploadedBytes.value = 0
  uploadTotalBytes.value = totalSelectedBytes.value
  remainingSeconds.value = null
  operationStartedAt.value = Date.now()
  processingOnServer.value = false
  cancelRequested.value = false
  progressTitle.value = title
  progressDescription.value = description
}

const updateUploadProgress = (payload: {
  progress: number
  loaded: number
  total: number
  rate?: number
  estimated?: number
}) => {
  uploadProgress.value = payload.progress
  uploadedBytes.value = Math.min(payload.loaded, totalSelectedBytes.value)
  uploadTotalBytes.value = payload.total

  if (payload.estimated !== undefined) {
    remainingSeconds.value = payload.estimated
  } else if (payload.rate && payload.rate > 0) {
    remainingSeconds.value = Math.max((payload.total - payload.loaded) / payload.rate, 0)
  }

  if (payload.progress >= 100) {
    uploadedBytes.value = totalSelectedBytes.value
    processingOnServer.value = true
    progressDescription.value = activeOperation.value === 'import'
      ? '文件已上传，服务端正在写入完整数据。此阶段不会再产生上传字节进度，请保持页面打开。'
      : '文件已上传，服务端正在读取工作表并执行预检查，请保持页面打开。'
  }
}

const extractFailedResult = (error: any) => {
  const data = error?.responseData?.data
  if (data?.errors) {
    failedResult.value = data
  }
}

const stopImportJobPolling = () => {
  if (importJobPoller.value !== null) {
    window.clearInterval(importJobPoller.value)
    importJobPoller.value = null
  }
}

const applyImportJob = (job: CompleteDataImportJob) => {
  importJob.value = job
  uploadProgress.value = job.progress
  processingOnServer.value = job.status === 'queued' || job.status === 'running' || job.status === 'canceling'
  progressTitle.value = job.status === 'canceling' ? '正在取消导入' : '正在导入'
  progressDescription.value = job.message

  if (job.status === 'completed') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    uploadProgress.value = 100
    importResult.value = job.result || null
    toast.success('完整数据导入完成')
  } else if (job.status === 'failed') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    failedResult.value = job.result || null
    toast.error(job.error || '完整数据导入失败')
  } else if (job.status === 'canceled') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    cancelRequested.value = true
    toast.info('已取消导入，事务已回滚')
  }
}

const pollImportJob = async (jobId: string) => {
  try {
    const job = await completeDataImportAPI.getImportJob(jobId)
    applyImportJob(job)
  } catch (error: any) {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    toast.error(error.message || '获取导入进度失败')
  }
}

const startImportJobPolling = (jobId: string) => {
  stopImportJobPolling()
  importJobPoller.value = window.setInterval(() => {
    void pollImportJob(jobId)
  }, 1000)
}

const isRequestCanceled = (error: any) => {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
}

const cancelActiveRequest = async () => {
  cancelRequested.value = true
  progressTitle.value = '已取消'
  progressDescription.value = '已请求取消，后端会在当前处理点停止并回滚本次导入。'

  if (importJob.value && processingOnServer.value) {
    progressTitle.value = '正在取消导入'
    progressDescription.value = '正在通知后端取消导入并回滚事务。'
    try {
      const job = await completeDataImportAPI.cancelImportJob(importJob.value.id)
      applyImportJob(job)
    } catch (error: any) {
      toast.error(error.message || '取消导入失败')
    }
    return
  }

  if (activeRequestController.value) {
    processingOnServer.value = false
    activeRequestController.value.abort()
  }
}

const handlePreviewImport = async () => {
  if (!validateImportForm()) return

  previewing.value = true
  activeOperation.value = 'preview'
  importResult.value = null
  failedResult.value = null
  const controller = new AbortController()
  activeRequestController.value = controller
  resetProgress('正在预检查', '预检查需要先上传 Excel 文件，服务器读取工作簿后会返回可选择的表格。')

  try {
    previewResult.value = await completeDataImportAPI.previewPhysicalTests(
      selectedFiles.value,
      importRequestOptions.value,
      {
        signal: controller.signal,
        onUploadProgress: updateUploadProgress
      }
    )
    importOptions.formName = previewResult.value.form.formName
    applyDetectedSheets()

    processingOnServer.value = false
    if (previewResult.value.totals.issues > 0) {
      toast.warning(`预检查完成，发现 ${previewResult.value.totals.issues} 个问题`)
    } else {
      toast.success('预检查通过，可以正式导入')
    }
  } catch (error: any) {
    if (isRequestCanceled(error)) {
      toast.info('已取消预检查')
      return
    }
    extractFailedResult(error)
    toast.error(error.message || '完整数据预检查失败')
  } finally {
    previewing.value = false
    if (activeOperation.value === 'preview') {
      activeOperation.value = null
    }
    if (activeRequestController.value === controller) {
      activeRequestController.value = null
    }
  }
}

const handleImportCompleteData = async () => {
  if (!validateImportForm()) return

  importing.value = true
  activeOperation.value = 'import'
  importResult.value = null
  failedResult.value = null
  importJob.value = null
  const controller = new AbortController()
  activeRequestController.value = controller
  resetProgress('正在导入', '正在上传文件，上传完成后服务器会写入完整数据。')
  let jobStarted = false

  try {
    const job = await completeDataImportAPI.startImportPhysicalTests(
      selectedFiles.value,
      importRequestOptions.value,
      {
        signal: controller.signal,
        onUploadProgress: updateUploadProgress
      }
    )
    jobStarted = true
    uploadedBytes.value = totalSelectedBytes.value
    uploadProgress.value = job.progress
    processingOnServer.value = true
    applyImportJob(job)
    startImportJobPolling(job.id)
  } catch (error: any) {
    if (isRequestCanceled(error)) {
      toast.info('已取消导入')
      return
    }
    extractFailedResult(error)
    toast.error(error.message || '完整数据导入失败')
  } finally {
    if (!jobStarted) {
      importing.value = false
      processingOnServer.value = false
    }
    if (!jobStarted && activeOperation.value === 'import') {
      activeOperation.value = null
    }
    if (activeRequestController.value === controller) {
      activeRequestController.value = null
    }
  }
}

const handlePrimaryImportAction = () => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') {
    importJob.value = null
    importResult.value = null
    failedResult.value = null
    cancelRequested.value = false
    uploadProgress.value = 0
    uploadedBytes.value = 0
    operationStartedAt.value = null
    processingOnServer.value = false
    activeOperation.value = null
    void handleImportCompleteData()
    return
  }

  void handleImportCompleteData()
}

const clearImportState = () => {
  importFileRows.value = [createImportFileRow()]
  resetPreviewState()
}

const cancelRunningImportJobOnUnmount = () => {
  const job = importJob.value
  if (!job || (job.status !== 'queued' && job.status !== 'running')) return

  void completeDataImportAPI.cancelImportJob(job.id).catch(() => undefined)
}

onUnmounted(() => {
  cancelRunningImportJobOnUnmount()
  stopImportJobPolling()
  activeRequestController.value?.abort()
  activeRequestController.value = null
  activeOperation.value = null
})
</script>
