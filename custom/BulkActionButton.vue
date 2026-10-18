<template>
  <Dialog 
    ref="dialogRef"
    class="w-[600px]"
    :buttons="[
      { 
        label: t('Close'),
        options: {
          variant: 'secondary'
        }, 
        onclick: (dialog) => dialog.hide() 
      },
      { 
        label: t('Translate'),
        onclick: async (dialog) => { await runTranslation(); dialog.hide(); } ,
        options: {
          disabled: noneChecked 
        }
      },
    ]"
  >
    <template #trigger>
      <span class="flex items-center gap-2">
        <IconLanguages class="w-4 h-4 shrink-0 text-lightInputIconColor dark:text-darkInputIconColor" aria-hidden="true" />
        <span class="truncate max-w-[60vw] md:max-w-none">{{props.checkboxes.length === 0 ? t('Translate filtered') : t('Translate selected ({count})', { count: props.checkboxes.length })}}</span>
        <span class="inline-flex items-center h-[1.125rem] px-1.5 rounded-full border border-lightPrimary/30 bg-lightPrimary/10 text-lightPrimary text-[11px] font-semibold dark:border-darkPrimary/40 dark:bg-darkPrimary/15 dark:text-darkPrimary">
          {{t('AI')}}
        </span>
      </span>
    </template>

    <div class="af-i18n-translations-selector relative grid grid-cols-2 gap-2 w-full">
      <div v-if="isLoading" class="top-0 left-0 z-10 absolute bg-black/30 w-full h-full rounded-lg flex items-center justify-center">
        <Spinner class="w-10 h-10" />
      </div>
      <Button variant="secondary" @click="selectAll" :disabled="allChecked">{{ t('Select All') }}</Button>
      <Button variant="secondary" @click="uncheckAll" :disabled="noneChecked">{{ t('Uncheck All') }}</Button>
      <div class="col-span-2 grid grid-cols-3 gap-x-2 gap-y-3 mt-4">
        <Checkbox v-for="(index, lang) in checkedLanguages" :key="lang" v-model="checkedLanguages[lang]">
          <span class="flex items-center gap-2">
            <LanguageFlag :countryCode="props.meta.countryCodes[lang]" />
            {{ ISO6391.getName(lang.slice(0,2)) }} ({{ lang }})
          </span>
        </Checkbox>
      </div>
    </div>
</Dialog>

</template>

<script setup lang="ts">
  import { IconLanguages } from '@iconify-prerendered/vue-lucide';
  import { useI18n } from 'vue-i18n';
  import { Dialog, Button, Checkbox, Spinner } from '@/afcl';
  import { computed, onMounted, ref, onUnmounted } from 'vue';
  import { callAdminForthApi } from '@/utils';
  import { useAdminforth } from '@/adminforth';
  import { getName, overwrite } from 'country-list';
  import ISO6391 from 'iso-639-1';
  import LanguageFlag from './LanguageFlag.vue';
  import websocket from '@/websocket';
  import { useFiltersStore } from '@/stores/filters';
  import { useBackgroundJobApi } from '@/custom/plugins/BackgroundJobsPlugin/useBackgroundJobApi.ts';

  const filtersStore = useFiltersStore();
  const jobInfoStore = useBackgroundJobApi();

  const { t } = useI18n();
  const adminforth = useAdminforth();

  overwrite([{
    code: 'US',
    name: 'USA'
  }]);
  const props = defineProps<{
    resource: Record<string, any>;
    checkboxes: string[];
    adminUser: Record<string, any>;
    meta: {
      supportedLanguages: string[];
      countryCodes: Record<string, string>;
      pluginInstanceId: string;
    };
    clearCheckboxes: () => void;
  }>();


  const dialogRef = ref();
  async function openDialog(dialog: any) {
    dialogRef.value.open();
  }

  defineExpose({
    click: openDialog,
  });

  const checkedLanguages = ref<Record<string, boolean>>({});
  const isLoading = ref(false);
  const allChecked = computed(() => Object.values(checkedLanguages.value).every(Boolean));
  const noneChecked = computed(() => Object.values(checkedLanguages.value).every(value => !value));

  onMounted(() => {
    websocket.subscribe('/translation_progress', (data) => {
      adminforth.list.refresh();
    });
    for (const lang of props.meta.supportedLanguages) {
      checkedLanguages.value[lang] = true;
    }
  });
  
  onUnmounted( () => {
      websocket.unsubscribe('/translation_progress');
  } )

  function selectAll() {
    for (const lang of props.meta.supportedLanguages) {
      checkedLanguages.value[lang] = true;
    }
  }

  function uncheckAll() {
    for (const lang of props.meta.supportedLanguages) {
      checkedLanguages.value[lang] = false;
    }
  }

  async function runTranslation() {
    isLoading.value = true;
  
    let listOfIds = []; 
    if (props.checkboxes.length === 0) {
      listOfIds = await getListOfIds();
    } else {
      listOfIds = props.checkboxes;
    }
    try {
      const res = await callAdminForthApi({
        path: `/plugin/${props.meta.pluginInstanceId}/translate-selected-to-languages`,
        method: 'POST',
        body: { 
          selectedIds: listOfIds,
          selectedLanguages: Object.keys(checkedLanguages.value).filter(lang => checkedLanguages.value[lang]),
        },
        silentError: true,
      });
      props.clearCheckboxes();
        if (res.ok) {
          adminforth.alert({ message: `Running translation job`, variant: 'success' });
          console.log('Received record IDs for filtered selector:', res);
          const jobId = res.jobId;
          if (jobId) {
            console.log('Opening job info popup for jobId:', jobId);
            jobInfoStore.openJobInfoPopup(jobId);
          }
        } else {
          adminforth.alert({ message: res.errorMessage || t('Failed to translate selected items. Please, try again.'), variant: 'danger' });
        }
    } catch (e) {
      console.error('Failed to translate selected items:', e);
      adminforth.alert({ message: t('Failed to translate selected items. Please, try again.'), variant: 'danger' });
    }
    isLoading.value = false;
  }

  async function getListOfIds() {
    const filters = filtersStore.getFilters();
    let res;
    try {
      res = await callAdminForthApi({
        path: `/plugin/${props.meta.pluginInstanceId}/get_filtered_ids`,
        method: 'POST',
        body: { filters },
        silentError: true,
      });
    } catch (e) {
      console.error('Failed to get records for filtered selector:', e);
      return [];
    }
    if (!res?.ok || !res?.recordIds) {
      console.error('Failed to get records for filtered selector, response error:', res);
      return [];
    }
    return res.recordIds;
  }
 

</script>