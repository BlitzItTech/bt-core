import type { BladeMode } from '../composables/blade.ts'
import { type StorePathOptions, BTStoreDefinition, StoreGetReturn, StoreGetAllReturn, useStoreDefinition, StoreMode, StorageMode } from './stores.ts'
import { type BTApi, useApi } from '../composables/api.ts'
import { useActionsTracker, type DoActionOptions } from '../composables/actions-tracker.ts'
import { ShallowRef, ComputedRef } from 'vue'
import { useNavigation } from './navigation.ts'

export type OnCanDoAsync<T> = (item: T) => Promise<string | undefined>
export type OnDoAsync<T> = (item: T) => Promise<string | undefined>
export type OnDoSuccessAsync<T, TReturn> = (item: T) => Promise<TReturn | undefined>
export type OnDoMaybeSuccessAsync<T, TReturn> = (item?: T) => Promise<TReturn | undefined>
export type OnDoActionAsync<T> = (item: T) => Promise<T | undefined>

export type OnGetAsync<T> = (opt?: StorePathOptions) => Promise<StoreGetReturn<T | T[]> | undefined>
export type OnGetSuccessAsync<T, TReturn> = (item: StoreGetReturn<T | T[]>, opt?: StorePathOptions) => Promise<StoreGetReturn<T | T[] | TReturn | TReturn[]> | undefined>

export type OnGetAllAsync<T> = (opt?: StorePathOptions) => Promise<StoreGetAllReturn<T> | undefined>
export type OnGetAllSuccessAsync<T, TReturn> = (item: StoreGetAllReturn<T>, opt?: StorePathOptions) => Promise<StoreGetAllReturn<T | TReturn> | undefined>

export interface StoreAction {
    /**particularly what store syle to use */
    storeMode?: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode?: StorageMode
    store?: BTStoreDefinition
}

export interface GetOptions<T, TReturn> extends StoreAction, StorePathOptions, DoActionOptions {
    /**returns an error msg if failed */
    onGetAsync?: OnGetAsync<T>
    /**called after get occurs successfully */
    onGetSuccessAsync?: OnGetSuccessAsync<T, TReturn>
}

export interface GetAllOptions<T, TReturn> extends StoreAction, StorePathOptions, DoActionOptions {
    /**returns an error msg if failed */
    onGetAsync?: OnGetAllAsync<T>
    /**called after get occurs successfully */
    onGetSuccessAsync?: OnGetAllSuccessAsync<T, TReturn>
}

export interface DeleteOptions<T> extends StoreAction, StorePathOptions, DoActionOptions {
    /**only applies if connecting to store */
    deleteStrat?: 'soft' | undefined
    /**Returns a string if cannot */
    onCanDeleteAsync?: OnCanDoAsync<T>
    /**Will override the default store delete action */
    onDeleteAsync?: OnDoActionAsync<T>
    /**Will open a dialog box requesting user confirmation for delete action */
    onDeleteSuccessAsync?: OnDoMaybeSuccessAsync<T, T>
}

export interface RestoreOptions<T> extends StoreAction, StorePathOptions, DoActionOptions {
    /**Returns a string if cannot */
    onCanRestoreAsync?: OnCanDoAsync<T>
    /**Will override the default store delete action */
    onRestoreAsync?: OnDoActionAsync<T>
    /**Called after restore succeeds */
    onRestoreSuccessAsync?: OnDoSuccessAsync<T, T>
}

export interface SaveOptions<T, TSave, TReturn> extends StoreAction, StorePathOptions, DoActionOptions {
    getMode?: (item: any) => BladeMode
    // /**will seek to post if 'new' otherwise will patch */
    // mode?: BladeMode
    /**called to check whether to proceed with save */
    onCanSaveAsync?: OnCanDoAsync<T | TSave>
    /**
     * retrieves item to save
     * called before seeing whether it can save
     */
    onGetSaveAsync?: OnDoSuccessAsync<T, TSave>
    /**Will override the default store post/patch action */
    onSaveAsync?: (item: T | TSave) => Promise<T | undefined> //OnDoActionAsync<T | TSave>
    /**Called after save succeeds */
    onSaveSuccessAsync?: OnDoSuccessAsync<T, TReturn>
    // onUpdateAsyncItem?: (asyncItem: Ref<TReturn | TReturn[] | undefined>, newVersionItem: T) => void
}

export interface ActionOptions extends StorePathOptions, DoActionOptions {
    
}

export interface ApiActionOptions extends StorePathOptions, DoActionOptions {
    api?: BTApi
}

export interface UseActionsOptions extends DoActionOptions {
    nav?: string
    proxyID?: string
    refresh?: boolean
    store?: BTStoreDefinition
    storeKey?: string
    /**particularly what store syle to use */
    storeMode?: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode?: StorageMode
    throwError?: boolean
    url?: string,
    /**for basic functionality when no store is provided */
    items?: any[]
}

export interface BTActions {
    actionLoadingMsg: ShallowRef<string | undefined>
    actionErrorMsg: ShallowRef<string | undefined>
    apiGet: <TReturn>(doOptions: ApiActionOptions) => Promise<TReturn | undefined>
    apiPatch: <TReturn>(doOptions: ApiActionOptions) => Promise<TReturn | undefined>
    apiPost: <TReturn>(doOptions: ApiActionOptions) => Promise<TReturn | undefined>
    apiUpload: <TReturn>(doOptions: ApiActionOptions) => Promise<TReturn | undefined>
    clearErrors: () => void
    deleteItem: <T>(doOptions: DeleteOptions<T>) => Promise<string | undefined>
    doAction: (action: any, options?: DoActionOptions) => Promise<any>
    getAllItems: <T, TReturn>(doOptions: GetAllOptions<T, TReturn>) => Promise<StoreGetAllReturn<T | TReturn> | undefined>
    getItem: <T, TReturn>(doOptions: GetOptions<T, TReturn>) => Promise<StoreGetReturn<T | T[] | TReturn | TReturn[]> | undefined>
    isLoading: ComputedRef<boolean>
    logError: (err?: string | Error) => void
    restoreItem: <T>(doOptions: RestoreOptions<T>) => Promise<T | undefined>
    saveItem: <T, TSave, TReturn>(doOptions: SaveOptions<T, TSave, TReturn>) => Promise<TReturn | undefined>
}

export function useActions(options?: UseActionsOptions): BTActions {
    const { actionErrorMsg, actionLoadingMsg, clearErrors, isLoading, doAction, logError } = useActionsTracker(
        {
            ...options,
            stringifyError: (err: any) => {
                if (typeof err == 'object') {
                    return err.message
                }

                return err?.toString()
            }
        })
    
        const nav = useNavigation()

    function deleteItem<T>(doOptions: DeleteOptions<T>) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.storeMode ??= options?.storeMode
        doOptions.storageMode ??= options?.storageMode
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to delete this item?' : undefined

        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ 
                nav: doOptions.nav,
                storeMode: doOptions.storeMode,
                storageMode: doOptions.storageMode
            })
        }
        
        if (store != null) {
            doOptions.deleteStrat ??= nav.findItem(doOptions.nav)?.deleteStrat ?? undefined
            
            if (doOptions.deleteStrat == 'soft') {
                doOptions.additionalUrl ??= '/delete'
                doOptions.onDeleteAsync ??= () => {
                    return store().patch<T>(doOptions)
                }
            }
            else {
                doOptions.onDeleteAsync ??= () => {
                    return store().deleteItem(doOptions)
                }
            }
        }
        else {
            doOptions.onDeleteAsync ??= () => {
                const id = doOptions.id ?? doOptions.data?.id
                if (id == null)
                    return Promise.resolve(undefined)

                const ind = items.findIndex(x => x.id == id)
                if (ind >= 0)
                    items.splice(ind, 1)

                return Promise.resolve(undefined)
            }
        }

        return doAction<string | undefined>(async () => {
            let err: string | undefined
            let res: T | undefined

            if (doOptions.onCanDeleteAsync != null)
                err = await doOptions.onCanDeleteAsync(doOptions.data)

            if (err == undefined && doOptions.onDeleteAsync != null)
                res = await doOptions.onDeleteAsync(doOptions.data)

            logError(err)

            if (err == null && doOptions.onDeleteSuccessAsync != null) {
                return await doOptions.onDeleteSuccessAsync(res)
            }

            return undefined
        }, {
            ...options,
            ...doOptions,
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Deleting',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    function getItem<T, TReturn>(doOptions: GetOptions<T, TReturn>) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.storeMode ??= options?.storeMode
        doOptions.storageMode ??= options?.storageMode
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get this item?' : undefined

        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ 
                nav: doOptions.nav,
                storeMode: doOptions.storeMode,
                storageMode: doOptions.storageMode
            })
        }

        if (store != null) {
            doOptions.onGetAsync ??= async () => {
                return await store().get<T>(doOptions)
            }
        }
        else {
            doOptions.onGetAsync ??= () => {
                const id = doOptions.id ?? doOptions.data?.id

                if (id == null)
                    return Promise.resolve(undefined)

                return Promise.resolve({ data: items.find(x => x.id == id) })
            }
        }

        return doAction<StoreGetReturn<T | T[] | TReturn | TReturn[]>>(async () => {
            let res: StoreGetReturn<T | T[]> | undefined
            
            if (doOptions.onGetAsync != null)
                res = await doOptions.onGetAsync(doOptions)

            if (res != null && doOptions.onGetSuccessAsync != null)
                return await doOptions.onGetSuccessAsync(res, doOptions)

            return res
        }, {
            ...options,
            ...doOptions,
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Retrieving',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    function getAllItems<T, TReturn>(doOptions: GetAllOptions<T, TReturn>) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.storeMode ??= options?.storeMode
        doOptions.storageMode ??= options?.storageMode
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get these items?' : undefined
        
        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []
        
        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ 
                nav: doOptions.nav,
                storeMode: doOptions.storeMode,
                storageMode: doOptions.storageMode
            })
        }

        if (store != null) {
            doOptions.onGetAsync ??= () => {
                return store().getAll<T>(doOptions)
            }
        }
        else {
            doOptions.onGetAsync ??= () => {
                return Promise.resolve({ data: items })
            }
        }

        return doAction<StoreGetAllReturn<T | TReturn>>(async () => {
            let res: StoreGetAllReturn<T> | undefined
            
            if (doOptions.onGetAsync != null)
                res = await doOptions.onGetAsync(doOptions)

            if (res != null && doOptions.onGetSuccessAsync != null)
                return await doOptions.onGetSuccessAsync(res, doOptions)

            return res
        }, {
            ...options,
            ...doOptions,
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Retrieving',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    function restoreItem<T>(doOptions: RestoreOptions<T>) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.storeMode ??= options?.storeMode
        doOptions.storageMode ??= options?.storageMode
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to restore this item?' : undefined
        
        let store = doOptions?.store ?? options?.store
        
        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ 
                nav: doOptions.nav,
                storeMode: doOptions.storeMode,
                storageMode: doOptions.storageMode
            })
        }

        if (store != null) {
            doOptions.onRestoreAsync ??= () => {
                return store().restore<T>(doOptions)
            }
        }
        
        return doAction<T>(async () => {
            let err: string | undefined
            let res: T | undefined

            if (doOptions.onCanRestoreAsync != null)
                err = await doOptions.onCanRestoreAsync(doOptions.data)

            if (err == undefined && doOptions.onRestoreAsync != null)
                res = await doOptions.onRestoreAsync(doOptions.data)

            logError(err)

            if (res != null && doOptions.onRestoreSuccessAsync != null)
                return await doOptions.onRestoreSuccessAsync(res)
            
            return res
        }, {
            ...options,
            ...doOptions,
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Restoring',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    function saveItem<T, TSave, TReturn>(doOptions: SaveOptions<T, TSave, TReturn>) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.storeMode ??= options?.storeMode
        doOptions.storageMode ??= options?.storageMode
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to save this item?' : undefined
        
        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        doOptions.onGetSaveAsync ??= (item: any) => item
        doOptions.onCanSaveAsync ??= () => Promise.resolve(undefined)
        doOptions.getMode ??= (item: any) => item.id == null ? 'new' : 'edit'

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ 
                nav: doOptions.nav,
                storeMode: doOptions.storeMode,
                storageMode: doOptions.storageMode
            })
        }
        
        if (store != null) {
            doOptions.onSaveAsync ??= async (item: T | TSave) => {
                if (item == null)
                    return undefined

                const mode = doOptions.getMode!(item) // item.id == null ? 'new' : 'edit'
                doOptions.data = item
                // const newOptions = {
                //     ...doOptions,
                //     data: item
                // }

                if (mode == 'new')
                    return await store().post<T>(doOptions)
                else
                    return await store().patch<T>(doOptions)
            }
        }
        else {
            doOptions.onSaveAsync ??= (item: any) => {
                const ind = items.findIndex(x => x.id == item.id)
                if (ind >= 0)
                    items.splice(ind, 1, item)
                else
                    items.push(item)

                return Promise.resolve(item)
            }
        }

        return doAction<TReturn>(async () => {
            let itemToSave: TSave | undefined

            if (doOptions.onGetSaveAsync != null)
                itemToSave = await doOptions.onGetSaveAsync(doOptions.data)

            if (itemToSave == null)
                return undefined

            if (doOptions.onCanSaveAsync != null) {
                let err = await doOptions.onCanSaveAsync(itemToSave)
                
                logError(err)

                if (err != null)
                    return undefined
            }

            let res: T | undefined
            if (doOptions.onSaveAsync != null)
                res = await doOptions.onSaveAsync(itemToSave)

            if (res != null && doOptions.onSaveSuccessAsync != null)
                return await doOptions.onSaveSuccessAsync(res)

            return res
        }, {
            ...options,
            ...doOptions,
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Saving',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    /**
    * Get from api (no extra '/get' url or anything)
    */
    function apiGet<T>(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url

        return doAction<T>(async () => {
            const api = doOptions.api ?? useApi()
            return await api.get(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Post to api (no extra '/post' url or anything)
     * @param options 
     */
    function apiPost<T>(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction<T>(async () => {
            const api = doOptions.api ?? useApi()
            return await api.post(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Post to api (no extra '/post' url or anything)
     * @param options 
     */
    function apiUpload<T>(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction<T>(async () => {
            const api = doOptions.api ?? useApi()
            return await api.uploadImage(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Patch to api (no extra '/patch' url or anything)
     * @param options 
     */
    function apiPatch<T>(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction<T>(async () => {
            const api = doOptions.api ?? useApi()
            return await api.patch<T>(doOptions)
        }, { ...options, ...doOptions })
    }
    
    return {
        actionLoadingMsg,
        actionErrorMsg,
        apiGet,
        apiPatch,
        apiPost,
        apiUpload,
        clearErrors,
        deleteItem,
        // deleteLocalItem,
        doAction,
        getAllItems,
        getItem,
        isLoading,
        logError,
        restoreItem,
        saveItem
    }
}


//#endregion