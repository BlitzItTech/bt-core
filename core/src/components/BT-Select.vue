<template>
    <v-select
        :append-icon="canRefresh ? 'mdi-refresh' : undefined"
        :clearable="canSelectNone"
        @click:append-icon="ui.refresh({ deepRefresh: true })"
        hide-details
        :items="ui.filteredItems.value"
        :item-title="itemText"
        :item-value="itemValue"
        :variant="fieldVariant" />
</template>

<script setup lang="ts">
    import { type ListProps, type ListEvents, useList } from '../composables/list.ts'
    import { type FieldVariant } from '../types.ts'

    interface SelectEvents extends ListEvents {

    }

    interface SelectProps extends ListProps {
        additionalUrl?: string
        canRefresh?: boolean
        canSelectNone?: boolean
        fieldVariant?: FieldVariant
        items?: [],
        itemText?: string
        itemValue?: string //inherited
        multiple?: boolean
        nav?: string
        onFilter?: Function
        textFilter?: string
    }

    const emit = defineEmits<SelectEvents>()

    const props = withDefaults(defineProps<SelectProps>(), {
        
    })

    const ui = useList(props, emit)

</script>