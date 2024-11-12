<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import ProductTable from './components/ProductTable.vue';
import Pagination from './components/Pagination.vue';
import type { Product, ProductResponse } from './types';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

const urlInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const products = ref<Product[]>([]);
const currentPage = ref(1);
const rowsPerPage = 5;
const searchQuery = ref('');
const loading = ref(false);
const error = ref('');
const countdown = ref(0);
const totalUrls = ref(0);
const processedUrls = ref(0);
const currentRound = ref(0);
const totalRounds = ref(0);

const totalPages = computed(() =>
  Math.ceil(products.value.length / rowsPerPage)
);

// Load products from Firestore on mount
onMounted(async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    products.value = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as Product),
      id: doc.id,
    }));
  } catch (e) {
    console.error('Error loading products:', e);
    error.value = 'Error loading products from database';
  }
});

async function fetchProductData(url: string) {
  const apiUrl =
    'https://shopee-e-commerce-data.p.rapidapi.com/shopee/item_detail_by_url/v2';
  const options = {
    method: 'POST',
    headers: {
      'x-rapidapi-key': 'f63a25fcfcmshc0b92d126c388c0p1659b7jsn95974cb7bcc9',
      'x-rapidapi-host': 'shopee-e-commerce-data.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  };

  try {
    const response = await fetch(apiUrl, options);
    const result = (await response.json()) as ProductResponse;

    if (result?.data) {
      const data = result.data;
      return {
        item_id: data.item_id,
        product_url: data.product_url,
        title: data.title,
        discounted_price: data.price_info?.price
          ? parseFloat(data.price_info.price).toFixed(2)
          : 'ไม่มีข้อมูล',
        price_min: data.price_info?.price_min
          ? parseFloat(data.price_info.price_min).toFixed(2)
          : 'ไม่มีข้อมูล',
        price_max: data.price_info?.price_max
          ? parseFloat(data.price_info.price_max).toFixed(2)
          : 'ไม่มีข้อมูล',
        status: true,
      };
    }
    return {
      item_id: 'N/A',
      product_url: url,
      title: 'ไม่พบข้อมูล',
      discounted_price: 'ไม่มีข้อมูล',
      price_min: 'ไม่มีข้อมูล',
      price_max: 'ไม่มีข้อมูล',
      status: false,
    };
  } catch (err) {
    return {
      item_id: 'N/A',
      product_url: url,
      title: 'เกิดข้อผิดพลาด',
      discounted_price: 'ไม่มีข้อมูล',
      price_min: 'ไม่มีข้อมูล',
      price_max: 'ไม่มีข้อมูล',
      status: false,
    };
  }
}

async function startCountdown() {
  countdown.value = 3.5;
  const interval = setInterval(() => {
    countdown.value = Math.max(
      0,
      parseFloat((countdown.value - 0.1).toFixed(1))
    );
    if (countdown.value === 0) {
      clearInterval(interval);
    }
  }, 100);
  await new Promise((resolve) => setTimeout(resolve, 3500));
}

async function handleSubmit() {
  if (!urlInput.value) return;

  loading.value = true;
  error.value = '';

  const urls = urlInput.value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  totalUrls.value = urls.length;
  processedUrls.value = 0;
  currentRound.value = 0;
  totalRounds.value = urls.length;

  for (const url of urls) {
    try {
      await startCountdown();
      const product = await fetchProductData(url);
      await addDoc(collection(db, 'products'), product);
      products.value.push(product);
      processedUrls.value++;
      currentRound.value++;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
    }
  }

  loading.value = false;
  urlInput.value = '';
  totalUrls.value = 0;
  processedUrls.value = 0;
  currentRound.value = 0;
  totalRounds.value = 0;
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const file = target.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    const text = e.target?.result as string;
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const urlColumnIndex = headers.findIndex(
      (header) => header.toLowerCase().trim() === 'url'
    );

    if (urlColumnIndex === -1) {
      error.value = 'ไม่พบคอลัมน์ URL ในไฟล์ CSV';
      return;
    }

    loading.value = true;
    error.value = '';

    const validUrls = lines
      .slice(1)
      .map((line) => line.split(',')[urlColumnIndex]?.trim())
      .filter(Boolean);

    totalUrls.value = validUrls.length;
    processedUrls.value = 0;
    currentRound.value = 0;
    totalRounds.value = validUrls.length;

    for (const url of validUrls) {
      try {
        await startCountdown();
        const product = await fetchProductData(url);
        await addDoc(collection(db, 'products'), product);
        products.value.push(product);
        processedUrls.value++;
        currentRound.value++;
      } catch (err) {
        console.error(`Error processing URL: ${url}`, err);
      }
    }

    loading.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    totalUrls.value = 0;
    processedUrls.value = 0;
    currentRound.value = 0;
    totalRounds.value = 0;
  };

  reader.readAsText(file);
}

async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    const index = products.value.findIndex((p) => p.item_id === id);
    if (index > -1) {
      products.value.splice(index, 1);
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    error.value = 'Error deleting product';
  }
}

function exportToCSV() {
  const headers = [
    'ลำดับ',
    'Item ID',
    'URL',
    'ชื่อสินค้า',
    'ราคาส่วนลด',
    'ราคาต่ำสุด',
    'ราคาสูงสุด',
    'สถานะ',
  ];
  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';

  products.value.forEach((product, index) => {
    const row = [
      index + 1,
      product.item_id,
      product.product_url,
      product.title,
      product.discounted_price,
      product.price_min,
      product.price_max,
      product.status ? 'Passed' : 'Failed',
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'shopee_product_data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 w-full">
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-xl overflow-hidden">
        <div class="divide-y divide-gray-200">
          <!-- Header Section -->
          <div class="px-4 sm:px-6 lg:px-8 py-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
              ดึงข้อมูลสินค้า E-Commerce จาก Shopee
            </h1>
          </div>

          <!-- Main Content Section -->
          <div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <!-- Progress Information -->
            <div v-if="loading" class="mb-4">
              <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2"
              >
                <div class="flex flex-col gap-1">
                  <span class="text-sm sm:text-base"
                    >กำลังดึงข้อมูล URL ที่ {{ processedUrls + 1 }} จาก
                    {{ totalUrls }}</span
                  >
                  <span class="text-sm text-gray-600"
                    >รอบที่ {{ currentRound }} จาก {{ totalRounds }} รอบ</span
                  >
                </div>
                <span class="text-sm sm:text-base font-medium text-indigo-600"
                  >รอ {{ countdown.toFixed(1) }} วินาที</span
                >
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  :style="{ width: `${(processedUrls / totalUrls) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- URL Input Form -->
            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label
                  for="urlInput"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  ใส่ URL สินค้า (แยกแต่ละลิงก์ด้วย ,)
                </label>
                <textarea
                  id="urlInput"
                  v-model="urlInput"
                  rows="3"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  :disabled="loading"
                ></textarea>
              </div>

              <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div class="flex flex-wrap gap-4">
                  <button
                    type="submit"
                    :disabled="loading"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {{ loading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูล' }}
                  </button>

                  <label
                    class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    Import CSV
                    <input
                      type="file"
                      ref="fileInput"
                      accept=".csv"
                      class="hidden"
                      @change="handleFileUpload"
                      :disabled="loading"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  @click="exportToCSV"
                  :disabled="!products.length"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Export to CSV
                </button>
              </div>
            </form>

            <!-- Error Message -->
            <div v-if="error" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
                </div>
              </div>
            </div>

            <!-- Search Input -->
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                v-model="searchQuery"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ค้นหาในตาราง..."
              />
            </div>

            <!-- Product Table -->
            <ProductTable
              :products="products"
              :current-page="currentPage"
              :rows-per-page="rowsPerPage"
              :search-query="searchQuery"
              @delete="deleteProduct"
            />

            <!-- Pagination -->
            <Pagination
              v-if="products.length > 0"
              v-model:current-page="currentPage"
              :total-pages="totalPages"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
