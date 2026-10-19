
<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 mt-5">
      <div class="flex items-center space-x-1">
        <span class="text-lightInputIconColor dark:text-darkInputIconColor">{{ t('Total tokens will be used for translation:') }}</span>
        <span class="text-lg font-semibold tabular-nums text-lightInputText dark:text-darkInputText">{{ new Number(props.job.state?.totalTranslationTokenCost).toLocaleString() || 0 }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <span class="text-lightInputIconColor dark:text-darkInputIconColor">{{ t('Total translation token used:') }}</span>
        <span class="text-lg font-semibold tabular-nums text-lightInputText dark:text-darkInputText">{{ new Number(props.job.state?.totalUsedTokens).toLocaleString() || 0 }}</span>
      </div>
    </div> 
    <div class="grid grid-cols-3 gap-2">
      <div 
        v-if="!isFetchingTasks"
        class="bg-lightSecondaryDarken border-lightTableBorder dark:bg-darkSecondaryLighten dark:border-darkTableBorder px-2 py-2 rounded-default border max-w-64 w-full flex items-center justify-between gap-2" 
        v-for="(task, index) in translationTasks" 
        :key="index"
      >
        <span class="truncate">
          {{  task.state?.taskName }} to
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <CountryFlag size="sm" :countryCode="task.state?.countryCode" />
          <component
            :is="getCustomComponent({file: '@@/plugins/BackgroundJobsPlugin/StateToIcon.vue'})"
            :status="task.status"
            :error="task.state?.error"
          />
        </div>
      </div>
      <div v-else class="col-span-3 flex items-center justify-center">
        <Spinner class="w-10 h-10" />
      </div>
    </div>
    <div v-if="page > 0 || hasNextPage" class="flex items-center justify-center gap-3 mt-4">
      <Button
        variant="secondary"
        iconOnly
        :disabled="page === 0 || isFetchingTasks"
        @click="loadPage(page - 1)"
      >
        <IconChevronLeft />
      </Button>
      <span class="text-sm tabular-nums text-lightInputIconColor dark:text-darkInputIconColor">
        {{ t('Page {page}', { page: page + 1 }) }}
      </span>
      <Button
        variant="secondary"
        iconOnly
        :disabled="!hasNextPage || isFetchingTasks"
        @click="loadPage(page + 1)"
      >
        <IconChevronRight />
      </Button>
    </div>
</template>


<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted, onUnmounted, ref } from 'vue';
import websocket from '@/websocket';
import { getCustomComponent } from '@/utils';
import { Button, CountryFlag, Spinner } from '@/afcl';
import { IconChevronLeft, IconChevronRight } from '@iconify-prerendered/vue-lucide';

const { t } = useI18n();

const translationTasks = ref<{state: Record<string, any>, status: string}[]>([]);
const isFetchingTasks = ref(false);
const page = ref(0);
const hasNextPage = ref(false);
const PAGE_SIZE = 24;
const MAX_RETRIES = 10; // Maximum number of retries for fetching tasks
const RETRY_DELAY_MS = 2000; // 2 seconds

const currentOffset = computed(() => page.value * PAGE_SIZE);

const props = defineProps<{
  meta: any;
  getJobTasks: (limit?: number, offset?: number, fieldsToReturn?: string[]) => Promise<
  {state: Record<string, any>, status: string}[]>;
  tasksStorageLost?: boolean;
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

async function loadPage(targetPage: number) {
  if (targetPage < 0 || isFetchingTasks.value) {
    return;
  }
  isFetchingTasks.value = true;
  const retries = targetPage === 0 ? MAX_RETRIES : 1;
  try {
    for (let retry = 0; retry < retries; retry++) {
      try {
        const res = await props.getJobTasks(PAGE_SIZE, targetPage * PAGE_SIZE, ['lang', 'countryCode', 'error', 'taskName', 'failedToTranslate']);
        if (res && res.length > 0) {
          translationTasks.value = res;
          page.value = targetPage;
          hasNextPage.value = res.length === PAGE_SIZE;
          return;
        }
      } catch (error) {
        console.error('Failed to fetch translation tasks, retrying...', error);
      }
      // the task storage of the job was deleted, tasks will never come back, so retrying only keeps the
      // spinner on screen for nothing
      if (props.tasksStorageLost) {
        break;
      }
      if (retry < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    // nothing came back: either there are no tasks at all, or we went past the last page
    if (targetPage === 0) {
      translationTasks.value = [];
      page.value = 0;
    }
    hasNextPage.value = false;
  } finally {
    isFetchingTasks.value = false;
  }
}

let unsubscribeFromTaskUpdates: () => void;
let unsubscribeFromTaskErrors: () => void;

onMounted(async () => {
  // subscribe before the first await, so onUnmounted always has something to unsubscribe
  unsubscribeFromTaskUpdates = websocket.subscribe(`/background-jobs-task-update/${props.job.id}`, (data: { taskIndex: number, status?: string, state?: Record<string, any> }) => {
    const indexOnPage = data.taskIndex - currentOffset.value;
    if (indexOnPage >= 0 && indexOnPage < translationTasks.value.length) {
      if (data.state) {
        translationTasks.value[indexOnPage].state = data.state;
      }
      if (data.status) {
        translationTasks.value[indexOnPage].status = data.status;
      }
    }
  });
  unsubscribeFromTaskErrors = websocket.subscribe(`/background-jobs-task-error/${props.job.id}`, (data: { taskIndex: number, status?: string, state?: Record<string, any> }) => {
    console.log('Error received for task', data);
  });

  await loadPage(0);
});

onUnmounted(() => {
  unsubscribeFromTaskUpdates();
  unsubscribeFromTaskErrors();
});


</script>