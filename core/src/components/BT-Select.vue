<template>
    <v-select
        :append-icon="canRefresh ? '$refresh' : undefined"
        :clearable="canSelectNone"
        @click:append-icon="ui.refresh({ deepRefresh: true })"
        :hide-details="cRules == null"
        :items="ui.filteredItems.value"
        :item-title="mItemText"
        :item-value="itemValue"
        :loading="ui.isLoading.value"
        :multiple="multiple"
        :rules="cRules"
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
    import { useNavigation } from '../composables/navigation.ts'
    import { computed } from 'vue'
    import { TestRequired } from '../composables/rules.ts'

    interface SelectEvents extends ListEvents {

    }

    interface SelectProps extends ListProps<any, any, any> {
        additionalUrl?: string
        canRefresh?: boolean
        canSelectNone?: boolean
        fieldVariant?: FieldVariant
        items?: any[],
        itemText?: string
        itemValue?: string //inherited
        multiple?: boolean
        nav?: string
        required?: boolean
        rules?: any
        textFilter?: string
    }

    const emit = defineEmits<SelectEvents>()
    const nav = useNavigation()

    const props = withDefaults(defineProps<SelectProps>(), {
        eager: true
    })

    const mItemText = props.itemText ?? (props.nav != null ? nav.findItemText(props.nav) : undefined) ?? undefined
    const ui = useList<any, any, any>(props, emit)
    const cRules = computed(() => {
        var r = [
            ...(props.rules ?? []),
        ]

        if (props.required)
            r.push(TestRequired)

        return r.length > 0 ? r : undefined
    })

</script>