<template>
  <Input
    ref="input"
    v-if="shortValue"
    type="text"
    fullWidth
    :modelValue="props.record[props.column.name]"
    :readonly="props.column.editReadonly"
    @update:modelValue="($event) => emit('update:value', $event)" />
  <Textarea
    v-else
    ref="textarea"
    :modelValue="props.record[props.column.name]"
    :readonly="props.column.editReadonly"
    @update:modelValue="($event) => { autoResizeTextArea(); emit('update:value', $event) }" />
</template>

<script setup lang="ts">
import { Input, Textarea } from "@/afcl";
import type {
  AdminForthResourceColumnCommon,
  AdminForthResourceCommon,
  AdminUser,
} from "@/types/Common";
import { computed, type Ref, watch, nextTick, ref, onMounted } from "vue";

const shortValue: Ref<boolean> = computed(() => (props.record[props.column.name]?.length || 0) < 50);

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const emit = defineEmits(["update:value"]);

const input = ref<InstanceType<typeof Input> | null>(null);
const textarea = ref<InstanceType<typeof Textarea> | null>(null);

// Auto resize function
const autoResizeTextArea = () => {
  // Use nextTick to ensure the DOM update is done before measuring
  nextTick(() => {
    if (!textarea.value) return

    // the textarea is the root element of AFCL Textarea
    const el = textarea.value.$el as HTMLTextAreaElement
    // Reset the height to shrink if content is removed
    el.style.height = 'auto'
    // Set it to the scrollHeight to make it grow
    el.style.height = el.scrollHeight + 3 + 'px'
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

