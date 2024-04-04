import type { GetOptions, OnCanDoAsync, OnDoAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync } from './actions'
import type { BladeVariant } from '../types'
import { useCSV } from '../composables/csv'
import { isLengthyArray, hasSearch } from '../index'
import { firstBy } from 'thenby'
import { computed, ref, onMounted, toValue, shallowRef, MaybeRefOrGetter, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArrayDifference, useArrayUnique, watchArray, watchDebounced } from '@vueuse/core'
import { useActions } from '../composables/actions'
import { StorageMode, StoreMode, useStore } from '../index'

export interface RefreshOptions {
    deepRefresh?: boolean,
    resetSearch?: boolean
}

export interface TableColumn {
    align?: 'start' | 'end' | 'center'
    csv?: boolean,
    csvArray?: boolean,
    csvFilter?: string,
    csvText?: string,
    hide?: boolean
    itemText?: string
    level?: number
    maxWidth?: string
    minWidth?: string
    prefix?: string
    searchable?: boolean
    sublevel?: number,
    suffix?: string
    textFilter?: string
    textFunction?: Function
    title?: string
    value?: string
}

export interface CustomFilterParam {
    name: string,
    filterFunction: () => string,
    onFilterResult: Function | null
}

export interface ListEvents {
    (e: 'change', item: any): void
    (e: 'deleted', item: any): void
    (e: 'input', item: any): void
    (e: 'select', item: any): void
    (e: 'mouse-over-item', item: any): void
}

export interface ListProps {
    additionalUrl?: string
    bladeName?: string
    canAdd?: boolean
    canDelete?: boolean
    canEdit?: boolean
    canRestore?: boolean
    canShowInactive?: boolean
    canSelect?: boolean
    canUnselect?: boolean
    confirmOnDelete?: boolean
    customFilters?: CustomFilterParam[]
    defaultFilters?: string[]
    dividers?: boolean
    eager?: boolean
    errorMsg?: string
    headers?: TableColumn[]
    hideActions?: boolean
    hideColumns?: boolean
    hideFilters?: boolean
    hideRefresh?: boolean
    hideSubtoolbarSettings?: boolean
    includeDetails?: boolean
    isSingle?: boolean
    itemBladeName?: string
    itemID?: string
    items?: any[]
    itemsPerPage?: number
    itemText?: string
    // itemValue?: string
    lines?: 'one' | 'two' | 'three'
    loadingMsg?: string
    localOnly?: boolean //if local only or if nav is null, then will seek to only remove from items and asyncItems
    nav?: string
    /**for defining if deletable (show button or not) */
    onCanDelete?: (item: any) => boolean
    /**when trying to delete in api */
    onCanDeleteAsync?: OnCanDoAsync
    onGetSaveAsync?: OnDoSuccessAsync
    onCanRestore?: (item: any) => boolean
    onCanRestoreAsync?: OnCanDoAsync
    onCanSaveAsync?: OnCanDoAsync
    onCanSelectItem?: (item: any) => boolean
    onDeleteAsync?: OnDoAsync
    onDeleteSuccessAsync?: OnDoAsync
    onFilter?: Function
    onGetAsync?: OnGetAsync
    onGetSuccessAsync?: OnGetSuccessAsync
    onRestoreAsync?: OnDoSuccessAsync
    onRestoreSuccessAsync?: OnDoSuccessAsync
    onSaveAsync?: OnDoSuccessAsync
    onSaveSuccessAsync?: OnDoSuccessAsync
    onSelectItem?: (item: any) => void
    params?: any
    proxyID?: string
    proxyQueryKey?: string
    refreshToggle?: boolean
    searchProps?: string[]
    searchQueryKey?: string
    selectProps?: string[]
    sortBy?: string
    sortOrder?: 'Ascending' | 'Descending'
    showListOnly?: boolean
    showTableOnly?: boolean
    showSearch?: boolean
    startShowingInactive?: boolean
    storeMode?: StoreMode
    storageMode?: StorageMode
    useInterEvents?: boolean
    useServerPagination?: boolean
    useBladeSrc?: boolean
    useRouteSrc?: boolean
    variant?: BladeVariant
}

export interface GroupedHeaderOption {
    position: number,
    values: TableColumn[]
}

export interface UseListOptions {
    storeMode?: StoreMode
    storageMode?: StorageMode
    useBladeSrc?: boolean
    useRouteSrc?: boolean
}

/**
 * PROPS first
 * ROUTE second
 * BLADE third
 * @param props 
 * @param emit 
 * @param options 
 */
export function useList(props: ListProps, emit?: ListEvents, options?: UseListOptions) {
    // const useBladeSrc = props.useBladeSrc ?? options?.useBladeSrc ?? true
    // const useRouteSrc = props.useRouteSrc ?? options?.useRouteSrc ?? true
    const storeMode = props.storeMode ?? options?.storeMode ?? 'session'
    const storageMode = props.storageMode ?? options?.storageMode ?? 'local-cache'
    // const bladeName = props.bladeName ?? props.nav
    const nav = props.nav ?? props.nav ?? 'basic'
    const csv = useCSV()

    const router = useRouter()
    const route = useRoute()

    //server pagination
    const currentPage = ref<number>(1)

    //server filtering
    const customFilters = toValue(props.customFilters) ?? []
    const serverFilters = ref<string[]>([])
    let latestFilters = ref(new Array<number>())
    const allFilters = computed(() => {
        return useArrayUnique([
            ...customFilters.filter(x => x.name != null).map(x => x.name),
            ...(props.defaultFilters ?? []),
            ...serverFilters.value
        ]).value
    })
    const selectedFilters = ref((props.defaultFilters ?? []).map(x => allFilters.value.indexOf(x)))
    const filtersChanged = computed(() => {
        return useArrayDifference(latestFilters, selectedFilters).value.length > 0 ||
            useArrayDifference(selectedFilters, latestFilters).value.length > 0
    })

    //server headers
    const qKey = toValue(props.proxyQueryKey)
    const proxyID = computed(() => { return toValue(props.proxyID) ?? (qKey != null ? route.query?.[qKey] : undefined) as string | undefined; })

    //server query
    const sKey = toValue(props.searchQueryKey)
    const searchString = ref<string | undefined>(sKey != null ? route.query?.[sKey] as string | undefined : undefined)
    // const selectProps = toValue(props.selectProps) ?? []
    const showInactive = ref(toValue(props.startShowingInactive) ?? false)
    const sortOrder = ref(toValue(props.sortOrder))

    //list
    const searchableProps = computed(() => {
        return [
            ...(props.searchProps ?? []),
            ...(props.headers ?? []).filter(x => x.searchable != null && x.value != null).map(x => x.value ?? '')
        ]
    })
    const asyncItems = ref<any[]>([])
    const filteredItems = shallowRef<any[]>([])
    // let filtersLoaded = false

    const headerOptions = ref<TableColumn[]>([])

    let lastSelectedItem: any

    const { actionErrorMsg, actionLoadingMsg, deleteItem, doAction, getItem, getAllItems, restoreItem } = useActions({
        nav: props.nav ?? props.bladeName ?? props.itemBladeName,
        proxyID: proxyID.value,
        store: useStore()({
            storeMode: storeMode,
            storageMode: storageMode,
            storeName: nav
        })
    })

    const errorMsg = computed(() => props.errorMsg ?? actionErrorMsg.value)
    const loadingMsg = computed(() => props.loadingMsg ?? actionLoadingMsg.value)
    const isLoading = computed(() => loadingMsg.value != null)
    const showError = shallowRef(false)
    const showSearch = shallowRef(props.showSearch ?? false)
    const totalPages = ref(0)

    const isDeletable = computed(() => (item: any) => {
        if (props.onCanDelete != null)
            return props.onCanDelete(item)

        if (item != null && item.isInactive === true)
            return false

        return true
    })

    const isRestorable = computed(() => (item: any) => {
        if (!showInactive.value)
            return false

        if (props.onCanRestore != null)
            return props.onCanRestore(item)

        if (item?.isInactive === true)
            return true

        return false
    })

    const tableHeaders = computed(() => { return headerOptions.value.filter(x => !x.hide) })
    const subtitleOptions = computed(() => { 
        let returnList: GroupedHeaderOption[] = new Array<GroupedHeaderOption>()
        const scanList = tableHeaders.value.filter(x => x.sublevel != undefined)
        scanList.forEach(s => {
            let e = returnList.find(x => x.position == s.sublevel)
            if (e == null) {
                returnList.push({ position: s.sublevel ?? 0, values: [s] })
            }
            else {
                e.values.push(s)
            }
        })
        return returnList.sort(firstBy(x => x.position))
    })
    const titleOptions = computed(() => { 
        let returnList: GroupedHeaderOption[] = new Array<GroupedHeaderOption>()
        const scanList = tableHeaders.value.filter(x => x.level != undefined) // && !Number.isNaN(x.title))
        scanList.forEach(s => {
            let e = returnList.find(x => x.position == s.level)
            if (e == null) {
                returnList.push({ position: s.level ?? 0, values: [s] })
            }
            else {
                e.values.push(s)
            }
        })
        return returnList.sort(firstBy(x => x.position))
    })
    const displayHeaders = computed(() => {
        return []
        // return tableHeaders.value.filter(x => (x.nav != null && x.itemText != null) || x.textFilter != null || x.display != null || x.bool != null)
    })

    function add(variant: BladeVariant) {
        if (props.itemBladeName != null) {
            // if (allProps.useInterEvents) {
            //     eventBus?.sendSelect(allProps.addBladeName ?? '', 'new')
            // }
            // else {
                let bladeData = {
                    bladeName: props.itemBladeName,
                    id: 'new',
                    nav
                }
    
                if (variant == 'page') {
                    router.push({
                        name: bladeData.bladeName,
                        params: { id: 'new' }
                    })
                }
                else if (variant == 'freestyle' || variant == 'blade') {
    
                }
            // }
        }
    }

    function mDeleteItem(dItem: MaybeRefOrGetter<any>) {
        const {
            additionalUrl,
            onDeleteAsync,
        } = { ...props }
        const item = toValue(dItem)
        const id = item.id

        const removeLocally = (id: string) => {
            if (id != null) {
                let asyncInd = asyncItems.value.findIndex(x => x.id == id)
                if (asyncInd > -1) {
                    asyncItems.value.splice(asyncInd, 1)
                }

                if (props.items != null) {
                    let ind = props.items.findIndex(x => x.id == id)
                    
                    if (ind > -1)
                        props.items.splice(ind, 1)
                }
            }
            else {
                let asyncInd = asyncItems.value.findIndex(x => x === item) //.findIndex(x => x.id == id)
                if (asyncInd == -1)
                    asyncInd = asyncItems.value.findIndex(x => x == item)
                
                if (asyncInd > -1)
                        asyncItems.value.splice(asyncInd, 1)
    
                if (props.items != null) {
                    let ind = props.items.findIndex(x => x === item) //.findIndex(y => y.id == id)
                    
                    if (ind == -1)
                        ind = props.items.findIndex(x => x == item)
    
                    if (ind > -1)
                        props.items.splice(ind, 1)
                }
            }

            // eventBus?.sendDelete(nav ?? '', id)
        }

        if (props.localOnly == true || nav == null) {
            removeLocally(id)
        }
        else {
            deleteItem({
                additionalUrl,
                data: item,
                nav,
                onCanDeleteAsync: props.onCanDeleteAsync,
                onDeleteAsync,
                onDeleteSuccessAsync: async () => {
                    removeLocally(id)
    
                    if (props.onDeleteSuccessAsync != null)
                        return props.onDeleteSuccessAsync(item)
    
                    return Promise.resolve(undefined)
                },
                proxyID: proxyID.value,
                // ...(useBladeSrc ? bladeData.value : {}),
                requireConfirmation: true
            })
        }

        if (emit)
            emit('deleted', dItem)
    }

    function mRestoreItem(dItem: MaybeRefOrGetter<any>) {
        restoreItem({
            data: toValue(dItem),
            additionalUrl: props.additionalUrl,
            nav,
            onCanRestoreAsync: props.onCanRestoreAsync,
            onRestoreAsync: props.onRestoreAsync,
            onRestoreSuccessAsync: props.onRestoreSuccessAsync,
            proxyID: proxyID.value,
            // ...(useBladeSrc ? bladeData.value : {})
        })
    }
    
    function exportToCSV() {
        doAction(() => {
            csv.exportToCSV(tableHeaders.value, filteredItems.value)
        }, { loadingMsg: 'Exporting to CSV' })
    }

    function refreshFilteredList() {
        let l = toValue(asyncItems)
        l = props.onFilter ? props.onFilter(l) : l

        if (searchString.value != null && searchString.value.length > 0) {
            let sProps = [...searchableProps.value]
            if (props.itemText)
                sProps.push(props.itemText)

            if (isLengthyArray(sProps))
                l = l.filter(x => hasSearch(x, searchString.value, sProps))
        }

        filteredItems.value = l
    }

    function refreshTableHeaders() {
        if (props.headers != null) {
            headerOptions.value = [...props.headers]
            
            if (!props.hideActions)
                headerOptions.value.push({ title: 'Actions', value: 'itemActions', align: 'end' })
        }
    }

    async function refresh(options?: RefreshOptions) {
        showError.value = false

        if (options?.resetSearch === true) {
            showSearch.value = props.showSearch ?? false
            searchString.value = undefined
        }

        if (props.items != null) {
            asyncItems.value = props.onGetSuccessAsync != null ? await props.onGetSuccessAsync(props.items) : props.items
            return
        }

        const getOptions: GetOptions = {
            additionalUrl: props.additionalUrl,
            id: props.itemID,
            nav: props.nav,
            // params: params.getParamOptions(),
            proxyID: proxyID.value,
            // ...(useBladeSrc ? bladeData.value : {}),
            // ...(props.useInterEvents ? eventData : {}),
            refresh: options?.deepRefresh ?? false,
            onGetAsync: props.onGetAsync,
            onGetSuccessAsync: props.onGetSuccessAsync,
        }

        if (props.isSingle === true) {
            if (getOptions.id === 'new')
                asyncItems.value = []
            else
            console.log('getting')
                asyncItems.value = await getItem(getOptions)
                console.log('gottne')
        }
        else {
            let r = await getAllItems({
                ...getOptions,
                onGetSuccessAsync: async (gRes, opt) => {
                    let dataRes = gRes.data
                    // if (!filtersLoaded) {
                        serverFilters.value = gRes.filters ?? []
                        // filtersLoaded = true
                    // }

                    if (props.useServerPagination === true &&
                        props.itemsPerPage &&
                        gRes.count) {
                            totalPages.value = Math.ceil(gRes.count / props.itemsPerPage)
                        }

                    if (props.onGetSuccessAsync != null)
                        dataRes = await props.onGetSuccessAsync(dataRes, opt)

                    return dataRes
                }
            })

            asyncItems.value = r
        }

        refreshFilteredList()
    }

    function selectItem(rItem: any, variant: BladeVariant) {
        const item = toValue(rItem)
        if (item != null && item === lastSelectedItem && props.canUnselect) {
            lastSelectedItem = null;
        }
        else {
            lastSelectedItem = item
        }

        if (emit != null) {
            emit('select', lastSelectedItem)
        }

        if (!props.canSelect || (props.onCanSelectItem != null && !props.onCanSelectItem(item)))
            return;
        
        if (props.onSelectItem != null) {
            props.onSelectItem(lastSelectedItem)
        }
        // else if (lastSelectedItem == null) {
        //     //close blade
        //     sendClose({ bladeName: allProps.addBladeName })
        // }
        else {
            // if (props.useInterEvents) {
            //     console.log('is selecting')
            //     eventBus?.sendSelect(allProps.addBladeName ?? '', lastSelectedItem?.id)
            // }
            // else {
                let bladeData = {
                    bladeName: props.itemBladeName,
                    id: item.id,
                    nav: props.nav
                }
    
                if (variant == 'page') {
                    router.push({
                        name: bladeData.bladeName,
                        params: { id: bladeData.id }
                    })
                }
                else if (variant == 'freestyle' || variant == 'blade') {
                    // sendUpdate(bladeData)
                }
            // }
        }
    }

    function toggleSearch() {
        if (showSearch.value) {
            showSearch.value = props.showSearch ?? false
            searchString.value = undefined
            refresh()
        }
        else {
            showSearch.value = props.showSearch ?? true
        }
    }

    refreshTableHeaders()

    watchDebounced([searchString], () => {
        refreshFilteredList()
    }, { debounce: 500, maxWait: 500 })

    watch([showInactive, currentPage], async () => { //bladeData
        await refresh()
    })

    watch([errorMsg, () => props.errorMsg], ([vOne, vTwo]) => {
        showError.value = vOne != null || vTwo != null
    })

    watch(() => props.refreshToggle, () => {
        refresh({ deepRefresh: true })
    })

    watchArray([asyncItems, () => props.items], () => {
        refreshFilteredList()
    })

    onMounted(async () => {
        if (props.eager == true)
            await refresh({ deepRefresh: route.params?.refresh == 'true' })
    })

    return {
        add,
        asyncItems,
        currentPage,
        deleteItem: mDeleteItem,
        displayHeaders,
        errorMsg,
        exportToCSV,
        filteredItems,
        filters: allFilters,
        filtersChanged,
        headerOptions,
        isDeletable,
        isLoading,
        isRestorable,
        loadingMsg,
        refresh,
        restoreItem: mRestoreItem,
        searchString,
        selectedFilters,
        selectItem,
        serverFilters,
        showError,
        showInactive,
        showSearch,
        sortOrder,
        subtitleOptions,
        tableHeaders,
        titleOptions,
        toggleSearch,
        totalPages
    }
}