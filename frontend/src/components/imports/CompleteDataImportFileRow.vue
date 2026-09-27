<template>
  <section class="border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[150px_1.1fr_1.3fr_160px] lg:items-start">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700"
          >
            {{ index + 1 }}
          </span>
          <div class="min-w-0">
            <h4 class="text-sm font-semibold text-gray-900">导入文件</h4>
            <p class="mt-0.5 text-xs text-gray-500">{{ detectedCohortsText }}</p>
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <label class="block text-sm font-medium text-gray-700">Excel 文档</label>
          <input
            :id="fileInputId"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            :disabled="disabled"
            @change="event => emit('fileChange', row.id, event)"
          />
          <label
            :for="fileInputId"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-colors"
            :class="disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'cursor-pointer bg-gray-100 hover:bg-gray-200'"
            :aria-disabled="disabled"
            aria-label="选择 Excel 文件"
            title="选择 Excel 文件"
          >
            <ArrowUpTrayIcon class="h-5 w-5" />
          </label>
        </div>

        <div class="border-l-2 pl-3" :class="row.file ? 'border-blue-400' : 'border-gray-200'">
          <template v-if="row.file">
            <div class="truncate text-sm font-medium text-gray-900">{{ row.file.name }}</div>
            <div class="mt-1 text-xs text-gray-500">{{ formatFileSize(row.file.size) }}</div>
          </template>
          <div v-else class="text-sm text-gray-500">未选择文件</div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <label class="block text-sm font-medium text-gray-700">工作表</label>
          <span class="text-xs text-gray-500">{{ sheetHint }}</span>
        </div>

        <select
          v-if="previewFile"
          :value="row.rawSheetName"
          :disabled="disabled"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': disabled }"
          @change="handleSheetChange"
        >
          <option
            v-for="sheetName in previewFile.sheetNames"
            :key="`${row.id}-raw-${sheetName}`"
            :value="sheetName"
          >
            {{ sheetName }}
          </option>
        </select>

        <select
          v-else
          disabled
          class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
        >
          <option>{{ row.file ? '请先预检查读取工作表' : '请选择 Excel 文件' }}</option>
        </select>

        <div v-if="previewFile" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>{{ previewFile.totalRows }} 行</span>
          <span>{{ previewFile.studentCount }} 名学生</span>
          <span>{{ previewFile.classCount }} 个班级</span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 lg:justify-end">
        <div class="text-right">
          <span class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium" :class="statusClass">
            {{ progress.status }}
          </span>
          <div class="mt-1 text-xs text-gray-500">{{ progressLabel }}</div>
        </div>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors"
          :class="canRemove && !disabled
            ? 'hover:bg-red-50 hover:text-red-600'
            : 'cursor-not-allowed bg-gray-50 opacity-40'"
          :disabled="!canRemove || disabled"
          aria-label="删除导入文件行"
          title="删除导入文件行"
          @click="emit('remove', row.id)"
        >
          <TrashIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="progressBarClass"
        :style="{ width: `${progress.progress}%` }"
      />
    </div>

    <div v-if="previewFile?.issues.length" class="mt-3 border-l-2 border-red-300 bg-red-50 px-3 py-2">
      <div class="mb-1 text-sm font-medium text-red-800">问题明细</div>
      <ul class="space-y-1 text-sm text-red-700">
        <li
          v-for="issue in previewFile.issues.slice(0, 4)"
          :key="`${row.id}-${issue.row}-${issue.message}`"
        >
          第 {{ issue.row }} 行：{{ issue.message }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { CompleteDataImportPreviewFile } from '@/api/completeDataImport'

type FileStatus = '待选择文件' | '待预检' | '待导入' | '上传中' | '解析中' | '导入中' | '导入成功' | '取消导入' | '失败'

interface ImportFileRow {
  id: string
  file: File | null
  rawSheetName: string
}

interface FileProgressItem {
  progress: number
  status: FileStatus
}

const props = defineProps<{
  row: ImportFileRow
  index: number
  disabled: boolean
  canRemove: boolean
  previewFile: CompleteDataImportPreviewFile | null
  progress: FileProgressItem
  progressLabel: string
  progressBarClass: string
  statusClass: string
  sheetHint: string
  formatFileSize: (size: number) => string
}>()

const emit = defineEmits<{
  fileChange: [rowId: string, event: Event]
  remove: [rowId: string]
  updateSheet: [rowId: string, sheetName: string]
}>()

const fileInputId = computed(() => `file-${props.row.id}`)

const detectedCohortsText = computed(() => {
  if (!props.previewFile) return '入学年份：待识别'
  if (props.previewFile.detectedCohorts.length === 0) return '入学年份：未识别'
  return `入学年份：${props.previewFile.detectedCohorts.map(cohort => `${cohort}级`).join('、')}`
})

const handleSheetChange = (event: Event) => {
  emit('updateSheet', props.row.id, (event.target as HTMLSelectElement).value)
}
</script>
