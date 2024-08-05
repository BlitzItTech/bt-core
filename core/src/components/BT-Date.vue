<template>
    <VueDatePicker
        auto-apply
        :dark="theme.global.current.value.dark"
        :enable-time-picker="useTime"
        inline
        :is-24="false"
        :time-picker-inline="useTime"
        :timezone="auth.timeZone.value"
        utc
        v-bind="$attrs"
        v-model="value">
    </VueDatePicker>
    <!-- <VueDatePicker
        auto-apply
        :dark="theme.global.current.value.dark"
        :enable-time-picker="useTime"
        inline
        :is-24="false"
        :time-picker-inline="useTime"
        :timezone="auth.timeZone.value"
        utc
        v-bind="$attrs"
        v-model="value" /> -->
</template>

<script setup lang="ts">
    import VueDatePicker from '@vuepic/vue-datepicker'
    import '@vuepic/vue-datepicker/dist/main.css'
    import { computed } from 'vue'
    import { useAuth } from '../composables/auth.ts'
    import { useTheme } from 'vuetify'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        date?: any
        dateFrom?: string
        dateRules?: Function | unknown[]
        format?: string
        fromNow?: boolean
        horizontal?: boolean
        isEditing?: boolean
        label?: string
        modelValue?: any
        onSelect?: (item: any) => void
        range?: boolean
        useTime?: boolean
    }

    const theme = useTheme()

    const props = withDefaults(defineProps<FieldProps>(), {
        isEditing: undefined,
        format: 'ccc dd/LL/yyyy',
        fromNow: false,
        range: false
    })

    const emit = defineEmits(['update:modelValue'])
    
    const auth = useAuth()

    const value = computed({
        get() {
            return props.modelValue
        },
        set(value) {
            emit('update:modelValue', value)
            if (props.onSelect)
                props.onSelect(value)
        }
    })
</script>