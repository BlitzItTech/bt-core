<template>
    <v-select
        :append-icon="canRefresh ? '$refresh' : undefined"
        :clearable="canSelectNone"
        @click:append-icon="ui.refresh({ deepRefresh: true })"
        hide-details
        :items="ui.filteredItems.value"
        :item-title="mItemText"
        :item-value="itemValue"
        :loading="ui.isLoading.value"
        :variant="fieldVariant"
        v-bind="$attrs">
        <template #item="data">
            <slot name="item" v-bind="data">
                <v-list-item v-bind="data.props" />
            </slot>
        </template>
        <template #selection="data">
            <slot name="selection" v-bind="data">
                <v-list-item v-bind="data.item.props" />
            </slot>
        </template>
    </v-select>
</template>

<script setup lang="ts">
    import { type FieldVariant } from '../types.ts'
    import { type ListProps, type ListEvents, useList } from '../composables/list.ts'
    import { useNavigation } from '../composables/navigation.ts';

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
    const nav = useNavigation()

    const props = withDefaults(defineProps<SelectProps>(), {
        eager: true
    })

    const mItemText = props.itemText ?? (props.nav != null ? nav.findItemText(props.nav) : undefined) ?? undefined
    const ui = useList<any>(props, emit)

</script>