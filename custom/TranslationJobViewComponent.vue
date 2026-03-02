
<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
      <div class="flex items-center space-x-1">
        <span class=" text-gray-500">{{ t('Total tokens will be used for translation:') }}</span>
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ new Number(props.job.state?.totalTranslationTokenCost).toLocaleString() || 0 }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <span class=" text-gray-500">{{ t('Total translation token used:') }}</span>
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ new Number(props.job.state?.totalUsedTokens).toLocaleString() || 0 }}</span>
      </div>
    </div>
</template>


<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const props = defineProps<{
  meta: any;
  getJobTasks: (limit?: number, offset?: number) => Promise<{state: Record<string, any>, status: string}[]>;
  job: {
    id: string;
    name: string;
    status: 'IN_PROGRESS' | 'DONE' | 'DONE_WITH_ERRORS' | 'CANCELLED';
    state: {
      totalTranslationTokenCost: number;
      totalUsedTokens: number;
    };
    progress: number; // 0 to 100
    createdAt: Date;
    customComponent?: AdminForthComponentDeclarationFull; 
  };
}>();

</script>