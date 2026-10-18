<template>
  <DropdownMenuAccordion class="af-language-in-user-menu" :label="selectedOption.label" :triggerClass="USER_MENU_ITEM_CLASSES">
    <template #icon>
      <LanguageFlag :countryCode="selectedOption.countryCode" />
    </template>
    <DropdownMenuItem
      v-for="option in options.filter((opt) => opt.value !== selectedOption.value)"
      :key="option.value"
      :class="USER_MENU_ITEM_CLASSES"
      @click="doChangeLang(option.value)"
    >
      <template #icon>
        <LanguageFlag :countryCode="option.countryCode" />
      </template>
      {{ option.label }}
    </DropdownMenuItem>
  </DropdownMenuAccordion>
</template>

<script setup>
import { DropdownMenuAccordion, DropdownMenuItem } from '@/afcl';
import { USER_MENU_ITEM_CLASSES } from '@/utils/userMenu';
import LanguageFlag from './LanguageFlag.vue';

import { setLang, getLocalLang, setLocalLang, getLanguageOptions } from './langCommon';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();

const props = defineProps(['meta', 'resource']);

const selectedLanguage = ref('');

function doChangeLang(lang) {
  setLocalLang(lang);
  // unfortunately, we need this to recall all APIs
  document.location.reload();

}


const options = computed(() => getLanguageOptions(props.meta.supportedLanguages));

const selectedOption = computed(() => {
  const val = options.value.find((option) => option.value === selectedLanguage.value);
  if (val) {
    return val;
  }
  return options.value[0];
});


onMounted(() => {
  selectedLanguage.value = getLocalLang(props.meta.supportedLanguages, props.meta.primaryLanguage);
});
</script>