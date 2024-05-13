<template>
    <span>{{ prefix }}{{ displayText }}{{ suffix }}</span>
</template>

<script setup lang="ts">
    import { useFilters } from '../composables/filters.ts'
    import { computed } from 'vue'
    
    interface Props {
        filter: string
        prefix?: string
        suffix?: string
        value: any
    }

    const props = defineProps<Props>()
    const { findFilter } = useFilters()
    const displayText = computed(() => {
        return props.filter ? findFilter(props.filter)(props.value) : props.value
    })
</script>