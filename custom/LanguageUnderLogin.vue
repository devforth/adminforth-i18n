<template>
  <div class="af-language-under-login mt-3">
    <Select
      class="w-full"
      v-model="selectedLanguage"
      :options="options"
      :placeholder="$t('Select language')"
    >
      <template #item="{ option }">
        <span class="flex items-center gap-2">
          <CountryFlag size="sm" :countryCode="option.countryCode" />
          {{ option.label }}
        </span>
      </template>

      <template #selected-item="{ option }">
        <span class="flex items-center gap-2">
          <CountryFlag size="sm" :countryCode="option.countryCode" />
          {{ option.label }}
        </span>
      </template>
    </Select>
  </div>
</template>

<script setup>
import { CountryFlag, Select } from '@/afcl';
import { setLang, getLocalLang, getLanguageOptions } from './langCommon';
import { useCoreStore } from '@/stores/core';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();


const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');
const coreStore = useCoreStore();

watch(() => selectedLanguage.value, async (newVal) => {
  // Select clears its value while the user types a search, the language stays until another one is picked
  if (!newVal) {
    return;
  }
  await setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, newVal);
  coreStore.getPublicConfig();
  coreStore.getLoginFormConfig();
});


const options = computed(() => getLanguageOptions(props.meta.supportedLanguages));

onMounted(() => {
  selectedLanguage.value = getLocalLang(props.meta.supportedLanguages, props.meta.primaryLanguage);
});
</script>