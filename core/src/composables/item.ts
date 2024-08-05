import type { GetOptions, OnCanDoAsync, OnDoAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync } from './actions.ts'
import type { MaybeRefOrGetter } from 'vue'
import type { StorageMode, StoreMode } from './stores.ts'
import { onMounted, computed, ref, shallowRef, toValue, watch } from 'vue'
import { useStoreDefinition } from './stores.ts'
import { useTracker } from './track.ts'
import { useRoute } from 'vue-router'
import { useActions } from './actions.ts'
import { useBlade, type BladeMode, type BladeVariant } from '../composables/blade.ts'
import { useNavBack } from './navigation.ts'

//unused props for ui
    // canDelete?: boolean
    // canEdit?: boolean
    // canRestore?: boolean
    // hideRefresh?: boolean

export interface ItemProps {
    additionalUrl?: string
    bladeGroup?: string
    bladeName?: string,
    bladeStartShowing?: boolean
    canSave?: boolean
    eager?: boolean
    errorMsg?: string
    ignorePermissions?: boolean //?
    includeDetails?: boolean
    isSingle?: boolean
    item?: any
    itemID?: string
    loadingMsg?: string
    // mode?: BladeMode
    nav?: string
    onCanDelete?: (item: any) => boolean
    onCanDeleteAsync?: OnCanDoAsync
    onCanEdit?: (item: any) => boolean
    onCanRestore?: (item: any) => boolean
    onCanRestoreAsync?: OnCanDoAsync
    onCanSave?: (item: any) => boolean
    onCanSaveAsync?: OnCanDoAsync
    onDeleteAsync?: OnDoAsync
    onDeleteSuccessAsync?: OnDoSuccessAsync
    onError?: (err: any) => void
    onGetAsync?: OnGetAsync
    onGetSuccessAsync?: OnGetSuccessAsync
    onGetNew?: (data?: GetOptions) => any
    onGetSaveAsync?: OnDoSuccessAsync
    onRestoreAsync?: OnDoSuccessAsync
    onRestoreSuccessAsync?: OnDoSuccessAsync
    onSaveAsync?: OnDoSuccessAsync
    onSaveSuccessAsync?: OnDoSuccessAsync
    params?: any
    proxyID?: string
    proxyKey?: string
    refreshToggle?: boolean
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
export function useItem(props: ItemProps, emit?: ItemEvents, options?: UseItemOptions) {
    const useBladeSrc = options?.useBladeSrc ?? props.useBladeSrc ?? props.variant == 'blade'
    const useRouteSrc = options?.useRouteSrc ??props.useRouteSrc ?? props.variant == 'page'

    const storeKey = props.storeKey ?? options?.storeKey
    const storeMode = props.storeMode ?? options?.storeMode
    const storageMode = props.storageMode ?? options?.storageMode

    const defaultProxyKey = props.proxyKey ?? 'proxyID'
    const nav = props.nav ?? props.bladeName ?? 'basic'
    // const bladeName = props.bladeName ?? props.nav ?? 'basic'
    // const nav = props.nav
    const { navBack } = useNavBack()
    const route = useRoute()

    const bladeEvents = useBlade({
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

    const asyncItem = ref<any>(undefined)

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
        
        const item = toValue(asyncItem)
        if (props.onCanDelete != null)
            return props.onCanDelete(item)

        if (item?.isInactive === true)
            return false

        return true
    })
    const isEditable = computed(() => {
        if (mode.value == 'new')
            return false

        const item = toValue(asyncItem)
        if (props.onCanEdit != null)
            return props.onCanEdit(item)

        return true
    })
    const isRestorable = computed(() => {
        if (mode.value == 'new')
            return false

        const item = toValue(asyncItem)
        if (props.onCanRestore != null)
            return props.onCanRestore(item)

        if (item?.isInactive === true)
            return true

        return false
    })
    const isSaveable = computed(() => {
        const item = toValue(asyncItem)
        if (props.onCanSave != null)
            return props.onCanSave(item)

        return true
    })

    const { isChanged, restartTracker } = useTracker(asyncItem, { 
        useTracker: props.trackChanges,
        propsToIgnore: props.trackIgnoreProps,
        propsToTrack: props.trackProps
    })

    function mDeleteItem(dItem: MaybeRefOrGetter<any>) {
        const {
            additionalUrl,
            onDeleteAsync,
            onDeleteSuccessAsync = () => {
                if (props.variant == 'blade')
                    bladeEvents.closeBlade({ bladeName: props.bladeName })
                else
                    navBack()

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

    function mRestoreItem(dItem: MaybeRefOrGetter<any>) {
        const {
            additionalUrl,
            onRestoreAsync,
            onRestoreSuccessAsync,
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
            asyncItem.value = props.item
        }
        else if (props.variant == 'blade' && bladeEvents.bladeData.data.data != null) {
            asyncItem.value = bladeEvents.bladeData.data.data
        }
        else {
            const getOptions: GetOptions = {
                additionalUrl: props.additionalUrl,
                id: id.value as string | undefined,
                nav,
                proxyID: proxyID.value,
                params: allParams.value, //props.params,
                // ...(useBladeSrc ? bladeData.value : {}),
                refresh: options?.deepRefresh ?? false,
                storeKey,
                onGetAsync: props.onGetAsync,
                onGetSuccessAsync: props.onGetSuccessAsync
            }
    
            if (props.isSingle === true) {
                if (getOptions.id === 'new') {
                    asyncItem.value = props.onGetNew ? props.onGetNew(getOptions) : {}
                }
                else if (nav != null) {
                    asyncItem.value = await getItem(getOptions)
                }
            }
            else if (nav != null) {
                const getRes = await getAllItems(getOptions)
                asyncItem.value = getRes.data
            }
        }
        
        restartTracker()

        if (emit)
            emit('fetched', asyncItem.value)
    }

    function mSaveItem(dItem: MaybeRefOrGetter<any>, options?: SaveItemOptions) {
        const {
            additionalUrl,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync = (item: any) => {
                if (options?.navBack === true) {
                    if (props.variant == 'blade')
                        bladeEvents.closeBlade({ bladeName: props.bladeName })
                    else
                        navBack()
                }
                else {
                    if (dItem.rowVersion != null && item.rowVersion != null)
                        dItem.rowVersion = item.rowVersion
                    
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
            mode: mode.value,
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

    watch(() => props.itemID, () => {
        refresh()
    })
    
    onMounted(async () => {
        if (props.eager == true)
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