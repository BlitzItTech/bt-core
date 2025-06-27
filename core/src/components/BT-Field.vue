<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item>
            <template #default>
                <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
                <v-list-item-title>{{ prefix }}{{ displayText }}{{ suffix }}</v-list-item-title>
            </template>
        </v-list-item>
    </v-col>
</template>

<script setup lang="ts">
    import { computed, inject, ref } from 'vue'
    import { useFilters } from '../composables/filters.ts'

    interface FieldProps {
        cols?: string | boolean
        customFilter?: any
        filter?: string
        format?: string
        isMobile?: boolean
        label: string
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
        prefix?: string
        sm?: string | boolean
        suffix?: string
        value: any
    }

    const props = withDefaults(defineProps<FieldProps>(), {
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const mIsMobile = inject('isMobile', () => ref(false), true)
    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)

    const { findFilter } = useFilters()
    const displayText = computed(() => {
        const func = props.filter != null ? findFilter(props.filter) : props.customFilter
        return func != null ? func(props.value, props.format) : props.value
    })

</script>