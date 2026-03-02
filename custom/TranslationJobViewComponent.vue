<template>
  <div class="flex flex-col w-full min-w-96">
    <p>{{ t('Total tokens will be used for translation:') }} <span class="font-bold"> {{ props.job.state?.totalTranslationTokenCost || 0 }}</span></p>
    <p>{{ t('Total translation token used:') }} <span class="font-bold"> {{ props.job.state?.totalUsedTokens || 0 }}</span></p>
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