<template>
    <v-col
        :class="colClass"
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item v-if="!alwaysOpen && mIsSelecting" @click="mIsSelecting = false"
            :subtitle="label">
            <template #append>
                <v-row class="ma-0 pa-0">
                    <slot name="actions" />
                    <v-icon>$chevron-up</v-icon>
                    <slot name="actionsRight" />
                    <v-menu 
                        v-if="showSettings"
                        offset-y 
                        :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                            <v-btn 
                                icon="$cog"
                                :size="mSize"
                                title="Settings"
                                v-bind="props" />
                        </template>
                        <v-list>
                            <slot name="settings" />
                        </v-list>
                    </v-menu>
                </v-row>
            </template>
        </v-list-item>
        <v-slide-y-transition hide-on-leave group>
            <v-text-field
                v-if="(alwaysOpen || mIsSelecting) && isLengthyArray(searchProps)"
                @click:prepend-inner="ui.searchString.value = undefined"
                hide-details
                key="1"
                placeholder="Search"
                :prepend-inner-icon="ui.searchString.value != null ? '$close' : undefined"
                v-model="ui.searchString.value">
                <template #append-inner>
                    <v-btn
                        v-if="canRefresh"
                        @click="ui.refresh({ deepRefresh: true })"
                        icon="$refresh"
                        :size="mSize"
                        variant="text" />
                </template>
            </v-text-field>
            <v-virtual-scroll
                v-if="(alwaysOpen || mIsSelecting) && useVirtualScroller"
                :height="height"
                item-height="50"
                :items="ui.filteredItems.value"
                key="2">
                <template #default="{ item }">
                    <slot name="item" v-bind:item="item" v-bind:selectItem="selectItem(item)" :active="isActive(item)">
                        <v-list-item @click="selectItem(item)" :active="isActive(item)" color="primary">
                            <slot v-bind:item="item">
                                <v-list-item-title v-if="itemText != null || textFilter != null || textFunction != null">
                                    {{ displayTitle(item) }}
                                </v-list-item-title>
                                <v-list-item-subtitle v-if="itemSubtext != null || subtextFilter != null || subtextFunction != null">
                                    {{ displaySubtitle(item) }}
                                </v-list-item-subtitle>
                            </slot>
                        </v-list-item>
                    </slot>
                </template>
            </v-virtual-scroll>
            <v-list
                v-else-if="alwaysOpen || mIsSelecting"
                :bg-color="transparent ? 'transparent' : undefined"
                :height="height"
                key="3"
                width="100%">
                <v-list-item
                    v-if="canSelectNone"
                    key="-1"
                    density="compact"
                    @click="selectItem(null)"
                    subtitle="(Select None)" />
                <v-slide-x-transition group hide-on-leave>
                    <template v-for="(fItem, fInd) in ui.filteredItems.value" :key="`${fItem.id ?? fInd}-list-item`">
                        <slot name="item" 
                            :item="fItem"
                            :index="fInd"
                            :size="mSize"
                            :isActive="isActive(fItem)"
                            :selectItem="selectItem">
                            <v-list-item
                                :active="isActive(fItem)"
                                :value="fItem"
                                @click="selectItem(fItem)">
                                <slot :item="fItem" :index="fInd" :size="mSize">
                                    <v-list-item-title v-if="itemText != null || textFilter != null || textFunction != null">
                                        {{ displayTitle(fItem) }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle v-if="itemSubtext != null || subtextFilter != null || subtextFunction != null">
                                        {{ displaySubtitle(fItem) }}
                                    </v-list-item-subtitle>
                                </slot>
                            </v-list-item>
                        </slot>
                    </template>
                </v-slide-x-transition>
            </v-list>
            <slot v-else name="selected" :item="selectedItem" :open="openList">
                <v-list-item
                    @click="openList"
                    key="4"
                    :title="label"
                    :subtitle="displayTitle(selectedItem) ?? placeholder">
                    <template #append>
                        <v-row no-gutters>
                            <slot name="actions" />
                            <v-icon>$chevron-down</v-icon>
                            <slot name="actionsRight" />
                            <v-menu
                                v-if="showSettings"
                                offset-y 
                                :close-on-content-click="false">
                                <template v-slot:activator="{ props }">
                                    <v-btn 
                                        icon
                                        v-bind="props"
                                        :size="mSize"
                                        title="Settings" />
                                </template>
                                <v-list>
                                    <slot name="settings" />
                                </v-list>
                            </v-menu>
                        </v-row>
                    </template>
                </v-list-item>
            </slot>
            
        </v-slide-y-transition>
        
        <v-overlay 
            v-model="ui.isLoading.value"
            class="align-center justify-center text-center"
            contained
            persistent>
            <v-progress-circular indeterminate />
            <p>{{ ui.loadingMsg.value }}</p>
        </v-overlay>
    </v-col>
    
</template>

<script setup lang="ts">
    import { type ListProps, useList } from '../composables/list.ts'
    import { useFilters } from '../composables/filters.ts'
    import { isLengthyArray, nestedValue } from '../composables/helpers.ts'
    import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface SelectProps extends ListProps<any, any, any> {
        alwaysOpen?: boolean
        canRefresh?: boolean
        canSearch?: boolean
        canSelectNone?: boolean
        colClass?: string
        cols?: string | boolean
        height?: string
        isMobile?: boolean
        isEditing?: boolean
        isSelecting?: boolean
        items?: [],
        itemSubtext?: string
        itemText?: string
        itemValue?: string //inherited
        label?: string
        lg?: string | boolean
        modelValue?: any
        md?: string | boolean
        nav?: string
        placeholder?: string
        showSettings?: boolean
        sm?: string | boolean
        subtextFilter?: string
        subtextFunction?: Function
        textFilter?: string
        textFunction?: Function
        transparent?: boolean
        useVirtualScroller?: boolean
    }

    const emit = defineEmits(['update:modelValue', 'change'])

    const props = withDefaults(defineProps<SelectProps>(), {
        canRefresh: true,
        eager: true,
        height: '400',
        isEditing: undefined,
        sortOrder: 'Ascending',
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const mIsSelecting = ref((props.alwaysOpen || props.isSelecting) ?? false)
    const mSize = inject('size', () => ref('small'), true)
    const mIsEditing = inject('isEditing', () => ref(false), true)
    const cIsEditing = computed(() => props.isEditing ?? mIsEditing.value)

    const ui = useList(props, undefined, {
        // useBladeSrc: false,
        // useRouteSrc: false
    })

    const filters = useFilters()

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

    const isActive = computed(() => (item: any) => {
        return (props.itemValue ? item[props.itemValue] : item) == props.modelValue
    })

    function openList() {
        if (cIsEditing.value)
            mIsSelecting.value = true
    }

    function selectItem(item: any) {
        mIsSelecting.value = false

        if (item != null || props.canSelectNone) {
            let v = item

            if (item != null && props.itemValue != null)
                v = item[props.itemValue]

            emit('update:modelValue', v)
            emit('change', v)
        }
    }

    const selectedItem = computed(() => {
        const idProp = props.itemValue ?? 'id'
        return (props.modelValue != null && ui.asyncItems.value != null) ? ui.asyncItems.value.find((x: any) => x[idProp] == props.modelValue) : null
    })
    
    const mIsMobile = inject('isMobile', () => ref(false), true)
    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>