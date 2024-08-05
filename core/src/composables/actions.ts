import type { BladeMode } from '../composables/blade.ts'
import { type StorePathOptions, BTStoreDefinition, useStoreDefinition } from './stores.ts'
import { type BTApi, useApi } from '../composables/api.ts'
import { useActionsTracker, type DoActionOptions } from '../composables/actions-tracker.ts'
import { ShallowRef, ComputedRef } from 'vue'

export type OnCanDoAsync = (item: any) => Promise<string | undefined>
export type OnDoAsync = (item: any) => Promise<string | undefined>
export type OnDoSuccessAsync = (item: any) => Promise<any>
export type OnGetAsync = (opt?: GetOptions) => Promise<any>
export type OnGetSuccessAsync = (item: any, opt?: GetOptions) => Promise<any>

export interface GetOptions extends StorePathOptions, DoActionOptions {
    /**returns an error msg if failed */
    onGetAsync?: OnGetAsync
    /**called after get occurs successfully */
    onGetSuccessAsync?: OnGetSuccessAsync
    store?: BTStoreDefinition
}

export interface DeleteOptions extends StorePathOptions, DoActionOptions {
    /**Returns a string if cannot */
    onCanDeleteAsync?: OnCanDoAsync
    /**Will override the default store delete action */
    onDeleteAsync?: OnDoAsync
    /**Will open a dialog box requesting user confirmation for delete action */
    onDeleteSuccessAsync?: OnDoAsync
    store?: BTStoreDefinition
}

export interface RestoreOptions extends StorePathOptions, DoActionOptions {
    /**Returns a string if cannot */
    onCanRestoreAsync?: OnCanDoAsync
    /**Will override the default store delete action */
    onRestoreAsync?: OnDoSuccessAsync
    /**Called after restore succeeds */
    onRestoreSuccessAsync?: OnDoSuccessAsync
    store?: BTStoreDefinition
}

export interface SaveOptions extends StorePathOptions, DoActionOptions {
    /**will seek to post if 'new' otherwise will patch */
    mode?: BladeMode
    /**called to check whether to proceed with save */
    onCanSaveAsync?: OnCanDoAsync
    /**
     * retrieves item to save
     * called before seeing whether it can save
     */
    onGetSaveAsync?: OnDoSuccessAsync
    /**Will override the default store post/patch action */
    onSaveAsync?: OnDoSuccessAsync
    /**Called after save succeeds */
    onSaveSuccessAsync?: OnDoSuccessAsync
    store?: BTStoreDefinition
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
    throwError?: boolean
    url?: string,
    /**for basic functionality when no store is provided */
    items?: any[]
}

export interface BTActions {
    actionLoadingMsg: ShallowRef<string | undefined>
    actionErrorMsg: ShallowRef<string | undefined>
    apiGet: (doOptions: ApiActionOptions) => Promise<any>
    apiPatch: (doOptions: ApiActionOptions) => Promise<any>
    apiPost: (doOptions: ApiActionOptions) => Promise<any>
    apiUpload: (doOptions: ApiActionOptions) => Promise<any>
    clearErrors: () => void
    deleteItem: (doOptions: DeleteOptions) => Promise<any>
    // deleteLocalItem: (doOptions: DeleteOptions) => Promise<any>
    doAction: (action: any, options?: DoActionOptions) => Promise<any>
    getAllItems: (doOptions: GetOptions) => Promise<any>
    getItem: (doOptions: GetOptions) => Promise<any>
    isLoading: ComputedRef<boolean>
    logError: (err?: string | Error) => void
    restoreItem: (doOptions: RestoreOptions) => Promise<any>
    saveItem: (doOptions: SaveOptions) => Promise<any>
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

    function deleteItem(doOptions: DeleteOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to delete this item?' : undefined

        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ nav: doOptions.nav })
        }

        if (store != null) {
            doOptions.onDeleteAsync ??= () => {
                return store().deleteItem(doOptions)
            }
        }
        else {
            doOptions.onDeleteAsync ??= () => {
                const id = doOptions.id ?? doOptions.data?.id
                if (id == null)
                    return Promise.resolve('No id found in delete action')

                const ind = items.findIndex(x => x.id == id)
                if (ind >= 0)
                    items.splice(ind, 1)

                return Promise.resolve(undefined)
            }
        }

        return doAction(async () => {
            let err: string | undefined

            if (doOptions.onCanDeleteAsync != null)
                err = await doOptions.onCanDeleteAsync(doOptions.data)

            if (err == undefined && doOptions.onDeleteAsync != null)
                err = await doOptions.onDeleteAsync(doOptions.data)

            if (err == undefined && doOptions.onDeleteSuccessAsync != null) {
                await doOptions.onDeleteSuccessAsync(doOptions.data)
            }

            logError(err)

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

    // function deleteLocalItem(doOptions: DeleteOptions) {
    //     doOptions.nav ??= options?.nav
    //     doOptions.proxyID ??= options?.proxyID
    //     doOptions.refresh ??= options?.refresh
    //     doOptions.storeKey ??= options?.storeKey
    //     doOptions.throwError ??= options?.throwError
    //     doOptions.url ??= options?.url
    //     doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to delete this item?' : undefined

    //     let store = null // createStoreDefinition({ nav: doOptions.nav })
        
    //     const items = options?.items ?? []

    //     if (store == null && doOptions.nav != null) {
    //         store = createStoreDefinition({ nav: doOptions.nav })
    //     }

    //     if (store != null) {
    //         doOptions.onDeleteAsync ??= () => {
    //             return store().deleteItem(doOptions)
    //         }
    //     }
    //     else {
    //         doOptions.onDeleteAsync ??= () => {
    //             const id = doOptions.id ?? doOptions.data?.id
    //             if (id == null)
    //                 return Promise.resolve('No id found in delete action')

    //             const ind = items.findIndex(x => x.id == id)
    //             if (ind >= 0)
    //                 items.splice(ind, 1)

    //             return Promise.resolve(undefined)
    //         }
    //     }

    //     return doAction(async () => {
    //         let err: string | undefined

    //         if (doOptions.onCanDeleteAsync != null)
    //             err = await doOptions.onCanDeleteAsync(doOptions.data)

    //         if (err == undefined && doOptions.onDeleteAsync != null)
    //             err = await doOptions.onDeleteAsync(doOptions.data)

    //         if (err == undefined && doOptions.onDeleteSuccessAsync != null) {
    //             await doOptions.onDeleteSuccessAsync(doOptions.data)
    //         }

    //         logError(err)

    //         return undefined
    //     }, {
    //         ...options,
    //         ...doOptions,
    //         completionMsg: doOptions.completionMsg ?? options?.completionMsg,
    //         confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
    //         errorMsg: doOptions.errorMsg ?? options?.errorMsg,
    //         loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Deleting',
    //         requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
    //         throwError: doOptions.throwError ?? options?.throwError
    //     })
    // }

    function getItem(doOptions: GetOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get this item?' : undefined

        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ nav: doOptions.nav })
        }

        if (store != null) {
            doOptions.onGetAsync ??= async () => {
                let res = await store().get(doOptions)
                return res.data
            }
        }
        else {
            doOptions.onGetAsync ??= () => {
                const id = doOptions.id ?? doOptions.data?.id

                if (id == null)
                    return Promise.resolve(undefined)

                return Promise.resolve(items.find(x => x.id == id))
            }
        }

        return doAction(async () => {
            let res: any
            
            if (doOptions.onGetAsync != null) {
                res = await doOptions.onGetAsync(doOptions)
            }

            if (doOptions.onGetSuccessAsync != null)
                res = await doOptions.onGetSuccessAsync(res, doOptions)

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

    function getAllItems(doOptions: GetOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get these items?' : undefined
        
        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ nav: doOptions.nav })
        }

        if (store != null) {
            doOptions.onGetAsync ??= () => {
                return store().getAll(doOptions)
            }
        }
        else {
            doOptions.onGetAsync ??= () => {
                return Promise.resolve(items)
            }
        }

        return doAction(async () => {
            let res: any
            
            if (doOptions.onGetAsync != null) {
                res = await doOptions.onGetAsync(doOptions)
            }

            if (doOptions.onGetSuccessAsync != null)
                res = await doOptions.onGetSuccessAsync(res, doOptions)

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

    function restoreItem(doOptions: RestoreOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to restore this item?' : undefined
        
        let store = doOptions?.store ?? options?.store
        
        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ nav: doOptions.nav })
        }

        if (store != null) {
            doOptions.onRestoreAsync ??= () => {
                return store().restore(doOptions)
            }
        }
        
        return doAction(async () => {
            let err: string | undefined
            let res: any

            if (doOptions.onCanRestoreAsync != null)
                err = await doOptions.onCanRestoreAsync(doOptions.data)

            if (err == undefined && doOptions.onRestoreAsync != null)
                res = await doOptions.onRestoreAsync(doOptions.data)

            if (res != null && doOptions.onRestoreSuccessAsync != null)
                await doOptions.onRestoreSuccessAsync(res)
            
            logError(err)

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

    function saveItem(doOptions: SaveOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to save this item?' : undefined
        
        let store = doOptions?.store ?? options?.store
        const items = options?.items ?? []

        doOptions.onGetSaveAsync ??= (item: any) => item
        doOptions.onCanSaveAsync ??= () => Promise.resolve(undefined)

        if (store == null && doOptions.nav != null) {
            store = useStoreDefinition({ nav: doOptions.nav })
        }
        
        if (store != null) {
            doOptions.onSaveAsync ??= async (item: any) => { //item: any
                if (item == null)
                    return null

                doOptions.mode ??= item.id == null ? 'new' : 'edit'
                doOptions.data = item

                if (doOptions.mode == 'new')
                    return await store().post(doOptions)
                else
                    return await store().patch(doOptions)
            }
        }
        else {
            doOptions.onSaveAsync ??= (item: any) => {
                const ind = items.findIndex(x => x.id == item.id)
                if (ind >= 0) {
                    items.splice(ind, 1, item)
                }
                else {
                    items.push(item)
                }

                return Promise.resolve(item)
            }
        }

        return doAction(async () => {
            let itemToSave: any

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

            let res: any
            if (doOptions.onSaveAsync != null) {
                res = await doOptions.onSaveAsync(itemToSave)
                res = res?.data != null ? res.data : res
            }

            if (doOptions.onSaveSuccessAsync != null) {
                res = await doOptions.onSaveSuccessAsync(res)
            }

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
    function apiGet(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url

        return doAction(async () => {
            const api = doOptions.api ?? useApi()
            return await api.get(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Post to api (no extra '/post' url or anything)
     * @param options 
     */
    function apiPost(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction(async () => {
            const api = doOptions.api ?? useApi()
            return await api.post(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Post to api (no extra '/post' url or anything)
     * @param options 
     */
    function apiUpload(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction(async () => {
            const api = doOptions.api ?? useApi()
            return await api.uploadImage(doOptions)
        }, { ...options, ...doOptions })
    }

    /**
     * Patch to api (no extra '/patch' url or anything)
     * @param options 
     */
    function apiPatch(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.storeKey ??= options?.storeKey
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction(async () => {
            const api = doOptions.api ?? useApi()
            return await api.patch(doOptions)
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