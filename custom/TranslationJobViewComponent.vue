
<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 mt-5">
      <div class="flex items-center space-x-1">
        <span class="text-gray-300">{{ t('Total tokens will be used for translation:') }}</span>
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ new Number(props.job.state?.totalTranslationTokenCost).toLocaleString() || 0 }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <span class="text-gray-300">{{ t('Total translation token used:') }}</span>
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ new Number(props.job.state?.totalUsedTokens).toLocaleString() || 0 }}</span>
      </div>
    </div> 
    <div class="grid grid-cols-3 gap-2">
      <div class="bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 transition-all px-2 py-2 rounded-md border max-w-64 w-full flex items-center gap-2" v-for="(task, index) in translationTasks" :key="index">
        {{  task.state?.taskName }} to
          <span class="flag-icon"
            :class="`flag-icon-${getCountryCodeFromLangCode(task.state?.lang)}`"
          ></span>
          <component 
            :is="getCustomComponent({file: '@@/plugins/BackgroundJobsPlugin/StateToIcon.vue'})" 
            :status="task.status"
          />
      </div>
    </div>
</template>


<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onMounted, onUnmounted, ref } from 'vue';
import websocket from '@/websocket';
import { getCountryCodeFromLangCode } from './langCommon';
import { getCustomComponent } from '@/utils';

const { t } = useI18n();

const translationTasks = ref<{state: Record<string, any>, status: string}[]>([]);
const currentPaginationWindow = ref({limit: 25, offset: 0});

const props = defineProps<{
  meta: any;
  getJobTasks: (limit?: number, offset?: number) => Promise<
  {tasks: {state: Record<string, any>, status: string}[], total: number}>;
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
    customComponent?: any; 
  };
}>();

onMounted(async () => {
  const {tasks, total} = await props.getJobTasks(currentPaginationWindow.value.limit, currentPaginationWindow.value.offset);
  translationTasks.value = tasks;

  websocket.subscribe(`/background-jobs-task-update/${props.job.id}`, (data: { taskIndex: number, status?: string, state?: Record<string, any> }) => {
    if ( data.taskIndex <= currentPaginationWindow.value.offset + currentPaginationWindow.value.limit && data.taskIndex >= currentPaginationWindow.value.offset ) {
      if (data.state) {
        translationTasks.value[data.taskIndex].state = data.state;
      }
      if (data.status) {
        translationTasks.value[data.taskIndex].status = data.status;
      }
    }
  });


});

onUnmounted(() => {
  websocket.unsubscribe(`/background-jobs-task-update/${props.job.id}`);
});


</script>