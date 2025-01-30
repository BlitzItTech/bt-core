import type { GetAllOptions, GetOptions, OnCanDoAsync, OnDoActionAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync, OnGetAllAsync, OnGetAllSuccessAsync, OnDoMaybeSuccessAsync } from './actions.ts'
import type { StorageMode, StoreMode } from './stores.ts'
import { onMounted, computed, ref, shallowRef, toValue, watch } from 'vue'
import { useStoreDefinition } from './stores.ts'
import { useTracker } from './track.ts'
import { useRoute } from 'vue-router'
import { useActions } from './actions.ts'
import { useBlade, type BladeMode, type BladeVariant } from '../composables/blade.ts'
import { useNavBack, useNavigation } from './navigation.ts'
import { PathOptions } from './api.ts'

//unused props for ui
    // canDelete?: boolean
    // canEdit?: boolean
    // canRestore?: boolean
    // hideRefresh?: boolean

export interface ItemProps<T, TSave, TReturn> {
    additionalUrl?: string
    bladeGroup?: string
    bladeName?: string,
    bladeStartShowing?: boolean
    canSave?: boolean
    eager?: boolean
    eagerWithID?: boolean
    errorMsg?: string
    findItem?: (list?: TReturn[]) => TReturn | undefined
    ignorePermissions?: boolean //?
    includeDetails?: boolean
    isSingle?: boolean
    item?: any
    itemID?: string
    loadingMsg?: string
    // mode?: BladeMode
    nav?: string
    onCanDelete?: (item: TReturn) => boolean
    onCanDeleteAsync?: OnCanDoAsync<TReturn>
    onCanEdit?: (item: TReturn) => boolean
    onCanRestore?: (item: TReturn) => boolean
    onCanRestoreAsync?: OnCanDoAsync<TReturn>
    onCanSave?: (item: TReturn) => boolean
    onCanSaveAsync?: OnCanDoAsync<TReturn | TSave>
    onDeleteAsync?: OnDoActionAsync<TReturn>
    onDeleteSuccessAsync?: OnDoMaybeSuccessAsync<TReturn, TReturn> // OnDoSuccessAsync<any, any>
    onError?: (err: any) => void
    onGetAsync?: OnGetAsync<T>
    onGetListAsync?: OnGetAllAsync<T>
    onGetListSuccessAsync?: OnGetAllSuccessAsync<T, TReturn>
    onGetSuccessAsync?: OnGetSuccessAsync<T, TReturn>
    onGetNew?: (data?: PathOptions) => TReturn
    onGetNotFound?: (data?: PathOptions) => TReturn
    onGetSaveAsync?: OnDoSuccessAsync<TReturn, TSave>
    onRestoreAsync?: OnDoActionAsync<TReturn>
    onRestoreSuccessAsync?: OnDoSuccessAsync<TReturn, TReturn>
    onSaveAsync?: (item: TSave | TReturn) => Promise<TReturn | undefined> // OnDoSuccessAsync<T, TReturn>
    onSaveSuccessAsync?: OnDoSuccessAsync<TReturn, TReturn>
    onUpdateAsyncItem?: (asyncItem: TReturn | TReturn[] | undefined, newVersionItem: T) => void
    params?: any
    proxyID?: string
    proxyKey?: string
    refreshToggle?: boolean
    resetTrackerToggle?: boolean
    startEditing?: boolean
    storeKey?: string
    storeMode?: StoreMode
    storageMode?: StorageMode
    trackChanges?: boolean
    trackIgnoreProps?: string[]
    trackProps?: string []
    useBladeSrc?: boolean
    useRouteSrc?: boolean
    variant?: BladeVariant
}

export interface ItemRefreshOptions {
    deepRefresh?: boolean
}

export interface SaveItemOptions {
    navBack?: boolean
}

export interface UseItemOptions {
    onError?: (err: any) => void
    storeKey?: string
    storeMode?: StoreMode
    storageMode?: StorageMode
    useRouteSrc?: boolean,
    useBladeSrc?: boolean
}

export interface ItemEvents {
    (e: 'fetched', item: any): void
    (e: 'saved', item: any): void
}

/**
 * 
 * @param props 
 * bladeName <-- props.bladeName ?? props.nav ?? 'basic'
 * nav <-- props.nav ?? undefined
 * @param options 
 * @returns 
 */
export function useItem<T, TSave, TReturn>(props: ItemProps<T, TSave, TReturn>, emit?: ItemEvents, options?: UseItemOptions) {
    const navigation = useNavigation()
    const useBladeSrc = options?.useBladeSrc ?? props.useBladeSrc ?? props.variant == 'blade'
    const useRouteSrc = options?.useRouteSrc ??props.useRouteSrc ?? props.variant == 'page'

    const defaultProxyKey = props.proxyKey ?? 'proxyID'
    const nav = props.nav ?? props.bladeName ?? 'basic'

    const storeKey = props.storeKey ?? options?.storeKey
    const storeMode = props.storeMode ?? options?.storeMode
    const storageMode = props.storageMode ?? options?.storageMode
    const deleteStrat = navigation.findItem(nav)?.deleteStrat

    const { navBack } = useNavBack()
    const route = useRoute()

    const bladeEvents = useBlade<T, TReturn>({
        bladeGroup: props.bladeGroup,
        bladeName: props.bladeName,
        onUpdate: () => {
            refresh({ deepRefresh: false })
        },
        bladeStartShowing: props.bladeStartShowing
    })

    //server headers
    const proxyID = computed(() => {
        let cProxyID: string | undefined = props.proxyID

        if (cProxyID == null && useBladeSrc)
            cProxyID = bladeEvents.bladeData.data[defaultProxyKey] as string | undefined

        if (cProxyID == null && useRouteSrc)
            cProxyID = route?.query?.[defaultProxyKey] as string | undefined
        
        return cProxyID
    })

    const asyncItem = ref<TReturn | TReturn[] | undefined>()

    const { actionErrorMsg, actionLoadingMsg, deleteItem, getItem, getAllItems, restoreItem, saveItem } = useActions({
        nav: nav,
        onError: props.onError ?? options?.onError,
        proxyID: proxyID.value,
        store: useStoreDefinition({
            storeMode: storeMode,
            storageMode: storageMode,
            nav: nav 
        })
    })

    const errorMsg = computed(() => props.errorMsg ?? actionErrorMsg.value)
    const loadingMsg = computed(() => props.loadingMsg ?? actionLoadingMsg.value)
    const isLoading = computed(() => { return loadingMsg.value != null })
    
    const id = computed(() => {
        let cID: string | undefined = props.itemID
        if (cID == null && useBladeSrc)
            cID = bladeEvents.bladeData.data.id as string | undefined

        if (cID == null && useRouteSrc)
            cID = route?.query?.id as string | undefined ?? route?.params?.id as string | undefined

        return cID
    })

    const mode = ref<BladeMode>(id.value == 'new' ? 'new' : (props.startEditing ? 'edit' : 'view'))

    const showError = shallowRef(false)

    const allParams = computed(() => {
        let p = props.params != null ? { ...props.params } : {}

        if (props.includeDetails != null) {
            p.includeDetails = props.includeDetails
        }

        return p
    })

    const isDeletable = computed(() => {
        if (mode.value == 'new')
            return false
        
        const item = toValue(asyncItem) as TReturn | any
        if (item != null && props.onCanDelete != null)
            return props.onCanDelete(item)

        if (item?.isInactive === true)
            return false

        return true
    })
    const isEditable = computed(() => {
        if (mode.value == 'new')
            return false

        const item = toValue(asyncItem) as TReturn | any
        if (props.onCanEdit != null)
            return props.onCanEdit(item)

        return true
    })
    const isRestorable = computed(() => {
        if (mode.value == 'new')
            return false

        const item = toValue(asyncItem) as TReturn | any
        if (props.onCanRestore != null)
            return props.onCanRestore(item)

        if (item?.isInactive === true)
            return true

        return false
    })
    const isSaveable = computed(() => {
        const item = toValue(asyncItem) as TReturn | any
        if (props.onCanSave != null)
            return props.onCanSave(item)

        return true
    })

    const updateAsyncItem = props.onUpdateAsyncItem ?? ((original: any, newItem: any) => {
        if (original.hasOwnProperty('rowVersion'))
            original.rowVersion =  newItem.rowVersion

        if (original.hasOwnProperty('version'))
            original.version =  newItem.version

        if (original.hasOwnProperty('isDeleted'))
            original.isDeleted =  newItem.isDeleted

        if (original.hasOwnProperty('isInactive'))
            original.isInactive =  newItem.isInactive
    })

    const { isChanged, restartTracker } = useTracker(asyncItem, { 
        useTracker: props.trackChanges,
        propsToIgnore: props.trackIgnoreProps,
        propsToTrack: props.trackProps
    })

    function mDeleteItem(dItem: any) {
        const {
            additionalUrl,
            onDeleteAsync,
            onDeleteSuccessAsync = (item: any) => {
                if (deleteStrat == 'soft') {
                    updateAsyncItem(asyncItem.value, item)
                    restartTracker()
                }
                else {
                    if (props.variant == 'blade')
                        bladeEvents.closeBlade({ bladeName: props.bladeName })
                    else
                        navBack()
                }

                return Promise.resolve(undefined)
            }
        } = { ...props }
        deleteItem({
            additionalUrl,
            data: dItem,
            nav,
            onDeleteAsync,
            onDeleteSuccessAsync,
            proxyID: proxyID.value,
            storeKey
            // ...params.getOptions(),
            //...(useBladeSrc ? bladeData.value : {}),
            //requireConfirmation: true
        })
    }

    function mRestoreItem(dItem: any) {
        const {
            additionalUrl,
            onRestoreAsync,
            onRestoreSuccessAsync = (item: any) => {
                updateAsyncItem(asyncItem.value, item)
                restartTracker()
                return item
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
    }

    async function refresh(options?: ItemRefreshOptions) {
        showError.value = false

        if (props.item != null) {
            let refreshRes = { data: props.item }
            let returnRes = props.onGetSuccessAsync != null ? await props.onGetSuccessAsync(refreshRes) : refreshRes

            asyncItem.value = returnRes?.data ?? undefined
        }
        else if (props.variant == 'blade' && bladeEvents.bladeData.data.data != null) {
            asyncItem.value = bladeEvents.bladeData.data.data
        }
        else {
            if (props.additionalUrl == null && props.nav == null) {
                asyncItem.value = undefined
                return
            }

            if (props.isSingle === true) {
                const getOptions: GetOptions<T, any> = {
                    additionalUrl: props.additionalUrl,
                    id: id.value as string | undefined,
                    nav,
                    proxyID: proxyID.value,
                    params: {
                        ...allParams.value,
                        ...(useBladeSrc ? bladeEvents.bladeData.data.params : {})
                    },
                    refresh: options?.deepRefresh ?? false,
                    storeKey,
                    onGetAsync: props.onGetAsync,
                    onGetSuccessAsync: props.onGetSuccessAsync
                }

                if (getOptions.id === 'new') {
                    asyncItem.value = props.onGetNew ? props.onGetNew(getOptions) : {} as TReturn
                }
                else if (nav != null) {
                    const apiRes = await getItem<T, TReturn>(getOptions)
                    if (apiRes != null)
                        asyncItem.value = apiRes.data as TReturn | TReturn[]

                    if (asyncItem.value == null && props.onGetNotFound != null)
                        asyncItem.value = props.onGetNotFound(getOptions)
                }
            }
            else if (nav != null) {
                const getAllOptions: GetAllOptions<T, TReturn> = {
                    additionalUrl: props.additionalUrl,
                    id: id.value as string | undefined,
                    nav,
                    proxyID: proxyID.value,
                    params: {
                        ...allParams.value,
                        ...(useBladeSrc ? bladeEvents.bladeData.data.params : {})
                    },
                    refresh: options?.deepRefresh ?? false,
                    storeKey,
                    onGetAsync: props.onGetListAsync,
                    onGetSuccessAsync: props.onGetListSuccessAsync
                }

                const allRes = await getAllItems<T, TReturn>(getAllOptions)

                if (props.findItem != null)
                    asyncItem.value = props.findItem(allRes?.data as TReturn[])
                else
                    asyncItem.value = (allRes?.data as TReturn | TReturn[]) ?? undefined
            }
        }
        
        restartTracker()

        if (emit)
            emit('fetched', asyncItem.value)
    }

    function mSaveItem(dItem: any, options?: SaveItemOptions) {
        const {
            additionalUrl,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync = (item: any) => {
                updateAsyncItem(asyncItem.value, item)

                if (options?.navBack === true) {
                    if (props.variant == 'blade')
                        bladeEvents.closeBlade({ bladeName: props.bladeName })
                    else
                        navBack()
                }
                else {
                    restartTracker()
                    mode.value = 'view'
                }

                if (emit)
                    emit('saved', dItem)

                return Promise.resolve(undefined)
            }
        } = { ...props }
        return saveItem({
            additionalUrl,
            data: dItem,
            nav,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync,
            proxyID: proxyID.value,
            // ...params.getOptions(),
            // ...(useBladeSrc ? bladeData.value : {}),
            // mode: mode.value,
            storeKey
        })
    }

    function toggleMode() {
        const current = toValue(mode)

        if (!current || current == 'view') {
            mode.value = 'edit'
        }
        else if (current == 'edit') {
            mode.value = 'view'
        }
    }

    watch(errorMsg, (v: any) => { showError.value = v != null })

    watch(() => props.refreshToggle, () => {
        refresh({ deepRefresh: true })
    })

    watch(() => props.resetTrackerToggle, () => {
        restartTracker()
    })

    watch(() => props.itemID, () => {
        refresh()
    })
    
    onMounted(async () => {
        if (props.eager == true || (props.eagerWithID == true && id.value != null))
            await refresh({ deepRefresh: route?.params?.refresh == 'true' })
    })

    return {
        asyncItem,
        deleteItem: mDeleteItem,
        errorMsg,
        id,
        isChanged,
        isDeletable,
        isEditing: computed(() => mode.value == 'new' || mode.value == 'edit'),
        isEditable,
        isLoading,
        isNew: computed(() => mode.value == 'new'),
        isRestorable,
        isSaveable,
        loadingMsg,
        mode,
        refresh,
        restoreItem: mRestoreItem,
        saveItem: mSaveItem,
        showError,
        toggleMode,
        ...bladeEvents
    }
}