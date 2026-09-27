<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import studentsAPI from '@/api/students'
import type { Student } from '@/types'

const emit = defineEmits<{
  select: [student: Student]
}>()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const results = ref<Student[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const errorMessage = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let requestVersion = 0

const clearTimer = () => {
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer)
    debounceTimer = undefined
  }
}

const resetSearchState = () => {
  results.value = []
  loading.value = false
  hasSearched.value = false
  errorMessage.value = ''
}

const searchStudents = async (keyword: string, version: number) => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await studentsAPI.getStudents({
      search: keyword,
      page: 1,
      pageSize: 8
    })

    if (version !== requestVersion) return

    results.value = response.data
    hasSearched.value = true
  } catch (error: unknown) {
    if (version !== requestVersion) return

    results.value = []
    hasSearched.value = true
    errorMessage.value = error instanceof Error && error.message
      ? error.message
      : '搜索学生失败，请稍后重试'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

watch(searchQuery, value => {
  clearTimer()
  requestVersion += 1
  results.value = []

  const keyword = value.trim()
  if (!keyword) {
    resetSearchState()
    return
  }

  const version = requestVersion
  loading.value = true
  hasSearched.value = false
  errorMessage.value = ''
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined
    searchStudents(keyword, version)
  }, 300)
})

const selectStudent = (student: Student) => {
  clearTimer()
  requestVersion += 1
  results.value = []
  loading.value = false
  hasSearched.value = false
  errorMessage.value = ''
  searchQuery.value = ''
  emit('select', student)
  void nextTick(() => searchInput.value?.focus())
}

const clearSearch = () => {
  searchQuery.value = ''
}

onBeforeUnmount(() => {
  clearTimer()
  requestVersion += 1
})
</script>

<template>
  <div class="space-y-2">
    <label for="student-history-search" class="block text-sm font-medium text-gray-700">
      查找学生
    </label>

    <div class="flex items-center gap-2">
      <MagnifyingGlassIcon
        class="h-5 w-5 shrink-0 text-gray-400"
        aria-hidden="true"
      />
      <input
        id="student-history-search"
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        autocomplete="off"
        placeholder="输入姓名、校内学号或全国学籍号"
        class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keydown.escape="clearSearch"
      />
      <span
        v-if="loading"
        class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        role="status"
        aria-label="正在搜索学生"
      />
      <button
        v-else-if="searchQuery"
        type="button"
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="清空搜索"
        aria-label="清空搜索"
        @click="clearSearch"
      >
        <XMarkIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <p class="sr-only" role="status" aria-live="polite">
      {{ loading ? '正在搜索学生' : hasSearched ? `找到 ${results.length} 名学生` : '' }}
    </p>

    <p v-if="errorMessage" class="text-sm text-red-600" role="alert">
      {{ errorMessage }}
    </p>

    <p
      v-else-if="hasSearched && !loading && results.length === 0"
      class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500"
    >
      未找到匹配的学生
    </p>

    <ul
      v-else-if="results.length"
      class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white"
      aria-label="学生搜索结果"
    >
      <li v-for="student in results" :key="student.id">
        <button
          type="button"
          class="flex w-full flex-col items-start justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:flex-row sm:items-center sm:gap-4"
          @click="selectStudent(student)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-gray-900">{{ student.name }}</span>
            <span class="mt-0.5 block truncate text-xs text-gray-500">
              校内学号：{{ student.studentIdSchool || '-' }}
            </span>
          </span>
          <span class="max-w-full truncate text-xs text-gray-500 sm:shrink-0">
            全国学籍号：{{ student.studentIdNational || '-' }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
