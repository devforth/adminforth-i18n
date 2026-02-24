<template>
  <Dialog 
    class="w-[500px]"
    :buttons="[
      { 
        label: 'Translate', 
        onclick: (dialog) => { runTranslation(); dialog.hide(); } ,
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
      <button
        v-if="checkboxes.length > 0"
        class="flex gap-1 items-center py-1 px-3 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded-default border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover"
      >
        <IconLanguageOutline class="w-5 h-5" />
        {{ t('Translate Selected') }} {{ `(${checkboxes.length})`  }}
        <div class="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 
          font-medium rounded-sm text-xs px-1 ml-1 text-center ">
          AI    
        </div>
      </button>
    </template>

    <div class="grid grid-cols-2 gap-4 w-full">
      <Button @click="selectAll" :disabled="allChecked">{{ t('Select All') }}</Button>
      <Button @click="uncheckAll" :disabled="noneChecked">{{ t('Uncheck All') }}</Button>
      <div class="col-span-2 grid grid-cols-3 gap-4 ">
        <div class="group flex items-center justify-between cursor-pointer" v-for="(index, lang) in checkedLanguages" :key="index" @click="toggleLanguage(lang)">
          <div class="flex items-center gap-2">
            <Checkbox v-model="checkedLanguages[lang]" /> 
            <span class="flag-icon"
              :class="`flag-icon-${getCountryCodeFromLangCode(lang)}`"
            ></span>
            <span class="group-hover:underline">{{ getName(getCountryCodeFromLangCode(lang)) }}</span>
          </div>
        </div>
      </div>
    </div>
</Dialog>

</template>

<script setup lang="ts">
  import { IconLanguageOutline } from '@iconify-prerendered/vue-flowbite';
  import { useI18n } from 'vue-i18n';
  import { Dialog, Button, Checkbox } from '@/afcl';
  import { computed, onMounted, ref, watch } from 'vue';
  import { callAdminForthApi } from '@/utils';
  import { useAdminforth } from '@/adminforth';
  import { getCountryCodeFromLangCode } from './langCommon';
  import { getName, overwrite } from 'country-list';

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
  const allChecked = computed(() => Object.values(checkedLanguages.value).every(Boolean));
  const noneChecked = computed(() => Object.values(checkedLanguages.value).every(value => !value));

  onMounted(() => {
    for (const lang of props.meta.supportedLanguages) {
      checkedLanguages.value[lang] = true;
    }
  });

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
    try {
      const res = await callAdminForthApi({
        path: `/plugin/${props.meta.pluginInstanceId}/translate-selected-to-languages`,
        method: 'POST',
        body: { 
          selectedIds: props.checkboxes,
          selectedLanguages: Object.keys(checkedLanguages.value).filter(lang => checkedLanguages.value[lang]),
        },
        silentError: true,
      });
      adminforth.list.refresh();
      props.clearCheckboxes();
        if (res.ok) {
          adminforth.alert({ message: res.successMessage, variant: 'success' });
        } else {
          adminforth.alert({ message: res.errorMessage || t('Failed to translate selected items. Please, try again.'), variant: 'danger' });
        }
    } catch (e) {
      console.error('Failed to translate selected items:', e);
      adminforth.alert({ message: t('Failed to translate selected items. Please, try again.'), variant: 'danger' });
    }
  }

</script>