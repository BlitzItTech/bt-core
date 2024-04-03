<template>
    <v-dialog v-model="show">
        <div>
            <v-card
                :max-width="maxWidth ?? '400'"
                :min-width="minWidth"
                class="mx-auto"
                :title="title">
                <!-- <v-card-title v-if="title != null">{{ title }}</v-card-title> -->
                <v-card-text class="pa-0">
                    <v-text-field
                        v-if="ui.showSearch.value"
                        append-inner-icon="mdi-magnify"
                        density="compact"
                        hide-details
                        placeholder="Search"
                        v-model="ui.searchString.value" />
                    <!-- <div v-if="multiple" @click="selectAll" class="text-center my-1">
                        <v-btn>Select All</v-btn>
                    </div> -->
                    <v-list v-if="isLengthyArray(ui.filteredItems.value)"
                        class="overflow-y-auto"
                        v-model:selected="selection"
                        :height="height"
                        :select-strategy="multiple ? 'independent' : 'single-independent'"
                        @update:selected="maybeAccept">
                        <template v-for="(fItem) in ui.filteredItems.value" :key="index">
                            <v-list-item :value="fItem">
                                <slot v-bind:item="fItem">
                                    <v-list-item-title v-if="itemText != null || textFilter != null || textFunction != null">
                                        {{ displayTitle(fItem) }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle v-if="itemSubtext != null || subtextFilter != null || subtextFunction != null">
                                        {{ displaySubtitle(fItem) }}
                                    </v-list-item-subtitle>
                                </slot>
                            </v-list-item>
                            </template>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-row no-gutters>
                        <v-col :cols="multiple ? 6 : 12">
                            <v-btn v-if="required !== true" block @click="cancel">{{ cancelText ?? 'Cancel' }}</v-btn>
                        </v-col>
                        <v-col v-if="multiple == true" cols="6">
                            <v-btn block @click="accept" :disabled="!canAccept">{{ confirmText ?? 'OK' }}</v-btn>
                        </v-col>
                        
                    </v-row>
                </v-card-actions>
                <v-overlay 
                    v-model="ui.isLoading.value"
                    class="align-center justify-center text-center"
                    contained
                    persistent>
                    <v-progress-circular indeterminate />
                    <p>{{ ui.loadingMsg }}</p>
                </v-overlay>
            </v-card>
        </div>
    </v-dialog>
</template>
  
<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { isLengthyArray, isArrayOfLength, nestedValue } from '../composables/helpers'
    import { useFilters } from '../index'
    import { useList } from '../composables/list';
    import { type SelectDialogProps } from '../composables/dialogs'
    
    const props = withDefaults(defineProps<SelectDialogProps>(), {
        cancelValue: false,
        height: '400',
        showSearch: true
    })

    const emit = defineEmits(['confirm', 'cancel'])

    const ui = useList(props)
    const filters = useFilters()
    const selection = ref([])

    const displaySubtitle = computed(() => (item: any) => {
        let v = props.subtextFunction != null ? props.subtextFunction(item) : item
        v = props.itemSubtext != null ? nestedValue(v, props.itemSubtext) : v
        return props.subtextFilter != null ? filters.findFilter(props.subtextFilter)(v) : v
    })

    const displayTitle = computed(() => (item: any) => {
        let v = props.textFunction != null ? props.textFunction(item) : item
        v = props.itemText != null ? nestedValue(v, props.itemText) : v
        return props.textFilter != null ? filters.findFilter(props.textFilter)(v) : v
    })

    const canAccept = computed(() => {
        return !props.required || isLengthyArray(selection.value)
    })

    let show = false

    function getSelectedValues(items: any) {
        const res = props.itemValue != null ? items.map((x: any) => nestedValue(x, props.itemValue)) : items
        if (props.multiple) {
            return res
        }
        else {
            return res.length > 0 ? res[0] : null
        }
    }
    
    function accept() {
        if (props.required && !isLengthyArray(selection.value)) {
            //required
            return
        }

        show = false
        emit('confirm', getSelectedValues(selection.value))
    }

    function maybeAccept(items: any) {
        if (!props.multiple) {
            if (isArrayOfLength(items, 1) || (props.canUnselect && !isLengthyArray(items))) {
                show = false
                emit('confirm', getSelectedValues(items))
            }
        }
    }

    function cancel() {
        show = false
        emit('cancel', undefined)
    }

    onMounted(() => {
        show = true
    })

</script>