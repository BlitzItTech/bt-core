<template>
    <v-slide-x-transition group>
        <span v-if="option.prefix != null">{{ option.prefix }}</span>
        <span v-if="option.bool != null">
            <v-icon v-if="nestedValue(data, option.value) === true" :size="size">mdi-check</v-icon>
        </span>
        <bt-entity
            v-else-if="option.nav != null && (option.itemText != null || option.textFilter != null)"
            inline
            :itemText="option.itemText"
            :itemId="nestedValue(data, option.value)"
            :nav="option.nav"
            :single="option.single"
            :textFilter="option.textFilter" />
        <span v-else>{{ displayText(data) }}</span>
    </v-slide-x-transition>
</template>

<script setup lang="ts">
import { type TableColumn } from '../composables/list.ts'
import { nestedValue } from '../composables/helpers.ts'
import { useFilters } from '../composables/filters.ts'
import { computed } from 'vue';
    
    interface Props {
        data: any
        option: TableColumn
        size?: string | number
    }

    const props = defineProps<Props>()
    const filters = useFilters()
    const displayText = computed(() => (item: any) => {
        let v = nestedValue(item, props.option.value)
        v = props.option.textFunction != null ? props.option.textFunction(v) : v
        return props.option.textFilter != null ? filters.findFilter(props.option.textFilter)(v) : v
    })
    
</script>