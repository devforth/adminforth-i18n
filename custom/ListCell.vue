<template>
  <div class="text-sm text-gray-900 dark:text-white min-w-32">
    {{ limitedText }}
  </div>
</template>

<script setup lang="ts">
import { computed  } from 'vue';
import { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common';


const limitedText = computed(() => {
  const text = props.record[props.column.name];
  return text?.length > 50 ? text.slice(0, 50) + '...' : text;
});

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

</script>