<template/>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLang, getLocalLang } from './langCommon';

const { setLocaleMessage, locale } = useI18n();

const props = defineProps(['meta']);

onMounted(() => {
  setLang({ setLocaleMessage, locale }, props.meta.pluginInstanceId, getLocalLang(props.meta.supportedLanguages));
});
</script>