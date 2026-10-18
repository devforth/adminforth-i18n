<template>
  <div class="relative group flex items-center" ref="listCell">
    <!-- Normal value display -->
    <div v-if="column.editReadonly" class="flex items-center" :class="limitedText?.length > 50 ? 'min-w-48 max-w-full' : 'min-w-32'">
      {{ limitedText? limitedText : '-' }}
    </div>

    <div @click.stop="startEdit()"
      v-else-if="!isEditing" class="flex items-center" :class="limitedText?.length > 50 ? 'min-w-48 max-w-full' : 'min-w-32'">
      {{ limitedText? limitedText : '-' }}

      <span v-if="meta?.reviewedCheckboxesFieldName && limitedText" class="flex items-center ml-2">
        <Tooltip
        >
          <template #tooltip>
              {{ record[meta?.reviewedCheckboxesFieldName]?.[props.column.name] ? t('Translation is reviewed') : t('Translation is not reviewed') }}
          </template> 
          <IconCircleCheck
            v-if="record[meta?.reviewedCheckboxesFieldName]?.[props.column.name]"
            class="w-4 h-4 text-lightSuccess dark:text-darkSuccess"
          />
          <IconCircleHelp
            v-else
            class="w-4 h-4 text-lightWarning dark:text-darkWarning"
          />
        </Tooltip>
      </span>

      <Button
        v-if="!column.editReadonly"
        @click="startEdit"
        variant="ghost"
        size="sm"
        iconOnly
        class="ml-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
      >
        <IconPencil />
      </Button>
    </div>

    <!-- Edit mode -->
     <div v-else class="flex flex-col gap-2 trans-editor" @click.stop>
      <div class="flex items-center max-w-full gap-2"
        :class="limitedText?.length > 50 ? 'min-w-72' : 'min-w-64'"
        ref="inputHolder"
      >
        <ColumnValueInputWrapper
          class="flex-grow"
          ref="input"
          :source="'edit'"
          :column="column"
          :currentValues="currentValues"
          :mode="mode"
          :columnOptions="columnOptions"
          :unmasked="unmasked"
          :setCurrentValue="setCurrentValue"
        />
        <div class="flex gap-1">
          <Button
            @click="saveEdit"
            :disabled="saving || (originalReviewed === reviewed && originalValue === currentValues[props.column.name])"
            :loader="saving"
            iconOnly
          >
            <IconCheck />
          </Button>
          <Button
            @click="cancelEdit"
            :disabled="saving"
            variant="secondary"
            iconOnly
          >
            <IconX />
          </Button>
        </div>
      </div>
      <div v-if="meta?.reviewedCheckboxesFieldName">
        <Checkbox
          v-model="reviewed"
          :disabled="saving"
        >
          {{ t('Translation is reviewed') }}
        </Checkbox>
        
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, nextTick, onMounted } from 'vue';
import { IconPencil, IconCheck, IconX, IconCircleCheck, IconCircleHelp } from '@iconify-prerendered/vue-lucide';
import { callAdminForthApi } from '@/utils';
import { showErrorTost, showSuccesTost } from '@/composables/useFrontendApi';
import ColumnValueInputWrapper from '@/components/ColumnValueInputWrapper.vue';
import { useI18n } from 'vue-i18n';
import { Button, Checkbox, Tooltip } from '@/afcl';
import { eventBus } from './eventBus'

const listCell = ref(null);
const { t } = useI18n();
const props = defineProps(['column', 'record', 'resource', 'adminUser', 'meta']);
const isEditing = ref(false);
const editValue = ref(null);
const saving = ref(false);
const input = ref(null);
const columnOptions = ref({});
const mode = ref('edit');
const currentValues = ref({});
const unmasked = ref({});

const inputHolder = ref(null);

const limitedText = computed(() => {
  if (props.column.name == props.meta?.enFieldName && anyEditorOpen.value) {
    return props.record[props.column.name]; // keep english text 
  }
  const text = props.record[props.column.name];
  return text?.length > 50 ? text.slice(0, 50) + '...' : text;
});

const reviewed: Ref<boolean> = ref(false);
const anyEditorOpen = ref(false);  // if any editor for lang page is open

onMounted(() => {
  eventBus.on(`editing-changed-${props.record.id}`, async () => {
    console.log('editing-changed', props.record.id);
    await nextTick();
    anyEditorOpen.value = listCell.value?.closest('tr')?.querySelector('.trans-editor') !== null;
  });
});


const originalReviewed = ref(false);
const originalValue = ref(null);

async function startEdit() {
  const value = props.record[props.column.name];
  currentValues.value = {
    [props.column.name]: props.column.isArray?.enabled 
      ? (Array.isArray(value) ? value : [value]).filter(v => v !== null && v !== undefined)
      : value,
  };
  reviewed.value = props.record[props.meta?.reviewedCheckboxesFieldName]?.[props.column.name] || false;
  originalReviewed.value = reviewed.value;
  originalValue.value = value;
  isEditing.value = true;
  await nextTick();
  if (inputHolder.value) {
    inputHolder.value.querySelector('input, textarea, select')?.focus();
  }
  eventBus.emit(`editing-changed-${props.record.id}`, null);
}

function cancelEdit() {
  isEditing.value = false;
  editValue.value = null;
  eventBus.emit(`editing-changed-${props.record.id}`, null);

}

function setCurrentValue(field, value, arrayIndex = undefined) {
  if (arrayIndex !== undefined && props.column.isArray?.enabled) {
    // Handle array updates
    if (!Array.isArray(currentValues.value[field])) {
      currentValues.value[field] = [];
    }
    
    const newArray = [...currentValues.value[field]];
    
    if (arrayIndex >= newArray.length) {
      // When adding a new item, always add null
      newArray.push(null);
    } else {
      // For existing items, handle type conversion
      if (props.column.isArray?.itemType && ['integer', 'float', 'decimal'].includes(props.column.isArray.itemType)) {
        newArray[arrayIndex] = value !== null && value !== '' ? +value : null;
      } else {
        newArray[arrayIndex] = value;
      }
    }
    
    // Assign the new array
    currentValues.value[field] = newArray;
    editValue.value = newArray;
  } else {
    // Handle non-array updates
    currentValues.value[field] = value;
    editValue.value = value;
  }
  eventBus.emit(`editing-changed-${props.record.id}`, null);

}

async function saveEdit() {
  saving.value = true;
  try {
    const result = await callAdminForthApi({
      method: 'POST',
      path: `/plugin/${props.meta.pluginInstanceId}/update-field`,
      body: {
        resourceId: props.resource.resourceId,
        recordId: props.record._primaryKeyValue,
        field: props.column.name,
        value: currentValues.value[props.column.name],
        reviewed: reviewed.value,
      }
    });

    if (result.error) {
      showErrorTost(result.error);
      return;
    }

    showSuccesTost(t('Field updated successfully'));
    props.record[props.column.name] = result.record[props.column.name];
    if (props.meta?.reviewedCheckboxesFieldName) {
      props.record[props.meta?.reviewedCheckboxesFieldName] = result.record[props.meta?.reviewedCheckboxesFieldName];
    }
    isEditing.value = false;
  } finally {
    saving.value = false;
  }
}
</script>
