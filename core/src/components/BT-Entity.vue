<template>
    <div :class="inline ? 'd-inline' : ''">
        <v-slide-x-transition hide-on-leave>
            <div v-if="inline && ui.isLoading.value" class="align-center justify-center text-center">
                <v-progress-circular indeterminate size="20" />
            </div>
            <div v-else-if="ui.asyncItem.value != null" key="1" :class="inline ? 'd-inline' : ''">
                <slot name="prepend" v-bind:item="ui.asyncItem.value">
                    {{ prefix }}
                </slot>
                <slot 
                    v-bind:item="ui.asyncItem.value"
                    v-bind:deleteItem="ui.deleteItem"
                    v-bind:save="ui.saveItem">
                    {{ displayText }}
                </slot>
                <slot name="append" v-bind:item="ui.asyncItem.value" />
            </div>
            <div v-else key="2" :class="inline ? 'd-inline' : ''">
                <slot name="alternate" v-bind:item="ui.asyncItem.value">
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
    import { type ItemProps, useItem } from '../composables/item.ts'
    import { useFilters } from '../composables/filters.ts'
    import { nestedValue } from '../composables/helpers.ts'
import { useNavigation } from '../composables/navigation.ts';
    
    interface BTEntityProps extends ItemProps {
        alternateText?: string
        inline?: boolean
        isEditing?: boolean
        itemText?: string
        label?: string
        prefix?: string
        textFilter?: string
    }

    const props = withDefaults(defineProps<BTEntityProps>(), {
        eager: true
    })

    const filters = useFilters()
    const ui = useItem(props)
    const nav = useNavigation()

    const mItemText = props.itemText ?? (props.nav != null ? nav.findItemText(props.nav) : undefined) ?? undefined
    const displayText = computed(() => {
        var t = toValue(ui.asyncItem);

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