import type { BladeMode } from '../types'
import { BTStoreDefinition } from '../composables/stores'
import { BTApi, type PathOptions } from '../composables/api'
import { useActionsTracker, type DoActionOptions } from '../composables/actions-tracker'
import { ShallowRef, ComputedRef } from 'vue'

export type OnCanDoAsync = (item: any) => Promise<string | undefined>
export type OnDoAsync = (item: any) => Promise<string | undefined>
export type OnDoSuccessAsync = (item: any) => Promise<any>
export type OnGetAsync = (opt?: GetOptions) => Promise<any>
export type OnGetSuccessAsync = (item: any, opt?: GetOptions) => Promise<any>

export interface GetOptions extends PathOptions, DoActionOptions {
    /**returns an error msg if failed */
    onGetAsync?: OnGetAsync
    /**called after get occurs successfully */
    onGetSuccessAsync?: OnGetSuccessAsync
    store?: BTStoreDefinition
}

export interface DeleteOptions extends PathOptions, DoActionOptions {
    /**Returns a string if cannot */
    onCanDeleteAsync?: OnCanDoAsync
    /**Will override the default store delete action */
    onDeleteAsync?: OnDoAsync
    /**Will open a dialog box requesting user confirmation for delete action */
    onDeleteSuccessAsync?: OnDoAsync
    store?: BTStoreDefinition
}

export interface RestoreOptions extends PathOptions, DoActionOptions {
    /**Returns a string if cannot */
    onCanRestoreAsync?: OnCanDoAsync
    /**Will override the default store delete action */
    onRestoreAsync?: OnDoSuccessAsync
    /**Called after restore succeeds */
    onRestoreSuccessAsync?: OnDoSuccessAsync
    store?: BTStoreDefinition
}

export interface SaveOptions extends PathOptions, DoActionOptions {
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

export interface ApiActionOptions extends PathOptions, DoActionOptions {
    api: BTApi
}

export interface UseActionsOptions extends DoActionOptions {
    nav?: string
    proxyID?: string
    refresh?: boolean
    store?: BTStoreDefinition
    throwError?: boolean
    url?: string
}

export interface BTActions {
    apiGet: (doOptions: ApiActionOptions) => Promise<any>
    apiPost: (doOptions: ApiActionOptions) => Promise<any>
    actionLoadingMsg: ShallowRef<string | undefined>
    actionErrorMsg: ShallowRef<string | undefined>
    clearErrors: () => void
    deleteItem: (doOptions: DeleteOptions) => Promise<any>
    doAction: (action: any, options?: DoActionOptions) => Promise<any>
    getAllItems: (doOptions: GetOptions) => Promise<any>
    getItem: (doOptions: GetOptions) => Promise<any>
    isLoading: ComputedRef<boolean>
    logError: (err?: string | Error) => void
    restoreItem: (doOptions: RestoreOptions) => Promise<any>
    saveItem: (doOptions: SaveOptions) => Promise<any>
}

export function useActions(options?: UseActionsOptions): BTActions {
    const { actionErrorMsg, actionLoadingMsg, clearErrors, isLoading, doAction, logError } = useActionsTracker(options)

    function deleteItem(doOptions: DeleteOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to delete this item?' : undefined
        doOptions.store ??= options?.store
        const store = doOptions?.store ?? options?.store

        if (doOptions.nav != null && store != null) {
            doOptions.onDeleteAsync ??= () => {
                return store().deleteItem(doOptions)
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
        }, {
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Deleting',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }

    function getItem(doOptions: GetOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get this item?' : undefined
        const store = doOptions?.store ?? options?.store

        if (doOptions.nav != null && store != null) {
            doOptions.onGetAsync ??= () => {
                return store().get(doOptions)
            }
        }

        return doAction(async () => {
            let res: any
            
            if (doOptions.onGetAsync != null) {
                res = await doOptions.onGetAsync(doOptions)
                res = res.data
            }

            if (doOptions.onGetSuccessAsync != null)
                res = await doOptions.onGetSuccessAsync(res, doOptions)

            return res
        }, {
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
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to get these items?' : undefined
        const store = doOptions?.store ?? options?.store

        if (doOptions.nav != null && store != null) {
            doOptions.onGetAsync ??= () => {
                return store().getAll(doOptions)
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
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to restore this item?' : undefined
        const store = doOptions?.store ?? options?.store

        if (doOptions.nav != null && store != null) {
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
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        doOptions.confirmationMsg ??= doOptions.requireConfirmation === true ? 'Are you sure you want to save this item?' : undefined
        const store = doOptions?.store ?? options?.store

        doOptions.onGetSaveAsync ??= (item: any) => item
        doOptions.onCanSaveAsync ??= () => Promise.resolve(undefined)

        if (doOptions.nav != null && store != null) {
            doOptions.onSaveAsync ??= async () => { //item: any
                if (doOptions.mode == 'new') {
                    return await store().post(doOptions)
                }
                else {
                    return await store().patch(doOptions)
                }
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

                if (err == null)
                    return undefined
            }

            let res: any
            if (doOptions.onSaveAsync != null) {
                res = await doOptions.onSaveAsync!(itemToSave)
                res = res.data
            }

            if (doOptions.onSaveSuccessAsync != null) {
                res = await doOptions.onSaveSuccessAsync(res)
            }

            return res
        }, {
            completionMsg: doOptions.completionMsg ?? options?.completionMsg,
            confirmationMsg: doOptions.confirmationMsg ?? options?.confirmationMsg,
            errorMsg: doOptions.errorMsg ?? options?.errorMsg,
            loadingMsg: doOptions.loadingMsg ?? options?.loadingMsg ?? 'Saving',
            requireConfirmation: doOptions.requireConfirmation ?? options?.requireConfirmation,
            throwError: doOptions.throwError ?? options?.throwError
        })
    }
    
    /**
     * Post to api (no extra '/post' url or anything)
     * @param options 
     */
    function apiPost(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url
        
        return doAction(async () => {
            return await doOptions.api.post(doOptions)
        }, options)
    }

    /**
     * Get from api (no extra '/get' url or anything)
     */
    function apiGet(doOptions: ApiActionOptions) {
        doOptions.nav ??= options?.nav
        doOptions.proxyID ??= options?.proxyID
        doOptions.refresh ??= options?.refresh
        doOptions.throwError ??= options?.throwError
        doOptions.url ??= options?.url

        return doAction(async () => {
            return await doOptions.api.get(doOptions)
        }, options)
    }

    return {
        apiGet,
        apiPost,
        actionLoadingMsg,
        actionErrorMsg,
        clearErrors,
        deleteItem,
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