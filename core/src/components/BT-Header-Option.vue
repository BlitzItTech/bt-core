<template>
    <v-slide-x-transition group>
        <span v-if="option.prefix != null">{{ option.prefix }}</span>
        <span v-if="option.bool != null">
            <v-icon v-if="nestedValue(data, option.value) === true" :size="size">$check</v-icon>
        </span>
        <bt-entity
            v-else-if="option.nav != null && (option.itemText != null || option.textFilter != null)"
            inline
            :itemText="option.itemText"
            :itemID="nestedValue(data, option.value)"
            :nav="option.nav"
            :isSingle="true"
            :textFilter="option.textFilter"
            :truncate="option.truncate == true" />
        <span v-else
            :class="{ 'text-truncate': option.truncate == true }"
            :style="mStyle">
            {{ displayText(data) }}
        </span>
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
        let v = item

        if (props.option.value != null)
            v = nestedValue(item, props.option.value)

        if (props.option.textFunction != null)
            v = props.option.textFunction(v)

        if (props.option.textFilter != null)
            v = filters.findFilter(props.option.textFilter)(v)

        return v
    })
    const mStyle = computed(() => {
        if (props.option.truncate == true && props.option.width != null) {
            const width = (props.option.width.includes('px') || props.option.width.includes('%')) ? props.option.width : `${props.option.width}px`

            return `display: inline-block; width: ${width};`
        }
        
        return ''
    })
    
</script>