import type { GetOptions, GetAllOptions, OnCanDoAsync, OnDoActionAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync, OnGetAllAsync, OnGetAllSuccessAsync, OnDoMaybeSuccessAsync } from './actions.ts'
import type { BladeMode, BladeVariant } from '../composables/blade.ts'
import { useCSV } from '../composables/csv.ts'
import { isLengthyArray, hasSearch, nestedValue } from '../composables/helpers.ts'
import { firstBy } from 'thenby'
import { computed, ref, onMounted, toValue, shallowRef, watch } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { useArrayDifference, useArrayUnique, watchArray, watchDebounced } from '@vueuse/core'
import { useActions } from '../composables/actions.ts'
import { StorageMode, StoreMode, useStoreDefinition } from './stores.ts'
import { useNavigation } from './navigation.ts'
import { useBlade } from './blade.ts'

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

export interface LocalFilter {
    name: string,
    predicate?: (item: any) => boolean
    onFilter?: (list: any[]) => any[]
}

export interface ListEvents {
    (e: 'change', item: any): void
    (e: 'deleted', item: any): void
    (e: 'fetched', item: any): void
    (e: 'input', item: any): void
    (e: 'select', item: any): void
    (e: 'confirm', item: any): void
    (e: 'mouse-over-item', item: any): void
}

export interface ListProps<T, TSave, TReturn> {
    addBladeName?: string
    additionalUrl?: string
    bladeGroup?: string
    bladeName?: string
    bladeStartShowing?: boolean
    canSelect?: boolean
    canUnselect?: boolean
    confirmOnDelete?: boolean
    customFilters?: CustomFilterParam[]
    defaultFilters?: string[]
    eager?: boolean
    errorMsg?: string
    filterToggle?: boolean
    headers?: TableColumn[]
    hideActions?: boolean
    idSelector?: <T>(item: T) => string
    inactiveProp?: string
    isSingle?: boolean
    itemBladeName?: string
    itemID?: string
    items?: any[]
    /**only used with server pagination */
    itemsPerPage?: number
    itemText?: string
    keyStrategy?: 'rID' | 'index' | 'id' //id is default
    loadingMsg?: string
    localFilters?: LocalFilter[]
    localOnly?: boolean //if local only or if nav is null, then will seek to only remove from items and asyncItems
    nav?: string
    /**for defining if deletable (show button or not) */
    onCanDelete?: (item: TReturn) => boolean
    /**when trying to delete in api */
    onCanDeleteAsync?: OnCanDoAsync<TReturn>
    onCanRestore?: (item: TReturn) => boolean
    onCanRestoreAsync?: OnCanDoAsync<TReturn>
    onCanSave?: (item: TReturn) => boolean
    onCanSaveAsync?: OnCanDoAsync<TReturn | TSave>
    onCanSelectItem?: (item: TReturn) => boolean
    onDeleteAsync?: OnDoActionAsync<TReturn>
    onDeleteSuccessAsync?: OnDoMaybeSuccessAsync<TReturn, TReturn>
    onError?: (err: any) => void
    onFilter?: (list: TReturn[]) => TReturn[]
    onFinished?: (items: any) => void
    onGetAsync?: OnGetAllAsync<T>
    onGetSingleAsync?: OnGetAsync<T>
    onGetSaveAsync?: OnDoSuccessAsync<TReturn, TSave>
    onGetSingleSuccessAsync?: OnGetSuccessAsync<T, TReturn>
    onGetSuccessAsync?: OnGetAllSuccessAsync<T, TReturn>
    onRestoreAsync?: OnDoActionAsync<TReturn>
    onRestoreSuccessAsync?: OnDoSuccessAsync<TReturn, TReturn>
    onSaveAsync?: (item: TSave | TReturn) => Promise<TReturn | undefined> // OnDoSuccessAsync<T, TReturn>
    onSaveSuccessAsync?: OnDoSuccessAsync<TReturn, TReturn>
    onSelectItem?: (item: TReturn) => void
    onUpdateAsyncItem?: (asyncItem: TReturn | TReturn[] | undefined, newVersionItem: T) => void
    paginate?: 'server' | 'local'
    params?: any
    proxyID?: string
    proxyKey?: string
    queryParams?: string[] | Record<string, string>[]
    refreshToggle?: boolean
    searchKey?: string
    searchProps?: string[]
    selectProps?: string[]
    sortProp?: string
    startEditing?: boolean
    startShowingInactive?: boolean
    startShowingSearch?: boolean
    storeKey?: string
    storeMode?: StoreMode
    storageMode?: StorageMode
    /**usually used for last-updated configs or large quantities of local items */
    // useLocalPagination?: boolean
    /**uses pagination from server */
    // useServerPagination?: boolean
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
    /**used to select item. Default to x => x.id */
    idSelector?: <T>(item: T) => string
    isNotSetup?: boolean
    onError?: (err: any) => void
    onFinished?: (items: any) => void
    onFinishedAsync?: (items: any) => Promise<void>
    router?: Router
    route?: RouteLocationNormalizedLoaded
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
export function useList<T, TSave, TReturn>(props: ListProps<T, TSave, TReturn>, emit?: ListEvents, options?: UseListOptions) {
    const csv = useCSV()
    const navigation = useNavigation()

    const idSelector = options?.idSelector ?? props.idSelector ?? ((item: any) => item.id)

    const bladeEvents = options?.isNotSetup == true ? undefined : useBlade<T, TReturn>({
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
    const deleteStrat = navigation.findItem(nav)?.deleteStrat

    //server filtering
    const customFilters = toValue(props.customFilters) ?? []
    const serverFilters = ref<string[]>([])
    const allFilters = computed(() => {
        return useArrayUnique([
            ...(props.localFilters ?? []).filter(x => x.predicate != null || x.onFilter != null).map(x => x.name),
            ...customFilters.filter((x: any) => x.name != null).map((x: any) => x.name),
            ...(props.defaultFilters ?? []),
            ...serverFilters.value
        ]).value
    })
    //selected indexes of all filters
    const selectedFilters = ref((props.defaultFilters ?? []).map((x: any) => allFilters.value.indexOf(x)))
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
            const bladePage = bladeEvents?.bladeData.data.page
            if (bladePage != null)
                return Number.parseInt(bladePage)
        }

        if (useRouteSrc) {
            const routePage = options?.route?.query?.page
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
            cProxyID = bladeEvents?.bladeData.data[defaultProxyKey] as string | undefined

        if (cProxyID == null && useRouteSrc)
            cProxyID = options?.route?.query?.[defaultProxyKey] as string | undefined
        
        return cProxyID
    })

    //search
    const defaultSearchKey = props.searchKey ?? 'search'
    const searchString = ref<string | undefined>(getSearchString())
    function getSearchString() {
        let search: string | undefined

        if (search == null && useBladeSrc)
            search = bladeEvents?.bladeData.data[defaultSearchKey] as string | undefined
        
        if (search == null && useRouteSrc)
            search = options?.route?.query?.[defaultSearchKey] as string | undefined
        
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

    const asyncItems = ref<TReturn[] | TReturn | undefined>() //shallowRef<TReturn[] | TReturn | undefined>()
    const filteredItems = shallowRef<TReturn[]>([])
    const headerOptions = ref<TableColumn[]>([])

    let lastSelectedItem: any
    const onFinished = props.onFinished ?? options?.onFinished

    const { actionErrorMsg, actionLoadingMsg, deleteItem, doAction, getItem, getAllItems, restoreItem, saveItem } = useActions({
        nav: nav,
        onError: props.onError ?? options?.onError,
        onFinished: () => {
            if (onFinished != null)
                onFinished(asyncItems.value)
        },
        proxyID: proxyID.value,
        store: useStoreDefinition({
            storeMode: storeMode,
            storageMode: storageMode,
            nav: nav
        })
    })

    const errorMsg = computed(() => props.errorMsg ?? actionErrorMsg.value)
    const mLoadingMsg = ref<string | undefined>()
    const loadingMsg = computed(() => mLoadingMsg.value ?? props.loadingMsg ?? actionLoadingMsg.value)
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
            cID = bladeEvents?.bladeData.data.id as string | undefined

        if (cID == null && useRouteSrc) {
            cID = options?.route?.query?.id as string | undefined
        }
        
        if (cID == null && useRouteSrc) {
            cID = options?.route?.params?.id as string | undefined
        }

        return cID
    })

    const mode = ref<BladeMode>(id.value == 'new' ? 'new' : (props.startEditing ? 'edit' : 'view'))

    const allParams = computed(() => { 
        let p = props.params != null ? { ...props.params } : {}

        if (props.paginate == 'server' && props.itemsPerPage != null) {
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

        if (isLengthyArray(props.queryParams) && options?.route?.query != null) {
            props.queryParams?.forEach(q => {
                if (typeof(q) == 'string') {
                    if (options.route?.query[q] != null)
                        p[q] = options.route?.query[q]
                }
                else {
                    if (options.route?.query[q.key] != null)
                        p[q.value] = options.route?.query[q.key]
                }
            })
        }

        return p
    })

    const isDeletable = computed(() => (item: TReturn | any) => {
        if (props.onCanDelete != null)
            return props.onCanDelete(item)

        if (item != null && item.isInactive === true)
            return false

        return true
    })

    const isRestorable = computed(() => (item: TReturn | any) => {
        if (!showInactive.value)
            return false

        if (props.onCanRestore != null)
            return props.onCanRestore(item)

        if (item?.isInactive === true)
            return true

        return false
    })

    const updateAsyncItem = props.onUpdateAsyncItem ?? ((original: any, newItem: any) => {
        if (newItem.hasOwnProperty('rowVersion'))
            original.rowVersion =  newItem.rowVersion

        if (newItem.hasOwnProperty('version'))
            original.version =  newItem.version

        if (newItem.hasOwnProperty('isDeleted'))
            original.isDeleted =  newItem.isDeleted

        if (newItem.hasOwnProperty('isInactive'))
            original.isInactive =  newItem.isInactive

        if (newItem.hasOwnProperty('id'))
            original.id = newItem.id
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
                options?.router?.push({
                    name: aBladeName,
                    params: { id: 'new' }
                })
            }
            else if (variant == 'blade') {
                bladeEvents?.updateBlade({
                    data: { id: 'new' },
                    bladeName: aBladeName
                })
            }
        }
    }

    function mDeleteItem(item: TReturn) {
        const id = idSelector(item)

        const {
            additionalUrl,
            onDeleteAsync,
        } = { ...props }

        if (id == null)
            return

        const removeFrom = (list: any, id: string) => {
            if (list == null || !Array.isArray(list))
                return false

            if (id != null) {
                let asyncInd = list.findIndex(x => idSelector(x) == id)
                if (asyncInd > -1) {
                    list.splice(asyncInd, 1)
                    return true
                }
            }
            else {
                let asyncInd = list.findIndex(x => x === item) //.findIndex(x => x.id == id)
                if (asyncInd == -1) {
                    asyncInd = list.findIndex(x => x == item)
                    return true
                }
                    
                if (asyncInd > -1) {
                    list.splice(asyncInd, 1)
                    return true
                }
            }

            return false
        }

        if (props.localOnly == true || nav == null) {
            if (deleteStrat != 'soft') {
                removeFrom(asyncItems.value, id)
                removeFrom(props.items, id)
            }
            else if (!showInactive.value) {
                removeFrom(filteredItems.value, id)
            }
        }
        else {
            deleteItem({
                additionalUrl,
                data: item,
                nav,
                onCanDeleteAsync: props.onCanDeleteAsync,
                onDeleteAsync,
                onDeleteSuccessAsync: async (nItem: any) => {
                    if (deleteStrat != 'soft') {
                        removeFrom(props.items, id)
                    }
                    else {
                        updateAsyncItem(item, nItem)

                        if (!showInactive.value)
                            removeFrom(filteredItems.value, id)
                    }
                    
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
            emit('deleted', item)
    }

    function mRestoreItem(dItem: any) {
        const {
            additionalUrl,
            onRestoreAsync,
            onRestoreSuccessAsync = (nItem: any) => {
                updateAsyncItem(dItem, nItem)
                return nItem
            },
        } = { ...props }
        return restoreItem({
            additionalUrl,
            data: dItem,
            nav,
            onRestoreAsync,
            onRestoreSuccessAsync,
            proxyID: proxyID.value,
            storeKey
            // ...params.getOptions(),
            // ...(useBladeSrc ? bladeData.value : {}),
        })
        // return restoreItem({
        //     data: toValue(dItem),
        //     additionalUrl: props.additionalUrl,
        //     nav,
        //     onCanRestoreAsync: props.onCanRestoreAsync,
        //     onRestoreAsync: props.onRestoreAsync,
        //     onRestoreSuccessAsync: props.onRestoreSuccessAsync,
        //     proxyID: proxyID.value,
        //     storeKey
        // })
    }

    function mSaveItem(dItem: any) {
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
        })
    }
    
    function exportToCSV() {
        doAction(() => {
            csv.exportToCSV({ headers: tableHeaders.value, items: storeMode == 'session' ? filteredItems.value : asyncItems.value })
        }, { loadingMsg: 'Exporting to CSV' })
    }

    function refreshFilteredList() {
        if (asyncItems.value == null || !Array.isArray(asyncItems.value)) {
            filteredItems.value = []
            return
        }

        let l = props.onFilter ? props.onFilter(asyncItems.value) : asyncItems.value

        if (isLengthyArray(props.localFilters)) {
            selectedFilters.value.forEach(ind => {
                const localFilter = props.localFilters?.find(z => z.name == allFilters.value[ind])
                if (localFilter != null) {
                    if (localFilter.onFilter != null)
                        l = localFilter.onFilter(l)
                    else if (localFilter.predicate != null)
                        l = l.filter(x => localFilter.predicate!(x))
                }
            })
        }

        if (props.inactiveProp != null && !showInactive.value) {
            const inProp = props.inactiveProp as keyof TReturn
            l = l.filter((x: any) => x[inProp] !== true)
        }

        if (searchString.value != null && searchString.value.length > 0) {
            let sProps = [...searchableProps.value]
            if (props.itemText)
                sProps.push(props.itemText)

            if (isLengthyArray(sProps))
                l = l.filter(x => hasSearch(x, searchString.value, sProps))
        }

        // if (props.paginate == 'local' && isNullOrEmpty(searchString.value)) {
        //     //locally paginate
        //     if (props.itemsPerPage != null) {
        //         let indFrom = (currentPage.value - 1) * props.itemsPerPage
        //         let indTo = indFrom + props.itemsPerPage
        //         if (indTo >= l.length)
        //             indTo = l.length

        //         l = l.slice(indFrom, indTo)
        //     }
        // }

        if (props.paginate == 'local') {
            //locally paginate
            calculateTotalPages(l, l.length)

            if (props.itemsPerPage != null) {
                let indFrom = (currentPage.value - 1) * props.itemsPerPage
                let indTo = indFrom + props.itemsPerPage
                if (indTo >= l.length)
                    indTo = l.length

                l = l.slice(indFrom, indTo)
            }
        }

        if (props.sortProp != null)
            l = l.sort(firstBy(z => nestedValue(z, props.sortProp)))
        
        filteredItems.value = l
    }

    function refreshTableHeaders() {
        const hideActions = options?.hideActions ?? props.hideActions
        
        if (props.headers != null) {
            headerOptions.value = [...props.headers]
            
            if (!hideActions)
                headerOptions.value.push({ title: 'Actions', value: 'itemActions', align: 'end' })
        }
    }

    function calculateTotalPages(list: any[], cnt?: number) {
        if (props.itemsPerPage == null || list == null || list.length == 0)
            return

        const perPage = typeof props.itemsPerPage == 'string' ? Number.parseInt(props.itemsPerPage) : props.itemsPerPage

        if (perPage <= 0)
            return

        if (props.paginate == 'server') {
            if (cnt != null)
                totalPages.value = Math.ceil(cnt / perPage)
        }
        else if (props.paginate == 'local') {
            totalPages.value = Math.ceil(list.length / perPage)
        }
    }

    async function refresh(rOptions?: ListRefreshOptions) {
        showError.value = false
        if (rOptions?.resetSearch === true) {
            showSearch.value = false
            searchString.value = undefined
        }

        if (props.items != null) {
            let refreshRes = { data: props.items }

            mLoadingMsg.value = 'Loading'
            let returnRes = props.onGetSuccessAsync != null ? await props.onGetSuccessAsync(refreshRes) : refreshRes
            mLoadingMsg.value = undefined
            
            if (returnRes == null || !Array.isArray(returnRes.data))
                return

            asyncItems.value = returnRes?.data ?? []
            
            if (props.paginate != 'local')
                calculateTotalPages(asyncItems.value, asyncItems.value.length)

            refreshFilteredList()
            
            if (onFinished != null)
                onFinished(asyncItems.value)

            if (options?.onFinishedAsync != null)
                await options?.onFinishedAsync(asyncItems.value)

            if (emit)
                emit('fetched', asyncItems.value)

            return
        }

        if (props.isSingle === true) {
            const getOptions: GetOptions<T, TReturn> = {
                additionalUrl: props.additionalUrl,
                id: id.value,
                nav,
                params: {
                    ...allParams.value,
                    ...(useBladeSrc ? bladeEvents?.bladeData.data.params : {})
                },
                proxyID: proxyID.value,
                refresh: rOptions?.deepRefresh ?? false,
                storeKey,
                onGetAsync: props.onGetSingleAsync,
                onGetSuccessAsync: props.onGetSingleSuccessAsync,
            }

            if (getOptions.id === 'new') {
                asyncItems.value = []
            }
            else {
                const singleRes = await getItem<T, TReturn>(getOptions)
                if (singleRes == null) {
                    asyncItems.value = undefined
                }
                else {
                    if (Array.isArray(singleRes.data))
                        asyncItems.value = singleRes.data as TReturn[]
                    else
                        asyncItems.value = singleRes.data != null ? ([singleRes.data] as TReturn[]) : undefined
                }
            }
        }
        else {
            const getAllOptions: GetAllOptions<T, TReturn> = {
                additionalUrl: props.additionalUrl,
                id: id.value,
                nav,
                params: {
                    ...allParams.value,
                    ...(useBladeSrc ? bladeEvents?.bladeData.data.params : {})
                },
                proxyID: proxyID.value,
                refresh: rOptions?.deepRefresh ?? false,
                storeKey,
                onGetAsync: props.onGetAsync,
                onGetSuccessAsync: props.onGetSuccessAsync,
            }

            let r = await getAllItems<T, TReturn>({
                ...getAllOptions,
                onGetSuccessAsync: async (gRes, opt) => {
                    if (gRes != null) {
                        if (gRes.filters != null)
                            serverFilters.value = gRes?.filters ?? []

                        calculateTotalPages(gRes.data, gRes.count)

                        if (props.onGetSuccessAsync != null)
                            return await props.onGetSuccessAsync(gRes, opt)
                    }

                    return gRes
                }
            })

            asyncItems.value = (r?.data as TReturn[]) ?? []

            latestFilters.value = [...selectedFilters.value]
        }

        refreshFilteredList()
        
        if (onFinished)
            onFinished(asyncItems.value)

        if (options?.onFinishedAsync != null)
            await options?.onFinishedAsync(asyncItems.value)
        
        if (emit)
            emit('fetched', asyncItems.value)

    }

    function selectItem(rItem: any, variant: BladeVariant) {
        const item = toValue(rItem)
        
        if (props.canUnselect) {
            lastSelectedItem = item === lastSelectedItem ? null : item
        }
        else {
            lastSelectedItem = item != null ? item : lastSelectedItem
        }

        if (props.canSelect == true && (props.onCanSelectItem == null || props.onCanSelectItem(item))) {
            if (props.onSelectItem != null) {
                props.onSelectItem(lastSelectedItem)
            }
            else if (variant == 'blade' && lastSelectedItem == null) {
                //close blade
                bladeEvents?.closeBlade({ bladeName: props.itemBladeName })
            }
            else {
                if (variant == 'page') {
                    options?.router?.push({
                        name: props.itemBladeName,
                        params: { id: item.id }
                    })
                }
                else if (variant == 'blade') {
                    bladeEvents?.updateBlade({
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
    }

    refreshTableHeaders()

    watchDebounced([searchString], () => {
        refreshFilteredList()
    }, { debounce: 500, maxWait: 500 })

    watch(showInactive, async () => {
        if (storeMode == 'whole-last-updated')
            refreshFilteredList()
        else
            await refresh()
    })
    watch(currentPage, async () => { //bladeData
        await refresh()
    })

    watch([errorMsg, () => props.errorMsg], ([vOne, vTwo]) => {
        showError.value = vOne != null || vTwo != null
    })

    watch(() => props.refreshToggle, () => {
        refresh({ deepRefresh: true })
    })

    watch(() => props.filterToggle, () => {
        refreshFilteredList()
    })
    
    watchArray([asyncItems], () => {
        refreshFilteredList()
    }, { deep: true })

    watchArray([() => props.items], () => {
        refresh()
    }, { deep: true })
    
    // watchArray([() => props.items], () => {
    //     console.log('items')
    //     refresh()
    // })

    if (!options?.isNotSetup == true) {
        onMounted(async () => {
            if (props.eager == true)
                await refresh({ deepRefresh: options?.route?.params?.refresh == 'true' })
        })
    }
    else if (options?.isNotSetup == true && props.eager == true) {
        refresh({ deepRefresh: options?.route?.params?.refresh == 'true' })
    }

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
        id,
        isDeletable,
        isEditing: computed(() => mode.value == 'new' || mode.value == 'edit'),
        isLoading,
        isRestorable,
        loadingMsg,
        mode,
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
