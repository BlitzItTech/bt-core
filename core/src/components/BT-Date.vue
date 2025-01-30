<template>
    <VueDatePicker
        auto-apply
        :dark="theme.global.current.value.dark"
        :enable-time-picker="useTime"
        inline
        :is-24="false"
        :min-date="minDate"
        :multi-dates="multi"
        :range="range"
        :timezone="auth.timeZone.value"
        utc
        v-bind="$attrs"
        v-model="value">
    </VueDatePicker>
</template>

<script setup lang="ts">
    import VueDatePicker from '@vuepic/vue-datepicker'
    import '@vuepic/vue-datepicker/dist/main.css'
    import { computed } from 'vue'
    import { useDates } from '../composables/dates.ts'
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
        modelValue?: any
        multi?: boolean
        onSelect?: (item: any) => void
        range?: boolean
        useTime?: boolean
    }

    const theme = useTheme()

    const props = withDefaults(defineProps<FieldProps>(), {
        format: 'ccc dd/LL/yyyy',
        fromNow: false,
        multi: false,
        range: false
    })

    const emit = defineEmits(['update:modelValue'])
    
    const auth = useAuth()
    const { getToday } = useDates()

    const minDate = computed(() => props.dateFrom ?? (props.fromNow ? getToday() : undefined))

    const value = computed({
        get() {
            return props.modelValue
        },
        set(value) {
            var result;

            if ((props.range == true || props.multi == true) && Array.isArray(value)) {
                result = value.map(x => `${x.split('.')[0]}Z`)
            }
            else {
                result = value == null ? value : `${value.split('.')[0]}Z`
            }
            
            emit('update:modelValue', result)
            if (props.onSelect)
                props.onSelect(result)
        }
    })
</script>