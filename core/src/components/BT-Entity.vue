<template>
    <div :class="inline ? 'd-inline' : ''">
        <v-slide-x-transition hide-on-leave>
            <div v-if="inline && ui.isLoading.value" class="align-center justify-center text-center">
                <v-progress-circular indeterminate size="20" />
            </div>
            <div v-else-if="ui.asyncItem.value != null" key="1"
                :class="{ 'd-inline': inline, 'text-truncate': truncate }"
                :style="truncate == true ? 'display: inline-block;' : ''">
                <slot name="prepend" v-bind:item="ui.asyncItem.value" :refresh="ui.refresh">
                    {{ prefix }}
                </slot>
                <slot
                    name="default"
                    :isChanged="ui.isChanged"
                    :item="ui.asyncItem.value"
                    :deleteItem="ui.deleteItem"
                    :refresh="ui.refresh"
                    :save="() => ui.saveItem(ui.asyncItem.value)">
                    {{ displayText }}
                </slot>
                <slot name="append" v-bind:item="ui.asyncItem.value" :refresh="ui.refresh">
                    {{ suffix }}
                </slot>
            </div>
            <div v-else key="2" :class="inline ? 'd-inline' : ''">
                <slot name="alternate" :item="ui.asyncItem.value" :refresh="ui.refresh">
                    <span key="3">{{ alternateText }}</span>
                </slot>
            </div>
        </v-slide-x-transition>
        <v-overlay
            v-if="!inline"
            v-model="ui.isLoading.value"
            class="align-center justify-center text-center"
            contained
            persistent>
            <v-progress-circular indeterminate />
            <p>{{ ui.loadingMsg }}</p>
        </v-overlay>
    </div>
</template>

<script setup lang="ts">
    import { computed, toValue } from 'vue'
    import { ItemEvents, type ItemProps, useItem } from '../composables/item.ts'
    import { useFilters } from '../composables/filters.ts'
    import { nestedValue } from '../composables/helpers.ts'
    import { useNavigation } from '../composables/navigation.ts';
    
    interface BTEntityProps extends ItemProps<any, any, any> {
        alternateText?: string
        inline?: boolean
        isEditing?: boolean
        itemText?: string
        label?: string
        prefix?: string
        suffix?: string
        textFilter?: string
        textFunction?: (item: any) => string
        truncate?: boolean
    }

    const emit = defineEmits<ItemEvents>()

    const props = withDefaults(defineProps<BTEntityProps>(), {
        eager: false,
        eagerWithID: true,
        isSingle: true
    })

    const filters = useFilters()
    const ui = useItem<any, any, any>(props, emit)
    const nav = useNavigation()

    const mItemText = props.itemText ?? (props.nav != null ? nav.findItemText(props.nav) : undefined) ?? undefined
    const displayText = computed(() => {
        var t = toValue(ui.asyncItem);

        if (props.textFunction != null)
            t = props.textFunction(t)
        
        if (mItemText != null) {
            t = nestedValue(ui.asyncItem.value, mItemText);
        }
        
        if (props.textFilter != null) {
            return filters.findFilter(props.textFilter)(t)
        }
        else {
            return t;
        }
    })
</script>