<template>
    <v-text-field
        :class="{ 'centered-input': textCenter }"
        :dark="theme.global.current.value.dark"
        type="number"
        v-bind="$attrs"
        v-model.number="value" />
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { computed } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        min?: number
        max?: number
        onSelect?: (item: any) => void
        modelValue?: any
        textCenter?: boolean
    }

    const theme = useTheme()

    const props = defineProps<FieldProps>()

    const emit = defineEmits(['update:modelValue'])
    
    const value = computed({
        get() {
            return props.modelValue
        },
        set(value: any) {
            if (props.min != null && value != null && value < props.min)
                return

            if (props.max != null && value != null && value > props.max)
                return

            emit('update:modelValue', value)
            if (props.onSelect)
                props.onSelect(value)
        }
    })

</script>

<style scoped>
    .centered-input >>> input {
      text-align: center;
      padding: 0px;
      margin: 0px;
    }

</style>