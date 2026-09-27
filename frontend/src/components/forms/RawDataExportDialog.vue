<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import formsAPI, { type RawDataExportGrade } from '@/api/forms'
import { useToast } from '@/composables/useToast'
import type { PhysicalTestForm } from '@/types'

const props = defineProps<{
  modelValue: boolean
  form: PhysicalTestForm | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const grades = ref<RawDataExportGrade[]>([])
const selectedGrades = ref<number[]>([])
const loading = ref(false)
const exporting = ref(false)
const toast = useToast()
const gradeNames: Record<number, string> = { 1: '高一', 2: '高二', 3: '高三' }
let loadVersion = 0

watch([() => props.modelValue, () => props.form?.id], async ([isOpen, formId]) => {
  const version = ++loadVersion
  grades.value = []
  selectedGrades.value = []
  if (!isOpen || !formId) return

  loading.value = true
  try {
    const options = await formsAPI.getRawDataExportGrades(formId)
    if (version !== loadVersion) return
    grades.value = options
    selectedGrades.value = options.map((grade) => grade.gradeLevel)
  } catch (error: any) {
    if (version === loadVersion) toast.error(error.message || '获取可导出年级失败')
  } finally {
    if (version === loadVersion) loading.value = false
  }
})

const download = async () => {
  const form = props.form
  if (!form || !selectedGrades.value.length || exporting.value) return

  const chosen = [...selectedGrades.value].sort((left, right) => left - right)
  exporting.value = true
  try {
    const file = await formsAPI.exportRawData(form.id, chosen)
    const fileName = chosen.length === 1
      ? `${form.formName}_${gradeNames[chosen[0]!]}_原始数据.xlsx`
      : `${form.formName}_原始数据.zip`
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.replace(/[<>:"/\\|?*]/g, '_')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('原始数据导出成功')
    visible.value = false
  } catch (error: any) {
    toast.error(error.message || '原始数据导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <Modal v-model="visible" title="导出原始数据" size="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-600">{{ form?.formName }}</p>

      <div v-if="loading" class="py-6 text-center text-sm text-gray-500" role="status">
        正在读取年级…
      </div>
      <p v-else-if="grades.length === 0" class="py-6 text-center text-sm text-gray-500">
        该表单暂无原始数据
      </p>
      <div v-else class="divide-y divide-gray-200 border-y border-gray-200">
        <label
          v-for="grade in grades"
          :key="grade.gradeLevel"
          class="flex cursor-pointer items-center gap-3 py-3"
        >
          <input
            v-model="selectedGrades"
            type="checkbox"
            :value="grade.gradeLevel"
            class="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
          />
          <span class="flex-1 text-sm font-medium text-gray-900">
            {{ gradeNames[grade.gradeLevel] }} · {{ grade.cohort }}级
          </span>
          <span class="text-sm tabular-nums text-gray-500">{{ grade.recordCount }} 人</span>
        </label>
      </div>

      <div class="flex items-center justify-between gap-4">
        <p class="text-sm text-gray-600">
          {{ selectedGrades.length > 1 ? '多选将打包为 ZIP，每个年级一个 Excel 文件' : '单选下载一个 Excel 文件' }}
        </p>
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || exporting || selectedGrades.length === 0"
          title="下载所选年级原始数据"
          aria-label="下载所选年级原始数据"
          @click="download"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </Modal>
</template>
