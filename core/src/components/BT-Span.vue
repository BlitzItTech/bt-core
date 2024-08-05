<template>
    <span>{{ prefix }}{{ displayText }}{{ suffix }}</span>
</template>

<script setup lang="ts">
    import { useFilters } from '../composables/filters.ts'
    import { computed } from 'vue'
    
    interface Props {
        customFilter?: any
        filter?: string
        format?: string
        prefix?: string
        suffix?: string
        value: any
    }

    const props = defineProps<Props>()
    const { findFilter } = useFilters()
    const displayText = computed(() => {
        const func = props.filter != null ? findFilter(props.filter) : props.customFilter
        return func != null ? func(props.value, props.format) : props.value
    })
</script>