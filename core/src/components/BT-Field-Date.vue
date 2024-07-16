<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item v-if="!cIsEditing" class="px-0" density="compact">
            <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
            <v-list-item-title>{{ displayValue }}</v-list-item-title>
        </v-list-item>
        <v-menu v-else open-delay="5">
            <template v-slot:activator="{ props }">
                <v-text-field
                    v-bind="props"
                    :hide-details="!dateRules"
                    :label="label"
                    readonly
                    :variant="cIsEditing ? editVariant : variant"
                    v-model="displayValue" />
            </template>
            <VueDatePicker
                auto-apply
                dark
                :enable-time-picker="useTime"
                inline
                :is-24="false"
                :time-picker-inline="useTime"
                :timezone="auth.timeZone.value"
                utc
                v-bind="$attrs"
                v-model="value" />
        </v-menu>
    </v-col>
</template>

<script setup lang="ts">
    import VueDatePicker from '@vuepic/vue-datepicker'
    import '@vuepic/vue-datepicker/dist/main.css'
    import { computed, inject, ref } from 'vue'
    import { useAuth } from '../composables/auth.ts'
    import { useDates } from '../composables/dates.ts'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        dateFrom?: string
        dateRules?: Function | unknown[]
        format?: string
        fromNow?: boolean
        horizontal?: boolean
        isEditing?: boolean
        isMobile?: boolean
        label?: string
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
        sm?: string | boolean
        useTime?: boolean
    }

    const props = withDefaults(defineProps<FieldProps>(), {
        isEditing: undefined,
        cols: '12',
        lg: false,
        md: false,
        sm: '6',
        format: 'ccc dd/LL/yyyy', //'dd-LL-yyyy', //ccc dd-LL-yyyy t
        fromNow: false
    })

    const emit = defineEmits(['update:modelValue'])
    const { tzString } = useDates()
    const auth = useAuth()

    const value = computed({
        get() {
            return props.modelValue
        },
        set(value) {
            emit('update:modelValue', value)
        }
    })

    const displayValue = computed(() => props.modelValue ? tzString(props.modelValue, props.format) : undefined)

    // const modal = ref(false)
    const startDate = ref()
    const mIsEditing = inject('isEditing', () => ref(false), true)
    const cIsEditing = computed(() => props.isEditing ?? mIsEditing.value)
    const mIsMobile = inject('isMobile', () => ref(false), true)
    const variant = inject('fieldVariant', 'underlined')
    const editVariant = inject('fieldEditVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)

    if (props.dateFrom != null) {
        startDate.value = props.dateFrom
    }
    else if (props.fromNow) {
        startDate.value = tzString()
    }

</script>