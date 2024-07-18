import type { GetOptions, OnCanDoAsync, OnDoAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync } from './actions.ts'
import type { BladeVariant } from '../composables/blade.ts'
import { useCSV } from '../composables/csv.ts'
import { isLengthyArray, hasSearch } from '../composables/helpers.ts'
import { firstBy } from 'thenby'
import { computed, ref, onMounted, toValue, shallowRef, MaybeRefOrGetter, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArrayDifference, useArrayUnique, watchArray, watchDebounced } from '@vueuse/core'
import { useActions } from '../composables/actions.ts'
import { StorageMode, StoreMode, useStoreDefinition } from './stores.ts'
import { useNavigation } from './navigation.ts'
import { useBlade } from './blade.ts'
// import { SaveItemOptions } from './item.ts'

export interface ListRefreshOptions {
    deepRefresh?: boolean,
    resetSearch?: boolean
}

export interface TableColumn {
    align?: 'start' | 'end' | 'center'
    bool?: number
    csv?: boolean,
    csvArray?: boolean
    csvFilter?: string
    csvText?: string
    display?: boolean
    hide?: boolean
    itemText?: string
    level?: number
    maxWidth?: string
    minWidth?: string
    nav?: string
    prefix?: string
    searchable?: boolean
    showSize?: string
    single?: boolean
    sublevel?: number
    suffix?: string
    textFilter?: string
    textFunction?: Function
    title?: string
    truncate?: boolean
    value?: string
    width?: string
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
    (e: 'confirm', item: any): void
    (e: 'mouse-over-item', item: any): void
}

//unused props for ui
    // canAdd?: boolean
    // canDelete?: boolean
    // canEdit?: boolean
    // canRestore?: boolean
    // canShowInactive?: boolean
    // hideColumns?: boolean
    // hideFilters?: boolean
    // hideRefresh?: boolean
    // hideSubtoolbarSettings?: boolean
    // itemValue?: string
    // lines?: 'one' | 'two' | 'three'
    // showListOnly?: boolean
    // showTableOnly?: boolean
    // variant?: BladeVariant

export interface ListProps {
    addBladeName?: string
    additionalUrl?: string
    bladeGroup?: string
    bladeName?: string
    bladeStartShowing?: boolean
    // canSearch?: boolean
    canSelect?: boolean
    canUnselect?: boolean
    confirmOnDelete?: boolean
    customFilters?: CustomFilterParam[]
    defaultFilters?: string[]
    eager?: boolean
    errorMsg?: string
    headers?: TableColumn[]
    hideActions?: boolean
    isSingle?: boolean
    itemBladeName?: string
    itemID?: string
    items?: any[]
    /**only used with server pagination */
    itemsPerPage?: number
    itemText?: string
    loadingMsg?: string
    localOnly?: boolean //if local only or if nav is null, then will seek to only remove from items and asyncItems
    nav?: string
    /**for defining if deletable (show button or not) */
    onCanDelete?: (item: any) => boolean
    /**when trying to delete in api */
    onCanDeleteAsync?: OnCanDoAsync
    // onGetSaveAsync?: OnDoSuccessAsync
    onCanRestore?: (item: any) => boolean
    onCanRestoreAsync?: OnCanDoAsync
    onCanSave?: (item: any) => boolean
    onCanSaveAsync?: OnCanDoAsync
    onCanSelectItem?: (item: any) => boolean
    onDeleteAsync?: OnDoAsync
    onDeleteSuccessAsync?: OnDoAsync
    onError?: (err: any) => void
    onFilter?: Function
    onFinished?: () => void
    onGetAsync?: OnGetAsync
    onGetSaveAsync?: OnDoSuccessAsync
    onGetSuccessAsync?: OnGetSuccessAsync
    onRestoreAsync?: OnDoSuccessAsync
    onRestoreSuccessAsync?: OnDoSuccessAsync
    onSaveAsync?: OnDoSuccessAsync
    onSaveSuccessAsync?: OnDoSuccessAsync
    onSelectItem?: (item: any) => void
    params?: any
    proxyID?: string
    proxyKey?: string
    refreshToggle?: boolean
    searchKey?: string
    searchProps?: string[]
    selectProps?: string[]
    // sortBy?: string
    // sortOrder?: 'Ascending' | 'Descending'
    //showSearch?: boolean
    startShowingInactive?: boolean
    startShowingSearch?: boolean
    storeKey?: string
    storeMode?: StoreMode
    storageMode?: StorageMode
    /**usually used for last-updated configs or large quantities of local items */
    useLocalPagination?: boolean
    /**uses pagination from server */
    useServerPagination?: boolean
    useBladeSrc?: boolean
    useRouteSrc?: boolean,
    variant?: BladeVariant
}

export interface GroupedHeaderOption {
    position: number,
    values: TableColumn[]
}

export interface UseListOptions {
    hideActions?: boolean
    onError?: (err: any) => void
    onFinished?: () => void
    storeKey?: string
}

export interface BaseIDModel {
    id?: string
}

/**
 * PROPS first
 * ROUTE second
 *  page=1
 *  
 * BLADE third
 * @param props 
 * @param emit 
 * @param options 
 */
export function useList<T extends BaseIDModel>(props: ListProps, emit?: ListEvents, options?: UseListOptions) {
    const csv = useCSV()
    const navigation = useNavigation()
    const router = useRouter()
    const route = useRoute()

    const bladeEvents = useBlade({
        bladeGroup: props.bladeGroup,
        bladeName: props.bladeName,
        onUpdate: () => {
            refresh({ deepRefresh: false, resetSearch: true })
        },
        bladeStartShowing: props.bladeStartShowing
    })

    //sources for params, etc.
    const useBladeSrc = props.useBladeSrc ?? props.variant == 'blade'
    const useRouteSrc = props.useRouteSrc ?? props.variant == 'page'

    const nav = props.nav ?? props.bladeName ?? props.itemBladeName ?? 'basic'
    const storeKey = props.storeKey ?? options?.storeKey
    const storeMode = props.storeMode ?? navigation.findItem(nav)?.storeMode
    const storageMode = props.storageMode ?? navigation.findItem(nav)?.storageMode

    //server filtering
    const customFilters = toValue(props.customFilters) ?? []
    const serverFilters = ref<string[]>([])
    const allFilters = computed(() => {
        return useArrayUnique([
            ...customFilters.filter(x => x.name != null).map(x => x.name),
            ...(props.defaultFilters ?? []),
            ...serverFilters.value
        ]).value
    })
    //selected indexes of all filters
    const selectedFilters = ref((props.defaultFilters ?? []).map(x => allFilters.value.indexOf(x)))
    let latestFilters = ref([...selectedFilters.value])
    const filtersChanged = computed(() => {
        return useArrayDifference(latestFilters, selectedFilters).value.length > 0 ||
            useArrayDifference(selectedFilters, latestFilters).value.length > 0
    })

    //page
    
    //server pagination
    const currentPage = ref<number>(getStartingPage())
    function getStartingPage() {
        if (useBladeSrc) {
            const bladePage = bladeEvents.bladeData.data.page
            if (bladePage != null)
                return Number.parseInt(bladePage)
        }

        if (useRouteSrc) {
            const routePage = route?.query?.page
            if (routePage != null)
                return Number.parseInt(typeof routePage == 'string' ? routePage : routePage.toString())
        }

        return 1
    }

    //proxy
    const defaultProxyKey = props.proxyKey ?? 'proxyID'
    const proxyID = computed(() => {
        let cProxyID: string | undefined = props.proxyID

        if (cProxyID == null && useBladeSrc)
            cProxyID = bladeEvents.bladeData.data[defaultProxyKey] as string | undefined

        if (cProxyID == null && useRouteSrc)
            cProxyID = route?.query?.[defaultProxyKey] as string | undefined
        
        return cProxyID
    })

    //search
    const defaultSearchKey = props.searchKey ?? 'search'
    const searchString = ref<string | undefined>(getSearchString())
    function getSearchString() {
        let search: string | undefined

        if (search == null && useBladeSrc)
            search = bladeEvents.bladeData.data[defaultSearchKey] as string | undefined
        
        if (search == null && useRouteSrc)
            search = route?.query?.[defaultSearchKey] as string | undefined
        
        return search
    }

    const showInactive = ref(toValue(props.startShowingInactive) ?? false)

    //list
    const searchableProps = computed(() => {
        return [
            ...(props.searchProps ?? []),
            ...(props.headers ?? []).filter(x => x.searchable != null && x.value != null).map(x => x.value ?? '')
        ]
    })

    const asyncItems = ref<T[]>([])
    const filteredItems = shallowRef<T[]>([])
    const headerOptions = ref<TableColumn[]>([])

    let lastSelectedItem: any

    const { actionErrorMsg, actionLoadingMsg, deleteItem, doAction, getItem, getAllItems, restoreItem, saveItem } = useActions({
        nav: nav,
        onError: props.onError ?? options?.onError,
        onFinished: props.onFinished ?? options?.onFinished,
        proxyID: proxyID.value,
        store: useStoreDefinition({
            storeMode: storeMode,
            storageMode: storageMode,
            nav: nav
        })
    })

    const errorMsg = computed(() => props.errorMsg ?? actionErrorMsg.value)
    const loadingMsg = computed(() => props.loadingMsg ?? actionLoadingMsg.value)
    const isLoading = computed(() => loadingMsg.value != null)
    const showError = shallowRef(false)
    const showSearch = shallowRef(props.startShowingSearch == true)
    const totalPages = ref(0)
    const filterParams = computed(() => {
        let query: string | undefined
        let filterBys: string[] = []

        selectedFilters.value.forEach(ind => {
            const sFilter = allFilters.value[ind]
            const customFilter = customFilters.find((z: CustomFilterParam) => z.name == sFilter)
            if (customFilter != null)
                query = query != null ? `${query}ANDALSO${customFilter.filterFunction()}` : customFilter.filterFunction()
            else
                filterBys.push(sFilter)
        })

        const r: any = {}

        if (isLengthyArray(filterBys))
            r.filterBy = filterBys.toString()

        if (query != null)
            r.query = query
        
        return r
    })
    
    const id = computed(() => {
        let cID: string | undefined = props.itemID
        if (cID == null && useBladeSrc)
            cID = bladeEvents.bladeData.data.id as string | undefined

        if (cID == null && useRouteSrc)
            cID = route?.query?.id as string | undefined

        return cID
    })

    const allParams = computed(() => { 
        let p = props.params != null ? { ...props.params } : {}

        if (props.useServerPagination && props.itemsPerPage != null) {
            p.includeCount = true
            p.takeAmount = props.itemsPerPage
            p.takeFrom = (currentPage.value - 1) * props.itemsPerPage
        }

        if (filterParams.value != null)
            p = { ...p, ...filterParams.value}

        if (showInactive.value)
            p.includeInactive = true

        if (isLengthyArray(props.selectProps))
            p.properties = props.selectProps?.toString()

        if (searchString.value != null)
            p.searchString = searchString.value

        return p
    })

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
        return tableHeaders.value.filter(x => (x.nav != null && x.itemText != null) || x.textFilter != null || x.display != null || x.bool != null)
    })

    function add(variant: BladeVariant) {
        const aBladeName = props.addBladeName ?? props.itemBladeName

        if (aBladeName != null) {
            if (variant == 'page') {
                router.push({
                    name: aBladeName,
                    params: { id: 'new' }
                })
            }
            else if (variant == 'blade') {
                bladeEvents.updateBlade({
                    data: { id: 'new' },
                    bladeName: aBladeName
                })
            }
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
                storeKey
                // ...(useBladeSrc ? bladeData.value : {}),
                // requireConfirmation: true
            })
        }

        if (emit)
            emit('deleted', dItem)
    }

    function mRestoreItem(dItem: MaybeRefOrGetter<any>) {
        return restoreItem({
            data: toValue(dItem),
            additionalUrl: props.additionalUrl,
            nav,
            onCanRestoreAsync: props.onCanRestoreAsync,
            onRestoreAsync: props.onRestoreAsync,
            onRestoreSuccessAsync: props.onRestoreSuccessAsync,
            proxyID: proxyID.value,
            storeKey
            // ...(useBladeSrc ? bladeData.value : {})
        })
    }

    function mSaveItem(dItem: MaybeRefOrGetter<any>) { //, options?: SaveItemOptions) {
        const item = toValue(dItem)
        const {
            additionalUrl,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync
        } = { ...props }
        return saveItem({
            additionalUrl,
            data: item,
            nav,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync,
            proxyID: proxyID.value,
            storeKey
            // mode: item.id == null ? 'new' : 'edit'
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

        filteredItems.value = l as T[]
    }

    function refreshTableHeaders() {
        const hideActions = options?.hideActions ?? props.hideActions
        
        if (props.headers != null) {
            headerOptions.value = [...props.headers]
            
            if (!hideActions)
                headerOptions.value.push({ title: 'Actions', value: 'itemActions', align: 'end' })
        }
    }

    async function refresh(options?: ListRefreshOptions) {
        showError.value = false
        if (options?.resetSearch === true) {
            showSearch.value = false
            searchString.value = undefined
        }
        
        if (props.items != null) {
            asyncItems.value = props.onGetSuccessAsync != null ? await props.onGetSuccessAsync(props.items) : props.items
            if (props.onFinished)
                props.onFinished()

            return
        }

        const getOptions: GetOptions = {
            additionalUrl: props.additionalUrl,
            id: id.value,
            nav,
            params: {
                ...allParams.value,
                ...(useBladeSrc ? bladeEvents.bladeData.data.params : {})
            },
            proxyID: proxyID.value,
            refresh: options?.deepRefresh ?? false,
            storeKey,
            onGetAsync: props.onGetAsync,
            onGetSuccessAsync: props.onGetSuccessAsync,
        }

        if (props.isSingle === true) {
            if (getOptions.id === 'new')
                asyncItems.value = []
            else
                asyncItems.value = await getItem(getOptions)
        }
        else {
            let r = await getAllItems({
                ...getOptions,
                onGetSuccessAsync: async (gRes, opt) => {
                    let dataRes = gRes?.data
                    // if (!filtersLoaded) {
                        serverFilters.value = gRes?.filters ?? []
                        // filtersLoaded = true
                    // }

                    if (storeMode != 'whole-last-updated' &&
                        props.useServerPagination === true &&
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

            latestFilters.value = [...selectedFilters.value]
        }

        refreshFilteredList()
    }

    function selectItem(rItem: any, variant: BladeVariant) {
        const item = toValue(rItem)
        
        if (props.canUnselect) {
            lastSelectedItem = item === lastSelectedItem ? null : item
        }
        else {
            lastSelectedItem = item != null ? item : lastSelectedItem
        }
        
        // if (item != null && item === lastSelectedItem) { //&& props.canUnselect) {
        //     lastSelectedItem = null;
        // }
        // else {
        //     lastSelectedItem = item
        // }

        console.log(lastSelectedItem)

        if (props.canSelect == true && (props.onCanSelectItem == null || props.onCanSelectItem(item))) {
            if (props.onSelectItem != null) {
                props.onSelectItem(lastSelectedItem)
            }
            else if (variant == 'blade' && lastSelectedItem == null) {
                //close blade
                bladeEvents.closeBlade({ bladeName: props.itemBladeName })
            }
            else {
                if (variant == 'page') {
                    router.push({
                        name: props.itemBladeName,
                        params: { id: item.id }
                    })
                }
                else if (variant == 'blade') {
                    bladeEvents.updateBlade({
                        data: { id: item.id, data: item },
                        bladeName: props.itemBladeName
                    })
                }
                else if (variant == 'freestyle') {
                    // sendUpdate(bladeData)
                }
            }
        }

        if (emit != null) {
            emit('select', lastSelectedItem)
            emit('confirm', lastSelectedItem)
        }
    }

    function toggleSearch() {
        showSearch.value = !showSearch.value
        searchString.value = undefined
        refresh()

        // if (showSearch.value) {
        //     showSearch.value = props.showSearch ?? false
        //     searchString.value = undefined
        //     refresh()
        // }
        // else {
        //     showSearch.value = props.showSearch ?? true
        // }
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
            await refresh({ deepRefresh: route?.params?.refresh == 'true' })
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
        saveItem: mSaveItem,
        searchString,
        selectedFilters,
        selectItem,
        showError,
        showInactive,
        showSearch,
        subtitleOptions,
        tableHeaders,
        titleOptions,
        toggleSearch,
        totalPages,
        ...bladeEvents
    }
}