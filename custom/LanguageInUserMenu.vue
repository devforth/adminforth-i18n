<template>
  <div class="min-w-40">
    <div class="cursor-pointer flex items-center justify-between gap-1 block px-4 py-2 text-sm
      bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText 
      hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover 
      dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover w-full select-none"
      :class="{ 'bg-black bg-opacity-10	': showDropdown }"
      @click="showDropdown = !showDropdown"
    >
      <div>
        <span class="mr-1">
          <span class="flag-icon"
            :class="`flag-icon-${selectedOption.countryCode}`"
          ></span>
        </span>
        <span>{{ selectedOption.label }}</span>
      </div>
      <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-gray-400 opacity-50 transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
      />
    </div>

    <div v-if="showDropdown" >
      
      <div class="cursor-pointer flex items-center gap-1 block px-4 py-1 text-sm 
        bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText 
        hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover 
        dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover
        w-full text-select-none pl-5 select-none"
        v-for="option in options.filter((opt) => opt.value !== selectedOption.value)"
        @click="doChangeLang(option.value)"
      >
        <span class="mr-1">
          <span class="flag-icon"
            :class="`flag-icon-${option.countryCode}`"
          ></span>
        </span>
        <span>{{ option.label }}</span>
      
      </div>
    </div>

   
  </div>
</template>

<script setup>
import 'flag-icon-css/css/flag-icons.min.css';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';

import { setLang, getLocalLang, setLocalLang, getLanguageOptions } from './langCommon';

import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { setLocaleMessage, locale } = useI18n();

const showDropdown = ref(false);
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