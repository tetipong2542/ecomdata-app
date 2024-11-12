<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Product } from '../types';
import { TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  products: Product[];
  currentPage: number;
  rowsPerPage: number;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

const sortField = ref<keyof Product | ''>('');
const sortDirection = ref<'asc' | 'desc'>('asc');

const sortedAndFilteredProducts = computed(() => {
  let result = props.products.filter(product => 
    Object.values(product).some(val => 
      val.toString().toLowerCase().includes(props.searchQuery.toLowerCase())
    )
  );

  if (sortField.value) {
    result = [...result].sort((a, b) => {
      const aValue = sortField.value ? String(a[sortField.value]) : '0';
      const bValue = sortField.value ? String(b[sortField.value]) : '0';
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortDirection.value === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }

  return result;
});

const displayedProducts = computed(() => {
  const start = (props.currentPage - 1) * props.rowsPerPage;
  const end = start + props.rowsPerPage;
  return sortedAndFilteredProducts.value.slice(start, end);
});

function toggleSort(field: keyof Product) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
}

function getSortIcon(field: string) {
  if (sortField.value !== field) return null;
  return sortDirection.value === 'asc' ? ChevronUpIcon : ChevronDownIcon;
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ลำดับ
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Item ID
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            URL
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ชื่อสินค้า
          </th>
          <th 
            @click="toggleSort('discounted_price')"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          >
            <div class="flex items-center">
              ราคาส่วนลด
              <component 
                :is="getSortIcon('discounted_price')" 
                v-if="sortField === 'discounted_price'"
                class="h-4 w-4 ml-1"
              />
            </div>
          </th>
          <th 
            @click="toggleSort('price_min')"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          >
            <div class="flex items-center">
              ราคาต่ำสุด
              <component 
                :is="getSortIcon('price_min')" 
                v-if="sortField === 'price_min'"
                class="h-4 w-4 ml-1"
              />
            </div>
          </th>
          <th 
            @click="toggleSort('price_max')"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          >
            <div class="flex items-center">
              ราคาสูงสุด
              <component 
                :is="getSortIcon('price_max')" 
                v-if="sortField === 'price_max'"
                class="h-4 w-4 ml-1"
              />
            </div>
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            สถานะ
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(product, index) in displayedProducts" :key="product.item_id"
            class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ (props.currentPage - 1) * props.rowsPerPage + index + 1 }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.item_id }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
            <a :href="product.product_url" target="_blank" class="hover:underline">Link</a>
          </td>
          <td class="px-6 py-4 text-sm text-gray-900">{{ product.title }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.discounted_price }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.price_min }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ product.price_max }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                product.status
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              ]"
            >
              {{ product.status ? 'Passed' : 'Failed' }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button @click="emit('delete', product.item_id)"
                    class="text-red-600 hover:text-red-900">
              <TrashIcon class="h-5 w-5" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>