<template>
    <bt-blade
        :bladeName="bladeName"
        :density="density"
        :flat="flat"
        :errorMsg="ui.errorMsg.value"
        :hideSubtoolbar="useStepHeader != false || lastStep !== 0 || hideSubtoolbar"
        :hideToolbar="useStepHeader != false || lastStep !== 0 || hideToolbar"
        :label="mLabel"
        :loadingMsg="ui.loadingMsg.value"
        :preset="preset"
        :size="size"
        :transparent="transparent"
        :variant="variant">
        <template #blade-toolbar>
            <slot name="blade-toolbar"
                :newItem="newItem"
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
            <slot 
                :newItem="newItem"
                name="toolbar-right">

            </slot>
            <v-btn v-if="!mHideRefresh" icon="$refresh" @click="ui.refresh({ deepRefresh: true })" :size="size" title="Refresh" variant="text" />
            <v-btn v-if="mCanAdd" icon="$plus" @click="newItem" :size="size" :disabled="!auth.canEdit(nav)" title="Add" variant="text" />
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
                    :mode="ui.mode.value"
                    :newItem="newItem"
                    :refresh="ui.refresh"
                    :searchString="ui.searchString"
                    :showSearch="ui.showSearch"
                    :toggleSearch="ui.toggleSearch"
                    :size="size"
                    :allItems="ui.asyncItems.value"
                    :items="ui.filteredItems.value"></slot>
                <v-slide-x-transition hide-on-leave>
                    <div v-if="useStepHeader != false || lastStep != 0" class="d-flex align-center" density="compact" flat tile>
                        <slot name="step-toolbar"
                            :back="() => navBack()"
                            :item="currentItem"
                            :meta="currentMeta"
                            :navTo="navTo"
                            :nextStep="nextStep"
                            :title="mSingleLabel">
                            <v-btn icon="$chevron-left" @click="navBack" :disabled="!canMoveBack" variant="text" />
                            <v-btn icon="$chevron-right" @click="nextStep" :disabled="!canMoveNext" variant="text" />
                            <v-btn icon="$restart" @click="navTo(0)" :disabled="!canRestart" variant="text" size="small" />
                            <div class="text-h6 ml-3">{{ mSingleLabel }}</div>
                            <v-spacer />
                            <v-btn v-if="canSkip" icon="$debug-step-over" @click="skip" variant="text" text="Skip" />
                        </slot>
                    </div>
                </v-slide-x-transition>
                <v-window v-model="lastStep" class="ma-0 pa-0">
                    <v-window-item>
                        <slot 
                            :meta="currentMeta"
                            :mode="ui.mode.value"
                            name="firstStep"
                            :navTo="navTo"
                            :navToName="navToName"
                            :nextStep="nextStep">
                            <div v-if="!isLengthyArray(ui.asyncItems.value)" :class="scrollY ? 'overflow-y-auto' : ''" :style="contentStyle">
                                <slot 
                                    name="notFound" 
                                    :bladeData="bladeData" 
                                    :create="newItem"
                                    :navTo="navTo"
                                    :nextStep="nextStep"
                                    :refresh="ui.refresh" 
                                    :size="size"></slot>
                            </div>
                            <v-list
                                v-else-if="showListOnly || isMobile"
                                :active-class="activeClass"
                                class="pt-0"
                                :class="scrollY ? 'overflow-y-auto' : ''"
                                :bg-color="transparent ? 'transparent' : undefined"
                                flat
                                :density="density"
                                :lines="lines"
                                :style="contentStyle">
                                <v-slide-x-transition group hide-on-leave>
                                    <template
                                        v-for="(fItem, fInd) in ui.filteredItems.value"
                                        :key="`${fItem != null && fItem?.id != null ? fItem.id : fInd}-table-list-item`">
                                        <slot name="listItem" 
                                            :bladeData="bladeData"
                                            :deleteItem="() => ui.deleteItem(fItem)"
                                            :item="fItem"
                                            :index="fInd"
                                            :size="size"
                                            :select="() => selectItem(fItem)">
                                            <v-list-item
                                                class="mouse-item"
                                                :density="density"
                                                :ripple="ripple"
                                                :value="fItem"
                                                @click="selectItem(fItem)">
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
                                            @click="selectItem(tableRow)">
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
                        </slot>
                    </v-window-item>
                    <v-window-item
                        v-for="(step, ind) in steps"
                        :key="ind"
                        class="ma-0 pa-0">
                        <slot 
                            :isChanged="isChanged"
                            :item="currentItem"
                            :meta="currentMeta"
                            :mode="ui.mode.value"
                            :name="`${step.name}-top`"
                            :navTo="navTo"
                            :navToName="navToName"
                            :nextStep="nextStep">
                        </slot>
                        <v-card :style="stepStyle" class="overflow-y-auto">
                            <slot 
                                :meta="currentMeta"
                                :mode="ui.mode.value"
                                :name="`${step.name}`"
                                :isChanged="isChanged"
                                :item="currentItem"
                                :navTo="navTo"
                                :navToName="navToName"
                                :nextStep="nextStep"
                                :save="save"
                                :style="stepStyle">
                                
                            </slot>
                            <template v-if="step.hideActions !== true" #actions>
                                <slot 
                                    :meta="currentMeta"
                                    :mode="ui.mode.value"
                                    :name="`${step.name}-actions`"
                                    :isChanged="isChanged"
                                    :item="currentItem"
                                    :canMoveNext="canMoveNext"
                                    :canSave="canSave"
                                    :canSkip="canSkip"
                                    :navTo="navTo"
                                    :nextStep="nextStep"
                                    :save="save">
                                    <v-spacer />
                                    <v-btn v-if="canSave" prepend-icon="$content-save" @click="save" text="Save" />
                                    <v-btn v-if="canFinish" prepend-icon="$check" @click="navTo(0)" text="Done" />
                                    <v-btn v-if="canMoveNext" @click="nextStep" text="Next" />
                                </slot>
                            </template>
                        </v-card>
                        
                    </v-window-item>
                </v-window>
                <slot 
                    :mode="ui.mode.value"
                    name="bottom"
                    :newItem="newItem"
                    :size="size"
                    :allItems="ui.asyncItems.value"
                    :items="ui.filteredItems.value"></slot>
            </slot>
            <div v-if="lastStep == 0 && !isNullOrEmpty(paginate)">
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
    import { copyDeep, isLengthyArray, isNullOrEmpty } from '../composables/helpers.ts'
    import { useAuth } from '../composables/auth.ts'
    import { useList } from '../composables/list.ts'
    import { useNavigation } from '../composables/navigation.ts'
    import { usePresets } from '../composables/presets.ts'
    import { computed, ref, watch, onMounted, ComponentPublicInstance, nextTick, provide, onUnmounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useHeights } from '../composables/heights.ts'
    import { useDisplay } from 'vuetify'
    import { ItemEvents } from '../composables/item.ts'
    import { useSteps, releaseSteps, StepOption } from '../composables/steps.ts'
    import { useTracker } from '../composables/track.ts'

    interface PageEvents extends ListEvents, ItemEvents {
        // (e: 'update:stepIndex', item: number): void
        (e: 'change', index: number): void
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
        defaultNew?: boolean
        density?: BladeDensity
        dividers?: boolean
        fadingActions?: boolean
        fixedHeader?: boolean
        flat?: boolean
        getLabel?: (item: any, step?: StepOption<any>) => string | undefined
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
        // modelValue?: number
        onGetNewAsync?: () => Promise<any>
        onSelectAsync?: (copy: any, original: any) => Promise<any>
        paginate?: 'server' | 'local'
        preset?: string
        returnCSV?: boolean
        returnIndex?: boolean
        ripple?: boolean
        showCount?: boolean
        scrollY?: boolean
        selected?: any
        showListOnly?: boolean
        showTableOnly?: boolean
        size?: string | number
        steps?: StepOption<any>[]
        stepsID?: string
        // stepInd?: number
        // stepIndexToggle?: boolean
        trackChanges?: boolean
        trackIgnoreProps?: string[]
        trackProps?: string []
        transparent?: boolean
        useStepHeader?: boolean
    }

    const emit = defineEmits<PageEvents>()

    const props = withDefaults(defineProps<PageProps>(), {
        actionButtonSize: 'x-small',
        canAdd: true,
        canDelete: true,
        canSearch: true,
        canSelect: true,
        density: 'compact',
        dividers: true,
        eager: true,
        fadingActions: undefined,
        fixedHeader: true,
        hideSubtoolbarSettings: false,
        itemsPerPage: 75,
        ripple: true,
        showCount: false,
        size: 'small',
        sortOrder: 'Ascending',
        startEditing: true,
        trackChanges: true,
        useBladeSrc: undefined,
        useRouteSrc: undefined,
        useStepHeader: false,
        variant: 'page'
    })

    const stepOptions = computed(() => props.steps ?? [])
    const searchEl = ref<ComponentPublicInstance | null>(null)
    const inlineSearchEl = ref<ComponentPublicInstance | null>(null)
    const { xs } = useDisplay()
    const route = useRoute()
    const presets = usePresets(props.preset)
    const router = useRouter()
    const { findDisplay, findSingleDisplay } = useNavigation()
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
        onFinishedAsync: async (items: any) => {
            if (props.defaultNew === true && !isLengthyArray(items))
                newItem()
            else if (ui.id.value != null) {
                if (ui.id.value == 'new')
                    newItem()
                else {
                    if (items != null) {
                        var existing = items.find((x: any) => x.id == ui.id.value)
                        if (existing != null) {
                            currentItem.value = existing
                            restartTracker()
                            nextStep()
                        }
                    }
                }
            }
        },
        router: useRouter(),
        route: route
    })

    const history = ref<number[]>([])
    const lastStep = computed(() => history.value.length > 0 ? history.value[history.value.length - 1] : 0)
    
    const currentStepData = computed(() => lastStep.value > 0 ? stepOptions.value[lastStep.value - 1] : undefined)
    const canMoveBack = computed(() => lastStep.value > 0)
    const canMoveNext = computed(() => {
        if (lastStep.value >= stepOptions.value.length)
            return false

        if (currentStepData.value?.onCanMoveNext != null) {
            if (currentStepData.value.onCanMoveNext({ 
                isChanged: isChanged.value,
                item: currentItem.value, 
                meta: currentMeta.value, 
                mode: ui.mode.value 
            }) !== true)
                return false
        }
        
        return true
    })
    const canRestart = computed(() => lastStep.value > 0)
    const canSave = computed(() => {
        if (currentStepData.value?.onCanSave != null)
            if (currentStepData.value.onCanSave({ 
                isChanged: isChanged.value,
                item: currentItem.value, 
                meta: currentMeta.value, 
                mode: ui.mode.value 
            }) && isChanged.value)
                return true

        if (lastStep.value >= stepOptions.value.length && isChanged.value)
            return true

        return false
    })
    const canFinish = computed(() => {
        if (currentStepData.value?.onCanSave != null)
            if (currentStepData.value.onCanSave({
                isChanged: isChanged.value,
                item: currentItem.value, 
                meta: currentMeta.value, 
                mode: ui.mode.value 
            }) && !isChanged.value)
                return true

        if (lastStep.value >= stepOptions.value.length && !isChanged.value)
            return true

        return false
    })

    const canSkip = computed(() => {
        if (currentStepData.value?.onCanSkip != null)
            if (currentStepData.value.onCanSkip({ 
                isChanged: isChanged.value,
                item: currentItem.value, 
                meta: currentMeta.value, 
                mode: ui.mode.value
            }))
                return true

        return false
    })

    const isEditing = computed(() => {
        if (props.nav != null && !auth.canEdit(props.nav))
            return false

        return ui.isEditing.value
    })

    provide('isEditing', isEditing)

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
    const mSingleLabel = computed(() => {
        if (currentStepData.value?.label != null) {
            return currentStepData.value.label
        }
        else if (currentStepData.value?.getLabel != null)
            return currentStepData.value.getLabel({
                item: currentItem.value,
                meta: currentMeta.value
            });
        else if (props.getLabel != null) {
            return props.getLabel(currentItem.value, currentStepData.value)
        }
        else {
            return findSingleDisplay(props.nav ?? props.bladeName ?? '')
        }
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

    const stepStyle = computed(() => {
        return `height: calc(100vh - ${heightCalc.getUsedHeight(48)}px)`
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

    // const currentItem = ref<any>()
    const currentMeta = ref<any>()

    const { asyncItem: currentItem, isChanged, restartTracker } = useTracker<any>(undefined, {
        useTracker: props.trackChanges,
        propsToIgnore: props.trackIgnoreProps,
        propsToTrack: props.trackProps
    })

    async function selectItem(item: any) {
        currentItem.value = props.onSelectAsync != null ? (await props.onSelectAsync(copyDeep(item), item)) : copyDeep(item)
        currentMeta.value = {}

        if (currentItem.value?.id != null) {
            const to = { 
                ...route, 
                params: { 
                    ...route.params,
                    id: currentItem.value.id 
                }, 
                query: {},
                replace: true 
            }
            router.replace(to)
        }


        restartTracker()
        nextStep()
    }

    async function newItem() {
        var onNew = props.onGetNewAsync ?? (async () => {
            return {}
        })

        ui.mode.value = 'new'
        currentItem.value = await onNew()
        currentMeta.value = {}

        const to = { 
            ...route, 
            params: { 
                ...route.params,
                id: 'new'
            }, 
            query: {},
            replace: true 
        }

        router.replace(to)

        // restartTracker()
        
        nextStep()
    }

    function nextStep() {
        var newStepInd = lastStep.value + 1
        if (currentStepData.value?.onMoveNext != null) {
            var nextRes = currentStepData.value?.onMoveNext({
                item: currentItem.value,
                meta: currentMeta.value,
                mode: ui.mode.value,
                next: newStepInd
            })

            if (nextRes == null)
                return

            if (typeof nextRes == 'string') {
                if (nextRes == currentStepData.value.name)
                    return

                var ind = stepOptions.value.findIndex(step => step.name == nextRes)
                if (ind == null)
                    return

                if (ind >= 0)
                    newStepInd = ind + 1
            }
            else if (typeof nextRes == 'number') {
                if (nextRes == lastStep.value)
                    return

                newStepInd = nextRes
            }
        }

        if (newStepInd <= stepOptions.value.length)
            navTo(newStepInd)
    }

    function navBack() {
        history.value.pop()
    }

    function navTo(panelIndex: number) {
        if (panelIndex != 0) {
            var nextStepInd = panelIndex - 1
            if (nextStepInd < stepOptions.value.length) {
                var nextStep = stepOptions.value[nextStepInd]
                if (nextStep.onMoveInto != null) {
                    var nextRes = nextStep.onMoveInto({
                        item: currentItem.value,
                        meta: currentMeta.value,
                        mode: ui.mode.value,
                        from: lastStep.value,
                        thisStep: panelIndex
                    })

                    if (nextRes == null)
                        return

                    if (typeof nextRes == 'string') {
                        var ind = stepOptions.value.findIndex(step => step.name == nextRes) ?? -1
                        if (ind >= 0)
                            panelIndex = (ind + 1)
                    }
                    else if (typeof nextRes == 'number') {
                        panelIndex = nextRes
                    }
                }
            }
        }

        if (panelIndex == 0)
            history.value = [panelIndex]
        else if (lastStep.value != panelIndex) {
            if (history.value.length == 0)
                history.value.push(0)

            history.value.push(panelIndex)
        }
        
        if (panelIndex == 0) {
            const to = { ...route, params: {}, query: {}, replace: true }
            router.replace(to)

            if (props.startEditing == true)
                ui.mode.value = 'edit'
            else
                ui.mode.value = 'view'
        }
    }

    function navToName(stepName?: string) {
        if (stepName != null) {
            var stepIndex = stepOptions.value.findIndex(x => x.name == stepName)
            console.log(stepIndex)
            if (stepIndex >= 0) {
                navTo(stepIndex + 1)
            }
        }
    }

    function skip() {
        console.log('skip not implemented yet')
    }

    async function save() {
        if (currentItem.value == null)
            return

        var res = await ui.saveItem(currentItem.value)
        if (res != null) {
            currentItem.value = copyDeep(res)
            restartTracker()

            var nextInd = currentStepData.value?.onSaveMoveNext ?? 0

            if (typeof nextInd == 'number')
                navTo(nextInd)
            else if (typeof nextInd == 'boolean' && nextInd == true)
                nextStep()
        }
    }

    watch(lastStep, (v) => {
        emit('change', v)
    })

    watch(ui.showSearch, () => {
        focusSearch()
    })

    onMounted(() => {
        focusSearch()

        var qStep = route.query.step as string | undefined
        if (qStep != null)
            navToName(qStep)

        
        if (!isNullOrEmpty(props.stepsID))
            useSteps(props.stepsID!, {
                canFinish,
                canMoveBack,
                canMoveNext,
                canRestart,
                canSave,
                canSkip,
                currentItem,
                currentMeta,
                currentStepData,
                isChanged,
                lastStep,
                mode: ui.mode,
                navBack,
                navTo,
                navToName,
                newItem,
                nextStep,
                save,
                skip,
                stepOptions: props.steps
            })
    })

    onUnmounted(() => {
        if (!isNullOrEmpty(props.stepsID))
            releaseSteps(props.stepsID!)
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