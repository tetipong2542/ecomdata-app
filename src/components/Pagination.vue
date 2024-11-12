<script setup lang="ts">
defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex justify-between sm:hidden">
      <button
        :disabled="currentPage === 1"
        @click="emit('update:currentPage', currentPage - 1)"
        class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
        Previous
      </button>
      <button
        :disabled="currentPage === totalPages"
        @click="emit('update:currentPage', currentPage + 1)"
        class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
        Next
      </button>
    </div>
    <div class="hidden sm:flex sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          หน้า <span class="font-medium">{{ currentPage }}</span> จาก
          <span class="font-medium">{{ totalPages }}</span>
        </p>
      </div>
      <div>
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="emit('update:currentPage', page)"
            :class="[
              page === currentPage
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
            ]">
            {{ page }}
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>