<template>
  <Dialog 
    class="w-[600px]"
    :buttons="[
      { 
        label: 'Translate', 
        onclick: async (dialog) => { await runTranslation(); dialog.hide(); } ,
        options: {
          disabled: noneChecked 
        }
      },
      { 
        label: 'Close',          
        options: {
          class: 'bg-white hover:!bg-gray-100 !text-gray-900 hover:!text-gray-800 dark:!bg-gray-800 dark:!text-gray-100 dark:hover:!bg-gray-700 !border-gray-200 dark:!border-gray-600'
        }, 
        onclick: (dialog) => dialog.hide() 
      },
    ]"
  >
    <template #trigger>
      <button class="flex items-center justify-center w-full">
        <IconLanguageOutline class="text-gray-500 dark:text-gray-400 w-5 h-5" />
        <div class="flex items-end justify-start gap-2 cursor-pointer">
          <p class="text-justify max-h-[18px] truncate max-w-[60vw] md:max-w-none">{{ t('Translate filtered') }}</p>
            <div class="flex items-center justify-center text-white bg-gradient-to-r h-[18px] from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-md text-sm px-1 text-center">
            {{t('AI')}}
          </div>
        </div>
      </button>
    </template>

    <div class="af-i18n-translations-selector grid grid-cols-2 gap-1 w-full">
      <div v-if="isLoading" class="top-0 left-0 z-10 absolute bg-black/30 w-full h-full rounded-lg flex items-center justify-center">
        <Spinner class="w-10 h-10" />
      </div>
      <Button @click="selectAll" :disabled="allChecked">{{ t('Select All') }}</Button>
      <Button @click="uncheckAll" :disabled="noneChecked">{{ t('Uncheck All') }}</Button>
      <div class="col-span-2 grid grid-cols-3 gap-1 mt-4">
        <div class="group hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-2 flex items-center cursor-pointer" v-for="(index, lang) in checkedLanguages" :key="lang" @click="toggleLanguage(lang)">
          <Checkbox v-model="checkedLanguages[lang]" /> 
          <span class="flag-icon mr-2"
            :class="`flag-icon-${getCountryCodeFromLangCode(lang)}`"
          ></span>
          <span class="group-hover:text-gray-900 text-gray-600 dark:text-white dark:group-hover:text-gray-200">{{ ISO6391.getName(lang.slice(0,2)) }} ({{ lang }})</span>
        </div>
      </div>
    </div>
</Dialog>

</template>

<script setup lang="ts">
  import { IconLanguageOutline } from '@iconify-prerendered/vue-flowbite';
  import { useI18n } from 'vue-i18n';
  import { Dialog, Button, Checkbox, Spinner } from '@/afcl';
  import { computed, onMounted, ref, onUnmounted } from 'vue';
  import { callAdminForthApi } from '@/utils';
  import { useAdminforth } from '@/adminforth';
  import { getCountryCodeFromLangCode } from './langCommon';
  import { getName, overwrite } from 'country-list';
  import ISO6391 from 'iso-639-1';
  import 'flag-icon-css/css/flag-icons.min.css';
  import websocket from '@/websocket';
  import { useFiltersStore } from '@/stores/filters';
  import { useJobInfoStore } from '@/custom/plugins/BackgroundJobsPlugin/useBackgroundJobPlugin.ts';

  const filtersStore = useFiltersStore();
  const jobInfoStore = useJobInfoStore();

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
      pluginInstanceId: string;
    };
    clearCheckboxes: () => void;
  }>();

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

  function toggleLanguage(lang: string) {
    checkedLanguages.value[lang] = !checkedLanguages.value[lang];
  }

  async function runTranslation() {
    isLoading.value = true;
    const listOfIds = await getListOfIds();
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