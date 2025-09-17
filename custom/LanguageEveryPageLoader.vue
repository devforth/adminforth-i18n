<template/>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLang, getLocalLang, setLocalLang } from './langCommon';

const { setLocaleMessage, locale } = useI18n();

const props = defineProps(['meta']);

onMounted(() => {
  const langIso = getLocalLang(props.meta.supportedLanguages, props.meta.primaryLanguage);
  setLocalLang(langIso);
  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, langIso);
});
</script>