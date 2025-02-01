<template>
  <Input 
    ref="input"
    v-if="shortValue"
    class="w-full"
    :modelValue="props.record[props.column.name]"
    :disabled="props.column.editReadonly"
    @update:modelValue="($event) => emit('update:value', $event)" />
  <textarea 
    v-else
    ref="textarea"
    :disabled="props.column.editReadonly"
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5
      dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-lightPrimary focus:border-lightPrimary dark:focus:ring-darkPrimary dark:focus:border-darkPrimary"
    :value="props.record[props.column.name]" 
    @input="($event) => { autoResizeTextArea(); emit('update:value', $event.target.value) }" />

</template>

<script setup lang="ts">
import { Input } from "@/afcl";
import type {
  AdminForthResourceColumnCommon,
  AdminForthResourceCommon,
  AdminUser,
} from "@/types/Common";
import { computed, defineProps, defineEmits, type Ref, watch, nextTick, ref, onMounted } from "vue";

const shortValue: Ref<boolean> = computed(() => (props.record[props.column.name]?.length || 0) < 50);

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const emit = defineEmits(["update:value"]);

const input: Ref<HTMLInputElement | HTMLTextAreaElement | null> = ref(null);
const textarea: Ref<HTMLInputElement | HTMLTextAreaElement | null> = ref(null);

// Auto resize function
const autoResizeTextArea = () => {
  // Use nextTick to ensure the DOM update is done before measuring
  nextTick(() => {
    if (!textarea.value) return

    // Reset the height to shrink if content is removed
    textarea.value.style.height = 'auto'
    // Set it to the scrollHeight to make it grow
    textarea.value.style.height = textarea.value.scrollHeight + 3 + 'px'
  })
}

watch(() => shortValue.value, async () => {
  await nextTick();
  if (shortValue.value) {
    input.value?.focus();
  } else {
    textarea.value?.focus();
    await nextTick();
    autoResizeTextArea();
  }
});


onMounted(async () => {
  if (!shortValue.value) {
    await nextTick();
    autoResizeTextArea();
  }
});
</script>

