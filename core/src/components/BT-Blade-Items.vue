<template>
    <bt-blade
        bladeBasic
        :bladeName="bladeName"
        :bladeStartShowing="bladeStartShowing"
        :density="density"
        :flat="flat"
        :errorMsg="ui.errorMsg.value"
        :hideSubtoolbar="hideSubtoolbar"
        :hideToolbar="hideToolbar"
        :label="mLabel"
        :loadingMsg="ui.loadingMsg.value"
        :preset="preset"
        :size="size"
        :transparent="transparent"
        :variant="variant">
        <template #blade-toolbar>
            <slot name="blade-toolbar"
                :refresh="ui.refresh"
                :searchString="ui.searchString"
                :showSearch="ui.showSearch"
                :toggleSearch="ui.toggleSearch">
            </slot>
        </template>
        <template #blade-toolbar-left>
            <div v-if="showDialogSearch" class="d-flex">
                <v-btn :icon="ui.showSearch.value ? '$close' : '$magnify'" :size="size" @click="ui.toggleSearch" variant="text" />
                <v-slide-x-reverse-transition>
                    <v-text-field
                        v-if="ui.showSearch.value"
                        @click:appendInner="() => ui.refresh({ deepRefresh: true })"
                        append-inner-icon="$magnify"
                        autofocus
                        :density="density"
                        flat
                        hide-details
                        placeholder="Find"
                        ref="inlineSearchEl"
                        variant="solo"
                        width="300"
                        v-model="ui.searchString.value" />
                </v-slide-x-reverse-transition>
            </div>
        </template>
        <template #blade-toolbar-right>
            <slot name="toolbar-right" />
            <v-btn v-if="!mHideRefresh" icon="$refresh" @click="ui.refresh({ deepRefresh: true })" :size="size" title="Refresh" variant="text" />
            <v-btn v-if="mCanAdd" icon="$plus" @click="ui.add(variant)" :size="size" :disabled="!auth.canEdit(nav)" title="Add" variant="text" />
        </template>
        <template #subtoolbar>
            <slot name="subtoolbar">
                <v-menu 
                    v-if="!mHideSubtoolbarSettings"
                    :close-on-content-click="false"
                    :density="density">
                    <template v-slot:activator="{ props }">
                        <v-btn icon="$cog" :size="size" v-bind="props" variant="text" />
                    </template>
                    <v-list :density="density" min-width="300">
                        <v-menu
                            v-if="!mHideColumns"
                            :close-on-content-click="false"
                            :density="density"
                            location="end">
                            <template v-slot:activator="{ props }">
                                <v-list-item v-bind="props" prepend-icon="$view-column" subtitle="Columns" />
                            </template>
                            <v-list>
                                <v-list-item 
                                    v-for="(headerOpt, ind) in ui.headerOptions.value" 
                                    :key="ind"
                                    :prepend-icon="headerOpt.hide === true ? 'mdi' : '$check'"
                                    :subtitle="headerOpt.title"
                                    @click="headerOpt.hide = !headerOpt.hide" />
                            </v-list>
                        </v-menu>
                        <v-list-item v-if="archiveBladeName != null"
                            :density="density"
                            prepend-icon="$archive-outline"
                            subtitle="Archives"
                            :to="{ name: archiveBladeName }" />
                        <v-list-item v-if="canShowInactive"
                            :density="density"
                            prepend-icon="$eraser"
                            :subtitle="ui.showInactive.value ? 'Hide Inactive' : 'Show Inactive'"
                            @click="ui.showInactive.value = !ui.showInactive.value" />
                        <v-list-item v-if="canExportCSV"
                            :density="density"
                            prepend-icon="$file-delimited-outline"
                            subtitle="Export To CSV"
                            @click="ui.exportToCSV" />
                        <slot name="settings" 
                            :items="ui.filteredItems.value"
                            :allItems="ui.asyncItems.value"
                            :size="size"></slot>
                    </v-list>
                </v-menu>
                
                <v-slide-y-transition group hide-on-leave>
                    <v-btn v-if="(canSearch !== false || isLengthyArray(searchProps)) && !ui.showSearch.value"
                        icon="$magnify"
                        key="11"
                        :size="size"
                        @click="ui.toggleSearch" />

                    <v-text-field
                        v-if="(canSearch !== false || isLengthyArray(searchProps)) && ui.showSearch.value"
                        @click:appendInner="ui.refresh"
                        @click:prependInner="ui.toggleSearch"
                        @keyup.native.enter="ui.refresh"
                        append-inner-icon="$magnify"
                        prepend-inner-icon="$close"
                        :density="density"
                        flat
                        hide-details
                        ref="searchEl"
                        key="12"
                        placeholder="Find"
                        variant="outlined"
                        v-model="ui.searchString.value" />
                </v-slide-y-transition>

                <slot name="actions" :allItems="ui.asyncItems.value" :size="size" />
                <v-spacer v-if="variant != 'inline'" />
                <slot name="actions-right" :allItems="ui.asyncItems.value" :size="size" />
                <v-menu v-if="!mHideFilters && isLengthyArray(ui.filters.value)" 
                    :close-on-content-click="false" 
                    :density="density"
                    location="start">
                    <template v-slot:activator="{ props }">
                        <v-btn icon="$filter" :size="size" v-bind="props" variant="text" />
                    </template>
                    <v-list 
                        class="pa-0"
                        :density="density"
                        open-strategy="multiple"
                        select-strategy="classic"
                        v-model:selected="ui.selectedFilters.value">
                        <template v-for="(filter, ind) in ui.filters.value" :key="ind">
                            <v-list-item :subtitle="filter" :value="ind">
                                <template v-slot:prepend="{ isActive }">
                                    <v-slide-x-transition>
                                        <v-icon :size="size">{{ isActive ? '$check' : '' }}</v-icon>
                                    </v-slide-x-transition>
                                </template>
                            </v-list-item>
                        </template>
                        <v-fade-transition hide-on-leave group>
                            <v-btn
                                v-if="ui.filtersChanged.value"
                                block
                                @click="() => ui.refresh({ resetSearch: true })"
                                :size="size">
                                <v-icon start :size="size">$filter</v-icon>Apply
                            </v-btn>
                        </v-fade-transition>
                    </v-list>
                </v-menu>
            </slot>
        </template>
        <template #content="{ bladeData, isMobile }">
            <slot name="d"
                :items="ui.asyncItems">
            </slot>
            <slot name="body" 
                :bladeData="bladeData"
                :items="ui.filteredItems.value"
                :allItems="ui.asyncItems.value"
                :refresh="ui.refresh"
                :searchString="ui.searchString"
                :showSearch="ui.showSearch"
                :size="size"
                :style="contentStyle"
                :toggleSearch="ui.toggleSearch">
                <div v-if="showInlineSearch" class="d-flex">
                    <v-btn :icon="ui.showSearch.value ? '$close' : '$magnify'" :size="size" @click="ui.toggleSearch" variant="text" />
                    <v-slide-x-reverse-transition>
                        <v-text-field
                            v-if="ui.showSearch.value"
                            @click.append-inner-icon="ui.refresh"
                            @keyup.native.enter="ui.refresh"
                            append-inner-icon="$magnify"
                            autofocus
                            :density="density"
                            flat
                            hide-details
                            placeholder="Find"
                            ref="inlineSearchEl"
                            variant="solo"
                            v-model="ui.searchString.value" />
                    </v-slide-x-reverse-transition>
                </div>
                <slot name="top"
                    :refresh="ui.refresh"
                    :searchString="ui.searchString"
                    :showSearch="ui.showSearch"
                    :toggleSearch="ui.toggleSearch"
                    :size="size"
                    :allItems="ui.asyncItems.value"
                    :items="ui.filteredItems.value"></slot>
                <div v-if="!isLengthyArray(ui.asyncItems.value)" :class="scrollY ? 'overflow-y-auto' : ''" :style="contentStyle">
                    <slot name="notFound" :bladeData="bladeData" :refresh="ui.refresh" :size="size" />
                </div>
                <v-list
                    v-else-if="selectSingle || selectMulti || showListOnly === true || isMobile"
                    :active-class="activeClass"
                    class="pt-0"
                     :class="scrollY ? 'overflow-y-auto' : ''"
                    :bg-color="transparent ? 'transparent' : undefined"
                    flat
                    :density="density"
                    :lines="lines"
                    :mandatory="!canUnselect"
                    :selectable="selectSingle || selectMulti"
                    :select-strategy="selectSingle ? 'single-independent' : 'independent'"
                    :style="contentStyle"
                    v-model:selected="mSelected">
                    <v-slide-x-transition group hide-on-leave>
                        <template 
                            v-for="(fItem, fInd) in ui.filteredItems.value"
                            :key="`${fItem.id}${fInd}-table-list-item`">
                            <slot name="listItem" 
                                :bladeData="bladeData"
                                :deleteItem="() => ui.deleteItem(fItem)"
                                :item="fItem"
                                :index="fInd"
                                :size="size"
                                :select="ui.selectItem">
                                <v-list-item
                                    class="mouse-item"
                                    :density="density"
                                    :ripple="ripple"
                                    :value="fItem"
                                    @click="ui.selectItem(fItem, variant)"
                                    @mouseover="$emit('mouse-over-item', fItem)">
                                    <template #title>
                                        <slot name="itemTitle" :item="fItem" :index="fInd" :size="size">
                                            <span v-for="(opt, ind) in ui.titleOptions.value" :key="ind">
                                                <slot v-for="(title, tInd) in opt.values" :name="title.value" :key="tInd" :item="fItem" class="mr-1">
                                                    <bt-header-option :option="title" :data="fItem" />
                                                </slot>
                                            </span>
                                        </slot>
                                    </template>
                                    <template #subtitle>
                                        <slot name="itemSubtitle" :item="fItem" :index="fInd" :size="size">
                                            <span v-for="(opt, ind) in ui.subtitleOptions.value" :key="ind">
                                                <slot v-for="(title, tInd) in opt.values" :name="title.value" :key="tInd" :item="fItem" class="mr-1">
                                                    <bt-header-option :option="title" :data="fItem" />
                                                </slot>
                                            </span>
                                        </slot>
                                    </template>
                                    <template #prepend>
                                        <slot name="itemPrepend" :item="fItem" :index="fInd" :size="size"></slot>
                                    </template>
                                    <template v-if="!hideActions" v-slot:append>
                                        <v-row no-gutters :class="mFadingActions ? 'actionButtons' : null">
                                            <slot name="itemActions" :item="fItem" :index="fInd" :items="ui.asyncItems.value" :size="mActionButtonSize" />
                                            <v-slide-x-transition group hide-on-leave>
                                                <v-icon v-if="fItem.errorMsg != null"
                                                    color="warning"
                                                    key="1"
                                                    :size="mActionButtonSize"
                                                    :title="fItem.errorMsg">$alert-circle</v-icon>

                                                <v-btn v-if="canDelete && ui.isDeletable.value(fItem)"
                                                    @click.stop="ui.deleteItem(fItem)"
                                                    class="text-error"
                                                    :disabled="!auth.canEdit(nav)"
                                                    icon="$delete"
                                                    key="2"
                                                    :loading="fItem.loadingCount > 0"
                                                    :size="mActionButtonSize"
                                                    variant="text" />

                                                <v-btn v-if="canRestore && ui.isRestorable.value(fItem)"
                                                    @click.stop="ui.restoreItem(fItem)"
                                                    :disabled="!auth.canEdit(nav)"
                                                    key="3"
                                                    icon="$eraser-variant"
                                                    :loading="fItem.loadingCount > 0"
                                                    :size="mActionButtonSize"
                                                    variant="text" />
                                            </v-slide-x-transition>
                                        </v-row>
                                    </template>
                                </v-list-item>
                            </slot>
                            <v-divider v-if="dividers" :key="'d' + fInd.toString()" />
                        </template>
                    </v-slide-x-transition>
                </v-list>
                <v-table v-else-if="showTableOnly === true || !isMobile"
                    class="text-body-2 overflow-y-auto"
                    :density="density"
                    :fixed-header="fixedHeader"
                    hover
                    :style="contentStyle">
                    <thead>
                        <tr>
                            <th v-for="header in ui.tableHeaders.value" :key="header.value" :class="`d-none d-${header.showSize ?? 'sm'}-table-cell`">
                                {{ header.title }}
                            </th>
                            <th v-if="!hideActions" key="itemActions" class="text-right" >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <v-slide-x-transition group hide-on-leave>
                            <tr v-for="(tableRow, tableRowInd) in ui.filteredItems.value" :key="`${tableRow.id}${tableRowInd}`"
                                @click="ui.selectItem(tableRow, variant)">
                                <td v-for="tableCol in ui.tableHeaders.value" :key="'1' + tableCol.value" :class="`d-none d-${tableCol.showSize ?? 'sm'}-table-cell`">
                                    <slot :name="tableCol.value" :item="tableRow" :options="tableCol">
                                        <bt-header-option :option="tableCol" :data="tableRow" />
                                    </slot>
                                </td>
                                <td v-if="!hideActions" :key="'itemActions' + tableRow.id" class="text-right">
                                    <v-fade-transition hide-on-leave>
                                        <v-row no-gutters :class="mFadingActions ? 'actionButtons' : null" class="flex-nowrap">
                                            <v-spacer />
                                            <slot name="itemActions" :item="tableRow" :allItems="ui.asyncItems.value" :items="ui.filteredItems.value" :size="mActionButtonSize" :density="density" />
                                            <v-icon v-if="tableRow.errorMsg != null"
                                                color="warning"
                                                key="1"
                                                :size="mActionButtonSize"
                                                :title="tableRow.errorMsg">$alert-circle</v-icon>
                                            
                                            <v-btn v-if="canDelete && ui.isDeletable.value(tableRow)"
                                                @click.stop="ui.deleteItem(tableRow)"
                                                class="text-error"
                                                :disabled="!auth.canEdit(nav)"
                                                icon="$delete"
                                                key="2"
                                                :size="mActionButtonSize"
                                                variant="text" />

                                            <v-btn v-if="canRestore && ui.isRestorable.value(tableRow)"
                                                @click.stop="ui.restoreItem(tableRow)"
                                                :disabled="!auth.canEdit(nav)"
                                                key="3"
                                                icon="$eraser-variant"
                                                :size="mActionButtonSize"
                                                variant="text" />
                                        </v-row>
                                    </v-fade-transition>
                                </td>
                            </tr>
                        </v-slide-x-transition>
                    </tbody>
                </v-table>
                <slot name="bottom" :size="size" :allItems="ui.asyncItems.value" :items="ui.filteredItems.value"></slot>
            </slot>
            <div v-if="!isNullOrEmpty(paginate)">
                <v-pagination
                    v-model="ui.currentPage.value"
                    :length="ui.totalPages.value" />
            </div>
        </template>
    </bt-blade>
</template>

<script setup lang="ts">
    import { type BladeDensity } from '../composables/blade.ts'
    import type { ListProps, ListEvents } from '../composables/list.ts'
    import { isLengthyArray, isNullOrEmpty } from '../composables/helpers.ts'
    import { useAuth } from '../composables/auth.ts'
    import { useList } from '../composables/list.ts'
    import { useNavigation } from '../composables/navigation.ts'
    import { useNested } from '../composables/nested.ts'
    import { usePresets } from '../composables/presets.ts'
    import { computed, ref, watch, onMounted, ComponentPublicInstance, nextTick } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useHeights } from '../composables/heights.ts'
    import { useDisplay } from 'vuetify'

    interface PageEvents extends ListEvents {
        // (e: 'mouse-over-item', item: any): void
        (e: 'update:selected', value: any): void
     }

    interface PageProps extends ListProps<any, any, any> {
        actionButtonSize?: string
        activeClass?: string
        actualHeight?: string
        actualUsedHeight?: number
        archiveBladeName?: string
        canAdd?: boolean
        canDelete?: boolean
        canEdit?: boolean
        canExportCSV?: boolean
        canRestore?: boolean
        canSearch?: boolean
        canShowInactive?: boolean
        density?: BladeDensity
        dividers?: boolean
        fadingActions?: boolean
        fixedHeader?: boolean
        flat?: boolean
        hideColumns?: boolean
        hideFilters?: boolean
        hideFooter?: boolean
        hideRefresh?: boolean
        hideSubtoolbar?: boolean
        hideSubtoolbarSettings?: boolean
        hideToolbar?: boolean
        itemValue?: string
        label?: string
        lines?: 'one' | 'two' | 'three'
        paginate?: 'server' | 'local'
        preset?: string
        returnCSV?: boolean
        returnIndex?: boolean
        ripple?: boolean
        showCount?: boolean
        scrollY?: boolean
        selectMulti?: boolean
        selectSingle?: boolean
        selected?: any
        showListOnly?: boolean
        showTableOnly?: boolean
        size?: string | number
        transparent?: boolean
    }

    const emit = defineEmits<PageEvents>()

    const props = withDefaults(defineProps<PageProps>(), {
        actionButtonSize: 'x-small',
        canAdd: true,
        canDelete: true,
        canSearch: true,
        canSelect: true,
        canUnselect: true,
        density: 'compact',
        dividers: true,
        eager: true,
        fadingActions: undefined,
        fixedHeader: true,
        hideSubtoolbarSettings: false,
        itemsPerPage: 75,
        ripple: true,
        selectMulti: false,
        selectSingle: false,
        showCount: false,
        size: 'small',
        sortOrder: 'Ascending',
        useBladeSrc: undefined,
        useRouteSrc: undefined,
        variant: 'page'
    })

    const searchEl = ref<ComponentPublicInstance | null>(null)
    const inlineSearchEl = ref<ComponentPublicInstance | null>(null)
    const { getValue } = useNested()
    const { xs } = useDisplay()
    const route = useRoute()
    const presets = usePresets(props.preset)
    const { findDisplay } = useNavigation()
    const auth = useAuth()
    const heightCalc = useHeights()
    const ui = useList<any, any, any>(props, emit, { 
        hideActions: true,
        onError: (err: any) => {
            if (err.code == 401) {
                auth.logout()
                auth.login(location.pathname)
            }
        },
        router: useRouter(),
        route: route
    })
    
    const mActionButtonSize = computed(() => props.actionButtonSize ?? props.size)
    const mCanAdd = computed(() => (presets.canAdd as boolean ?? props.canAdd))
    const mFadingActions = computed(() => {
        const res = (presets.fadingActions as boolean ?? props.fadingActions)
        return res != null ? res : !xs.value
    })
    const mHideColumns = computed(() => (presets.hideColumns as boolean ?? props.hideColumns))
    const mHideFilters = computed(() => (presets.hideFilters as boolean ?? props.hideFilters))
    const mHideRefresh = computed(() => (presets.hideRefresh as boolean ?? props.hideRefresh))
    const mHideSubtoolbarSettings = computed(() => (presets.hideSubToolbarSettings as boolean ?? props.hideSubtoolbarSettings))
    const mLabel = computed(() => {
        let l = props.label ?? (props.variant == 'page' ? route?.meta?.displayName as string : undefined) ?? findDisplay(props.nav ?? props.bladeName ?? '')
        if (props.showCount == true && ui.filteredItems.value?.length != null && ui.asyncItems.value?.length != null)
            l = `${l} (${ui.filteredItems.value.length} of ${ui.asyncItems.value.length})`
        return l
    })
    const showDialogSearch = computed(() => props.variant == 'dialog' && (props.canSearch || isLengthyArray(props.searchProps)))
    const showInlineSearch = computed(() => props.variant == 'inline' && (props.canSearch || isLengthyArray(props.searchProps)))
    const contentStyle = computed(() => {
        if (props.actualHeight != null) {
            return `height: calc(${props.actualHeight})`
        }
        else if (props.actualUsedHeight != null) {
            return `height: calc(100vh - ${heightCalc.getUsedHeight(props.actualUsedHeight)}px)`
        }
        else {
            let mUsedHeight = 154 //231
            if (props.hideSubtoolbar == true)
                mUsedHeight -= 48
            if (props.hideToolbar == true)
                mUsedHeight -= 48
            if (isNullOrEmpty(props.paginate))
                mUsedHeight -= 58
            
            return `height: calc(100vh - ${heightCalc.getUsedHeight(mUsedHeight)}px)`
        }
    })

    const internalSelected: any = ref([])
    const mSelected = computed({
        get() {
            const sList = props.selected ?? internalSelected.value

            let selectedList = props.returnCSV ? sList.split(',') : sList
            
            if (props.selectSingle && !Array.isArray(selectedList))
                selectedList = [selectedList]

            if (props.returnIndex && props.returnCSV) {
                return selectedList.map((x: any) => Number.parseInt(x))
            }

            //assuming the selection is already of type itemValue
            let returnList: any[] = [] //selectedList
            
            if (props.itemValue != null && isLengthyArray(selectedList)) {
                ui.filteredItems.value.forEach((itemOption: any) => { //, ind: number) => {
                    const v = getValue(itemOption, props.itemValue)
                    if (selectedList.some((x: any) => x == v))
                        returnList.push(itemOption)
                })
            }
            else if (props.itemValue == null) {
                returnList.push(...selectedList)
            }
            
            if (props.selectSingle)
                return isLengthyArray(returnList) ? [returnList[0]] : [] //[-1]

            return returnList
        },
        set(value: any) {
            if (value == null) {
                emit('update:selected', value)
                internalSelected.value = []
            }
            else {
                let r = value
                if (props.returnIndex) {
                    r = value.map((x: any) => {
                        return ui.filteredItems.value.indexOf((y: any) => y === x)
                    })
                }
                else if (props.itemValue != null) {
                    r = value.map((x: any) => { //actual object
                        return getValue(x, props.itemValue)
                        // return getValue(ui.filteredItems.value[x], props.itemValue)
                    })
                }

                if (props.selectSingle) {
                    r = isLengthyArray(r) ? r[0] : undefined
                    internalSelected.value = r != null ? [r] : []
                }
                else {
                    internalSelected.value = r
                }

                if (props.returnCSV && r != null)
                    r = r.toString()

                emit('update:selected', r)
                internalSelected.value = r
            }
        }
    })

    function focusSearch() {
        nextTick(() => {
            let el: any
            if (showInlineSearch.value) {
                el = inlineSearchEl.value?.$el.querySelector("input:not([type=hidden]),textarea:not([type=hidden])")
            }
            else if (ui.showSearch.value) {
                el = searchEl.value?.$el.querySelector("input:not([type=hidden]),textarea:not([type=hidden])")
            }

            el?.focus()
        })
    }

    watch(ui.showSearch, () => {
        focusSearch()
    })

    onMounted(() => {
        focusSearch()
    })
</script>

<style scoped>

    tr .actionButtons {
        opacity: 0;
        transition: none;
    }

    tr:hover .actionButtons {
        opacity: 1;
        transition: opacity .5s ease-in-out .1s;
    }

    .mouse-item .actionButtons {
        opacity: 0;
        transition: none;
    }

    .mouse-item:hover .actionButtons {
        opacity: 1;
        transition: opacity .5s ease-in-out .1s;
    }
</style>