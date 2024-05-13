import type { GetOptions, OnCanDoAsync, OnDoAsync, OnDoSuccessAsync, OnGetAsync, OnGetSuccessAsync } from './actions.ts'
import type { MaybeRefOrGetter } from 'vue'
import type { StorageMode, StoreMode } from './stores.ts'
import { onMounted, computed, ref, shallowRef, toValue, watch } from 'vue'
import { useStoreDefinition } from './stores.ts'
import { useTracker } from './track.ts'
import { useRoute, useRouter } from 'vue-router'
import { useActions } from './actions.ts'
import type { BladeMode } from '../types.ts'

//unused props for ui
    // canDelete?: boolean
    // canEdit?: boolean
    // canRestore?: boolean
    // hideRefresh?: boolean
    // variant?: BladeVariant

export interface ItemProps {
    additionalUrl?: string
    bladeID?: string
    bladeName?: string,
    canSave?: boolean
    eager?: boolean
    errorMsg?: string
    ignorePermissions?: boolean //?
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
    onGetNew?: () => any
    onGetSaveAsync?: OnDoSuccessAsync
    onRestoreAsync?: OnDoSuccessAsync
    onRestoreSuccessAsync?: OnDoSuccessAsync
    onSaveAsync?: OnDoSuccessAsync
    onSaveSuccessAsync?: OnDoSuccessAsync
    params?: any
    proxyID?: string
    proxyQueryKey?: string
    refreshToggle?: boolean
    startEditing?: boolean
    storeMode?: StoreMode
    storageMode?: StorageMode
    trackChanges?: boolean
    trackIgnoreProps?: string[]
    trackProps?: string []
    useBladeSrc?: boolean
    useRouteSrc?: boolean
}

interface RefreshOptions {
    deepRefresh?: boolean
}

interface SaveItemOptions {
    navBack?: boolean
}

export interface UseItemOptions {
    onError?: (err: any) => void
    storeMode?: StoreMode
    storageMode?: StorageMode
    useRouteSrc?: boolean,
    useBladeSrc?: boolean
}

export function useItem(props: ItemProps, options?: UseItemOptions) {
    const { 
        // useBladeSrc = true,
        useRouteSrc = true
    } = options ?? {}

    const storeMode = props.storeMode ?? options?.storeMode
    const storageMode = props.storageMode ?? options?.storageMode

    const nav = props.nav ?? props.bladeName ?? 'basic'
    const router = useRouter()
    const route = useRoute()

    //server headers
    const qKey = toValue(props.proxyQueryKey)
    const proxyID = computed(() => { return toValue(props.proxyID) ?? (qKey != null ? route?.query?.[qKey] : undefined) as string | undefined; })

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
    // const bladeName = props.bladeName ?? props.nav
    const id = ref(props.itemID ?? (useRouteSrc ? route?.params?.id : undefined))
    const mode = ref<BladeMode>(id.value == 'new' ? 'new' : (props.startEditing ? 'edit' : 'view'))

    const showError = shallowRef(false)

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

    // const { bladeData, sendClose, sendUpdate } = useBladeEvents({
    //     bladeID: allProps.bladeID,
    //     bladeName: bladeName,
    //     nav: nav
    // })

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
                router.back()
                return Promise.resolve(undefined)
            },
            proxyID
        } = { ...props }
        deleteItem({
            additionalUrl,
            data: dItem,
            nav,
            onDeleteAsync,
            onDeleteSuccessAsync,
            proxyID,
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
            proxyID
        } = { ...props }
        restoreItem({
            additionalUrl,
            data: dItem,
            nav,
            onRestoreAsync,
            onRestoreSuccessAsync,
            proxyID,
            // ...params.getOptions(),
            // ...(useBladeSrc ? bladeData.value : {}),
        })
    }

    async function refresh(options?: RefreshOptions) {
        showError.value = false

        if (props.item != null) {
            asyncItem.value = props.item
        }
        else {
            const getOptions: GetOptions = {
                additionalUrl: props.additionalUrl,
                id: id.value as string | undefined,
                nav,
                proxyID: proxyID.value,
                params: props.params,
                // ...(useBladeSrc ? bladeData.value : {}),
                refresh: options?.deepRefresh ?? false,
                onGetAsync: props.onGetAsync,
                onGetSuccessAsync: props.onGetSuccessAsync
            }
    
            if (props.isSingle === true) {
                if (getOptions.id === 'new') {
                    asyncItem.value = props.onGetNew ? props.onGetNew() : {}
                }
                else {
                    asyncItem.value = await getItem(getOptions)
                }
            }
            else {
                const getRes = await getAllItems(getOptions)
                asyncItem.value = getRes.data
            }
        }
        
        restartTracker()
    }

    function mSaveItem(dItem: MaybeRefOrGetter<any>, options?: SaveItemOptions) {
        const {
            additionalUrl,
            onCanSaveAsync,
            onGetSaveAsync,
            onSaveAsync,
            onSaveSuccessAsync = (item: any) => {
                if (options?.navBack === true) {
                    router.back()
                }
                else {
                    if (dItem.rowVersion != null && item.rowVersion != null)
                        dItem.rowVersion = item.rowVersion
                    
                    restartTracker()
                    mode.value = 'view'
                }

                return Promise.resolve(undefined)
            }
        } = { ...props }
        saveItem({
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
            mode: mode.value
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

    watch(errorMsg, (v) => { showError.value = v != null })

    watch(() => props.refreshToggle, () => {
        refresh({ deepRefresh: true })
    })
    
    onMounted(async () => {
        if (props.eager == true)
            await refresh({ deepRefresh: route?.params?.refresh == 'true' })
    })

    return {
        asyncItem,
        deleteItem: mDeleteItem,
        errorMsg,
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
        toggleMode
    }

}