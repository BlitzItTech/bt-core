import { defineStore, Store, StoreDefinition } from 'pinia'
import { ref, toRaw, type Ref } from 'vue'
import { type ApiError, type PathOptions, type BTApi } from './api.ts'
import { DateTime } from 'luxon'
import { toValue } from 'vue'
import { appendUrl, distinct, getMinDateString, log } from './helpers.ts'
import { firstBy } from 'thenby'
import { useLocalDb } from './forage.ts'
import { BTAuth } from './auth.ts'
import { BTNavigation } from './navigation.ts'
import { BTDemo } from './demo.ts'
import { BTDateFormat, BTDates } from './dates.ts'

export type StoreMode = 'whole-last-updated' | 'partial-last-updated' | 'session'
export type StorageMode = 'session' | 'local-cache'

export interface LocalMeta {
    storedOn: string //days
    isDetailed?: boolean
    lastUpdate?: string
}

export interface LocallyStoredItem {
    meta: LocalMeta,
    data: any,
    count?: number,
    filters?: string[]
}

export interface StoreGetAllReturn<T> {
    data: T[],
    count?: number,
    filters?: string[]
}

export interface StoreGetReturn<T> {
    data: T
}

export interface GetStorageKeyOptions {
    credentials?: any
    itemID?: string
    storeName?: string
    userID?: string
}

export interface StorePathOptions extends PathOptions {
    /**will store this request in session as a special memory in the pinia store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    localOnly?: boolean
    storeKey?: string,
    /**PLU Only */
    dateFrom?: string,
    /**PLU Only */
    dateTo?: string
}

export interface BTBlobStoreDefinition extends StoreDefinition<any, {}, {},
{
    getBlob: (dOptions: StorePathOptions) => Promise<Blob | undefined>
}> {}

export interface BTBlobStore extends Store<any, {}, {}, {
    getBlob: (dOptions: StorePathOptions) => Promise<Blob | undefined>
}> {}

export interface BTStoreDefinition extends StoreDefinition<any, {}, {},
{
    $reset: () => void
    deleteItem: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    get: <T>(dOptions: StorePathOptions) => Promise<StoreGetReturn<T>>
    getAll: <T>(dOptions: StorePathOptions) => Promise<StoreGetAllReturn<T>>
    patch: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    post: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    restore: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
}> {}

export interface BTStore extends Store<any, {}, {}, {
    $reset: () => void
    deleteItem: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    get: <T>(dOptions: StorePathOptions) => Promise<StoreGetReturn<T>>
    getAll: <T>(dOptions: StorePathOptions) => Promise<StoreGetAllReturn<T>>
    patch: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    post: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
    restore: <T>(dOptions: StorePathOptions) => Promise<T | undefined>
}> {}

export interface UseStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    /**build a query.  Overrides the default */
    builderQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    dates: BTDates
    demo?: BTDemo
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**used to select item. Default to x => x.id */
    idSelector?: (item: any) => string
    /**the name of this store found in navigation */
    nav?: string
    /**ideally required.  For determining store mode */
    navigation?: BTNavigation
    /**particularly what store syle to use */
    storeMode?: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode?: StorageMode
    /**the name of this store */
    storeName?: string
}

export interface CreateStoreBuilderOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    /**build a query.  Overrides the default */
    builderQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    dates: BTDates
    demo?: BTDemo
    /**ideally required.  For determining store mode */
    navigation?: BTNavigation
}

export interface CreateStoreOptions {
    /**particularly what store syle to use */
    storeMode?: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode?: StorageMode
    /**the nav item or name of this store */
    nav: string
}

export interface CreateBlobStoreOptions {
    /**whether to store data locally or only for the duration of the session */
    storageMode?: StorageMode
    /**the nav item or name of this store */
    nav: string
}

let currentBuilder: (opt: CreateStoreOptions) => BTStoreDefinition
let currentBlobBuilder: (opt: CreateBlobStoreOptions) => BTBlobStoreDefinition

export function useBlobStore(options: CreateBlobStoreOptions): BTBlobStore {
    return currentBlobBuilder(options)()
}

export function useStore(options: CreateStoreOptions): BTStore {
    return currentBuilder(options)()
}

export function useStoreDefinition(options: CreateStoreOptions): BTStoreDefinition {
    return currentBuilder(options)
}

export function createStoreBuilder(options: CreateStoreBuilderOptions): (opt: CreateStoreOptions) => BTStoreDefinition {
    currentBuilder = (opt: CreateStoreOptions) => {
        return createStoreDefinition({
            ...options,
            ...opt
        })
    }

    return currentBuilder
}

export function createBlobStoreBuilder(options: CreateStoreBuilderOptions): (opt: CreateBlobStoreOptions) => BTBlobStoreDefinition {
    currentBlobBuilder = (opt: CreateBlobStoreOptions) => {
        return createBlobStoreDefinition({
            ...options,
            ...opt
        })
    }

    return currentBlobBuilder
}

/**defaults to options --> navigation --> session/local-cache */
export function createStoreDefinition(options: UseStoreOptions): BTStoreDefinition {
    let navItem = options.navigation?.findItem(options.nav)
    options.storeMode ??= navItem?.storeMode ?? 'session'
    options.storageMode ??= navItem?.storageMode ?? 'local-cache'
    options.storeName ??= options.navigation?.findStoreName(navItem ?? options.nav) ?? options.nav
    options.getStorageKey ??= navItem?.getStorageKey
    
    if (options.demo?.isDemoing.value)
        options.storageMode = 'session'

    // const storeOptions = { ...options, storeName: options.storeName ?? '' }

    if (options.storeName == null)
        throw new Error('no store name provided')

    if (options.storeMode == 'whole-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')
    
        return createWholeLastUpdateStoreDefinition({
            ...options,
            minutesToClear: navItem?.minutesToClear,
            storeName: options.storeName ?? '',
            priority: navItem?.priority ?? 'local'
        })
    }
    else if (options.storeMode == 'partial-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')

        return createPartialLastUpdateStoreDefinition({
            ...options,
            storeName: options.storeName ?? '',
            dateProp: navItem?.pluWindowProp ?? 'lastEditedOn',
            bundlingDays: navItem?.pluDays
        })
    }
    else {
        return createSessionStoreDefinition({
            ...options,
            storeName: options.storeName ?? ''
        })
    }
}

const defaultPathBuilder = (path: PathOptions) => {
    let url: string | undefined = toValue(path.url) ?? undefined

    if (path.additionalUrl != null) {
        if (url == null)
            url = path.additionalUrl
        else
            url = appendUrl(url, path.additionalUrl)
    }
    
    if (path.id != null) {
        if (url?.includes('{id}'))
            url = url.replaceAll('{id}', path.id)
        else
            url = appendUrl(url, path.id)
    }
    
    if (path.params != null) {
        url ??= ''
        let query = new URLSearchParams()
        let entries = Object.entries(path.params).sort(firstBy(x => x[0]))
        entries.forEach(entry => {
            if (entry[1] != null)
                query.append(entry[0], entry[1].toString())
        })

        url = `${url}?${query.toString()}`
    }
    
    path.finalUrl = url

    return path.finalUrl ?? ''
}

interface UseBlobStoreOptions extends UseStoreOptions {
    api?: BTApi
    auth?: BTAuth
    demo?: BTDemo
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**whether to store data locally or only for the duration of the session */
    storageMode?: 'session' | 'local-cache'
    // /**build a query.  Overrides the default */
    // buildQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    /**the name of this store */
    storeName?: string
}

export function createBlobStoreDefinition(options: UseBlobStoreOptions): BTBlobStoreDefinition {
    let navItem = options.navigation?.findItem(options.nav)
    options.storeMode ??= navItem?.storeMode ?? 'session'
    options.storageMode ??= navItem?.storageMode ?? 'local-cache'
    options.storeName ??= `blob-${options.navigation?.findStoreName(navItem ?? options.nav) ?? options.nav}`
    options.getStorageKey ??= navItem?.getStorageKey
    
    if (options.demo?.isDemoing.value)
        options.storageMode = 'session'

    if (options.storeName == null)
        throw new Error('no store name provided')

    return defineStore(options.storeName, () => {
        const blobMemory: Ref<{ [key: string]: Blob | undefined }> = ref({})
        const blobPromiseMemory: Ref<{ [key: string]: Promise<Blob | undefined> }> = ref({})

        const cacheLocally = options.storageMode == 'local-cache'
        const localDb = useLocalDb()
        
        const buildPath = options.buildUrl ?? options.api?.buildUrl ?? defaultPathBuilder
        
        function getKey(dOptions: StorePathOptions) {
            let strKey = 'blob_'

            if (options.demo?.isDemoing.value == true)
                strKey = `${strKey}demo_`

            let getKeyOptions = {
                credentials: options.auth?.credentials.value,
                itemID: dOptions.id ?? dOptions.data?.id,
                userID: options.auth?.credentials.value.userID,
                storeName: options.storeName
            }

            if (dOptions.getStorageKey != null)
                return `${strKey}${dOptions.getStorageKey(getKeyOptions)}`

            if (options.getStorageKey != null)
                return `${strKey}${options.getStorageKey(getKeyOptions)}`

            let paramStr: string = ''
            const params = dOptions.params ?? {}

            if (params != null) {
                paramStr = Object.entries(params)
                    .sort(firstBy(x => x[0]))
                    .map(entry => {
                        return `${entry[0]}=${JSON.stringify(entry[1])}`
                    })
                    .join('&')
            }

            return `${strKey}${options.storeName ?? 'base'}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}_${paramStr ?? 'no-params'}_${dOptions.storeKey ?? 'original-key'}`
        }

        async function getBlob(dOptions: StorePathOptions): Promise<Blob | undefined> {
            dOptions.additionalUrl ??= '/get'
            
            buildPath(dOptions)
            const key = getKey(dOptions)
            const refresh = dOptions.refresh

            if (!refresh && blobMemory.value[key] !== undefined)
                return blobMemory.value[key]

            if (!refresh && cacheLocally == true ) {
                //attempt to get locally
                const localRes = await localDb.getItem<Blob>(key)
                if (localRes != null)
                    return localRes
            }

            //nothing exists in session so far so load from api
            if (options.api == null || dOptions.localOnly) {
                return blobMemory.value[key]
            }

            try {
                let apiPrm = blobPromiseMemory.value[key]

                if (apiPrm == null) {
                    apiPrm = new Promise<Blob | undefined>(async (resolve, reject) => {
                        options.api!.getBlob(dOptions)
                            .then(res => res.blob())
                            .then(blob => {
                                if (cacheLocally == true)
                                    localDb.setItem(key, blob)
                                        .then(v => {
                                            resolve(v)
                                        })
                                else
                                    resolve(blob)
                            })
                            .catch(err => reject(err))
                            .finally(() => {
                                delete blobPromiseMemory.value[key]
                            })
                    })

                    blobPromiseMemory.value[key] = apiPrm
                }

                const apiRes = await apiPrm

                blobMemory.value[key] = apiRes

                return apiRes
            }
            catch (err: any) {
                throw err
            }
        }

        return {
            getBlob
        }
    })
}

interface UseSessionStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    demo?: BTDemo
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**used to select item. Default to x => x.id */
    idSelector?: (item: any) => string
    /**whether to store data locally or only for the duration of the session */
    storageMode?: 'session' | 'local-cache'
    /**build a query.  Overrides the default */
    buildQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    /**the name of this store */
    storeName: string
}

export function createSessionStoreDefinition(options: UseSessionStoreOptions): BTStoreDefinition {
    return defineStore(options.storeName, () => {
        const currentTimeStampDays = DateTime.utc().toSeconds() / 86400
        
        const searchMemory: Ref<{ [key: string]: LocallyStoredItem }> = ref({})
        const promiseMemory: Ref<{ [key: string]: Promise<LocallyStoredItem> }> = ref({})
        
        const cacheLocally = options.storageMode == 'local-cache'
        const localDb = useLocalDb()
        
        const buildPath = options.buildUrl ?? options.api?.buildUrl ?? defaultPathBuilder
        const itemSelector = options.idSelector ?? ((item: any) => item.id)
        
        function getKey(dOptions: StorePathOptions) {
            let strKey = 'ses_'

            if (options.demo?.isDemoing.value == true)
                strKey = `${strKey}demo_`

            let getKeyOptions = {
                credentials: options.auth?.credentials.value,
                itemID: dOptions.id ?? dOptions.data?.id,
                userID: options.auth?.credentials.value.userID,
                storeName: options.storeName
            }

            if (dOptions.getStorageKey != null)
                return `${strKey}${dOptions.getStorageKey(getKeyOptions)}`

            if (options.getStorageKey != null)
                return `${strKey}${options.getStorageKey(getKeyOptions)}`

            let paramStr: string = ''
            const params = dOptions.params ?? {}

            if (params != null) {
                paramStr = Object.entries(params)
                    .sort(firstBy(x => x[0]))
                    .map(entry => {
                        return `${entry[0]}=${JSON.stringify(entry[1])}`
                    })
                    .join('&')
            }

            return `${strKey}${options.storeName ?? 'base'}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}_${paramStr ?? 'no-params'}_${dOptions.storeKey ?? 'original-key'}`
        }

        function $reset() {
            searchMemory.value = {}
            promiseMemory.value = {}
        }

        async function getAll<T>(dOptions: StorePathOptions): Promise<StoreGetAllReturn<T>> {
            dOptions.additionalUrl ??= '/getAll'
            buildPath(dOptions)
            const key = getKey(dOptions)
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key]

            if (!refresh && cacheLocally == true) {
                //attempt to get locally
                const localRes = await localDb.getItem<LocallyStoredItem>(key)

                if (localRes != null && 
                    (options.api == null || parseFloat(localRes.meta.storedOn) > (currentTimeStampDays - 7))) {
                    searchMemory.value[key] = localRes
                    return localRes
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null || dOptions.localOnly) {
                return searchMemory.value[key]
            }

            try {
                let apiPrm = promiseMemory.value[key]

                if (apiPrm == null) {
                    apiPrm = new Promise<LocallyStoredItem>(async (resolve, reject) => {
                        try {
                            const apiRes = await options.api?.getAll<StoreGetAllReturn<T>>(dOptions)
                            const res: LocallyStoredItem = {
                                meta: { storedOn: currentTimeStampDays.toString() },
                                data: apiRes?.data,
                                count: apiRes?.count,
                                filters: apiRes?.filters ?? []
                            }

                            if (cacheLocally == true) {
                                await localDb.setItem(key, res)
                            }
                            
                            resolve(res)
                        }
                        catch (err) {
                            reject(err)
                        }
                        finally {
                            //remove promise
                            delete promiseMemory.value[key]
                        }
                    })

                    promiseMemory.value[key] = apiPrm
                }

                const apiRes = await apiPrm
                
                searchMemory.value[key] = apiRes
                
                return {
                    data: searchMemory.value[key]?.data, //apiRes?.data,
                    filters: apiRes?.filters,
                    count: apiRes?.count
                }
            }
            catch (err: any) {
                throw err
            }
        }

        async function get<T>(dOptions: StorePathOptions): Promise<StoreGetReturn<T>> {
            dOptions.additionalUrl ??= '/get'
            
            buildPath(dOptions)
            const key = getKey(dOptions)
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key]

            if (!refresh && cacheLocally == true ) {
                //attempt to get locally
                const localRes = await localDb.getItem<LocallyStoredItem>(key)

                if (localRes != null && 
                    (options.api == null || parseFloat(localRes.meta?.storedOn ?? '0') > (currentTimeStampDays - 7))) {
                    searchMemory.value[key] = localRes
                    return { data: localRes.data }
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null || dOptions.localOnly) {
                return searchMemory.value[key]
            }

            try {
                let apiPrm = promiseMemory.value[key]

                if (apiPrm == null) {
                    apiPrm = new Promise<LocallyStoredItem>(async (resolve, reject) => {
                        try {
                            let apiRes = await options.api?.get<StoreGetReturn<T>>(dOptions)
                            
                            const res: LocallyStoredItem = {
                                meta: { storedOn: currentTimeStampDays.toString() },
                                data: apiRes?.data
                            }

                            if (cacheLocally == true) {
                                await localDb.setItem(key, res)
                            }
                            
                            resolve(res)
                        }
                        catch (err) {
                            reject(err)
                        }
                        finally {
                            //remove promise
                            delete promiseMemory.value[key]
                        }
                    })

                    promiseMemory.value[key] = apiPrm
                }

                const apiRes = await apiPrm

                searchMemory.value[key] = apiRes

                return { data: searchMemory.value[key]?.data }
            }
            catch (err: any) {
                throw err
            }
        }

        /**Also updates other items in other lists with same id in session.  But not in local cache*/
        async function patch<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'
            
            buildPath(dOptions)
            const key = getKey(dOptions)

            let patchedObject: T | undefined

            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    patchedObject = apiRes?.data
                }
                catch (err: any) {
                    throw err
                }
            }
            else {
                patchedObject = dOptions.data
            }

            //update local versions
            if (patchedObject != null) {
                //update keyed search memory
                let existingItem: LocallyStoredItem = {
                    meta: { storedOn: currentTimeStampDays.toString() },
                    data: { ...searchMemory.value[key]?.data, ...patchedObject }
                }

                searchMemory.value[key] = existingItem
                
                log('memory')
                log(searchMemory.value[key]?.data)
                log(patchedObject)
                log(dOptions.data)
                //override local cache
                if (cacheLocally == true)
                    await localDb.setItem(key, toRaw(existingItem))

                // if (patchedObject.id != null && patchedObject.rowVersion != null) {
                    //update other session stored items
                let memoryItems = Object.entries(searchMemory.value)
                memoryItems.forEach(entry => {
                    const entryVal = entry[1].data
                    if (entryVal != null) {
                        if (Array.isArray(entryVal)) {
                            for (let i = 0; i < entryVal.length; i++) {
                                const listItem = entryVal[i];
                                if (itemSelector(listItem) == itemSelector(patchedObject))
                                    entryVal.splice(i, 1, { ...listItem, ...existingItem.data })
                            }
                        }
                        else {
                            if (itemSelector(entryVal) == itemSelector(patchedObject))
                                searchMemory.value[entry[0]] = { ...entryVal, ...existingItem }
                        }
                    }
                })
                // }

                return existingItem.data
            }

            return patchedObject
        }

        async function post<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            
            buildPath(dOptions)
            let postedObject: any

            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.post<StoreGetReturn<T>>(dOptions)
                    postedObject = apiRes?.data
                }
                catch (err: any) {
                    throw err
                }
            }
            else {
                postedObject = dOptions.data
            }

            if (postedObject != null) {
                let existingItem: LocallyStoredItem = {
                    meta: { storedOn: currentTimeStampDays.toString() },
                    data: postedObject
                }
                
                if (postedObject != null)
                    dOptions.id ??= postedObject.id
                
                const key = getKey(dOptions)

                if (cacheLocally == true)
                    await localDb.setItem(key, toRaw(existingItem))

                searchMemory.value[key] = existingItem

                return searchMemory.value[key]?.data
            }

            return postedObject
        }

        async function deleteItem<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/delete'

            buildPath(dOptions)
            const key = getKey(dOptions)

            let deletedObject: T | undefined

            //delete api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                     var apiRes = await options.api.deleteItem<StoreGetReturn<T>>(dOptions)
                     deletedObject = apiRes?.data
                    //  if (res != null)
                    //     return res
                }
                catch (err: any) {
                    throw err
                }
            }
            else {
                deletedObject = dOptions.data
            }

            //delete local memory
            delete searchMemory.value[key]

            //delete any other versions in other saved requests
            const id = dOptions.data?.id ?? dOptions.id
            const cachedKeysToFind: string[] = []

            if (id != null) {
                //update other session stored items
                let memoryItems = Object.entries(searchMemory.value)
                memoryItems.forEach(entry => {
                    const entryVal = entry[1].data
                    if (entryVal != null) {
                        if (Array.isArray(entryVal)) {
                            for (let i = 0; i < entryVal.length; i++) {
                                const listItem = entryVal[i];
                                if (itemSelector(listItem) == id) {
                                    cachedKeysToFind.push(entry[0])
                                    entryVal.splice(i, 1)
                                }
                            }
                        }
                        else {
                            delete searchMemory.value[entry[0]]
                        }
                    }
                })
            }
            
            if (cacheLocally == true) {
                // const localDb = useLocalDb()
                await localDb.removeItem(key)

                //remove from local caches
                if (id != null) {
                    for (let i = 0; i < cachedKeysToFind.length; i++) {
                        const cacheKey = cachedKeysToFind[i];
                        const cache = await localDb.getItem<LocallyStoredItem>(cacheKey)
                        if (cache != null) {
                            if (Array.isArray(cache.data)) {
                                const ind = cache.data.findIndex((z: any) => itemSelector(z) == id)
                                if (ind >= 0) {
                                    cache.data.splice(ind, 1)
                                    await localDb.setItem(cacheKey, cache)
                                }
                            }
                            else {
                                if (itemSelector(cache.data) == id)
                                    await localDb.removeItem(cacheKey)
                            }
                        }
                    }
                }
            }

            // return undefined
            return deletedObject
        }

        async function restore<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= `/restore?id=${dOptions.data.id}`
            
            buildPath(dOptions)

            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    return apiRes?.data
                }
                catch (err: any) {
                    throw err
                }
            }

            return undefined
        }

        return {
            $reset,
            deleteItem,
            get,
            getAll,
            patch,
            post,
            restore,
            searchMemory, //mainly for testing
            currentTimeStampDays,
            promiseMemory,
            cacheLocally
        }
    })
}

interface UseWholeLastUpdateStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    dates: BTDates
    demo?: BTDemo
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**how many minutes until store clears all data. Undefined means it won't happen */
    minutesToClear?: number
    /**used to select item. Default to x => x.id */
    idSelector?: (item: any) => string
    /**whether to search for list locally or server first */
    priority?: 'server' | 'local'
    storageMode?: 'session' | 'local-cache'
    storeName: string
}

export function createWholeLastUpdateStoreDefinition(options: UseWholeLastUpdateStoreOptions): BTStoreDefinition {
    return defineStore(options.storeName, () => {
        const dataItems: Ref<any[] | undefined> = ref()
        const count = ref(0)
        const currentTimeStampHours = DateTime.utc().toSeconds() / 3600

        const cacheLocally = options.storageMode == 'local-cache'
        const itemSelector = options.idSelector ?? ((item: any) => item.id)
        const meta: Ref<LocalMeta> = ref({ storedOn: currentTimeStampHours.toString() })
        const promiseMemory: Ref<any> = ref({})
        
        function $reset() {
            dataItems.value = undefined
            count.value = 0
            promiseMemory.value = {}
        }

        function getKey() {
            let strKey = 'wlu_'

            if (options.demo?.isDemoing.value == true)
                strKey = `${strKey}demo_`
            
            let getKeyOptions = {
                credentials: options.auth?.credentials.value,
                userID: options.auth?.credentials.value.userID,
                storeName: options.storeName
            }

            if (options.getStorageKey != null)
                return `${strKey}${options.getStorageKey(getKeyOptions)}`

            return `${strKey}${options.storeName}_${options.auth?.credentials.value.userID ?? 'no-user-id'}`
        }

        async function trySaveToLocalCache() {
            if (cacheLocally == true) {
                const toSave: LocallyStoredItem = {
                    meta: toValue(meta),
                    data: toValue(dataItems) ?? [],
                    count: toValue(count) ?? 0,
                    filters: []
                }
                
                //save locally
                try {
                    await useLocalDb().setItem(getKey(), JSON.parse(JSON.stringify(toSave)))
                }
                catch (err) {
                    console.log('sav err')
                    console.log(err)
                }
            }
        }

        function createRefreshPromise<T>(dOptions: StorePathOptions): Promise<StoreGetAllReturn<T>> {
            const key = getKey()

            if (promiseMemory.value[key])
                return promiseMemory.value[key]

            promiseMemory.value[key] = new Promise<StoreGetAllReturn<T>>(async (resolve, reject) => {
                try {
                    const params = {
                        lastUpdate: meta.value.lastUpdate ?? getMinDateString()
                    }

                    let res = await options.api?.getAll<StoreGetAllReturn<T>>({
                        additionalUrl: '/getAll',
                        nav: dOptions.nav,
                        params
                    })

                    if (res == null) {
                        reject(res)
                    }
                    else {
                        //update
                        dataItems.value ??= []
                        res.data.forEach(serverItem => {
                            const existingInd = dataItems.value!.findIndex(x => itemSelector(x) == itemSelector(serverItem))
                            if (existingInd >= 0)
                                dataItems.value?.splice(existingInd, 1, serverItem)
                            else
                                dataItems.value?.push(serverItem)
                        })

                        count.value = dataItems.value.length
                        meta.value = {
                            lastUpdate: options.dates?.utcString() ?? DateTime.utc().toString(),
                            storedOn: currentTimeStampHours.toString()
                        }

                        await trySaveToLocalCache()

                        resolve(res)
                    }
                }
                catch (err) {
                    reject(err)
                }
                finally {
                    //remove promise
                    delete promiseMemory.value[key]
                }
            })

            return promiseMemory.value[key]
        }

        async function tryClearData() {
            if (options.minutesToClear == null ||
                meta.value == null ||
                meta.value.storedOn == null)
                return

            var minsNow = (DateTime.utc().toSeconds() / 60)
            var minsStoredOn = parseFloat(meta.value.storedOn) * 60

            if (minsNow > (minsStoredOn + options.minutesToClear)) {
                //load everything and then clear everything
                console.log(`clearing and reloading ${options.storeName}`)
                const key = getKey()
                await useLocalDb().removeItem(key);
                dataItems.value = undefined
                count.value = 0
                meta.value = {
                    lastUpdate: getMinDateString(),
                    storedOn: currentTimeStampHours.toString()
                }
            }
        }

        async function getAll<T>(dOptions: StorePathOptions): Promise<StoreGetAllReturn<T>> {
            const key = getKey()
            const refresh = dOptions.refresh
            
            await tryClearData()
            
            if (!refresh && dataItems.value != null) {
                return {
                    count: dataItems.value?.length,
                    data: dataItems.value,
                    filters: []
                }
            }

            if (!refresh && (options.priority != 'server' && cacheLocally == true)) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)
                
                if (localRes != null && parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 7)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    meta.value = localRes.meta
                    
                    return {
                        count: dataItems.value?.length,
                        data: dataItems.value ?? [],
                        filters: []
                    }
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null || dOptions.localOnly) {
                return {
                    count: dataItems.value?.length,
                    data: dataItems.value ?? [],
                    filters: [] //filters.value
                }
            }
            else {
                dataItems.value ??= []
            }

            try {
                await createRefreshPromise<T>(dOptions)

                return {
                    count: dataItems.value?.length,
                    data: dataItems.value ?? [],
                    filters: [] //filters.value
                }
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function get<T>(dOptions: StorePathOptions): Promise<StoreGetReturn<T>> {
            const key = getKey()
            const id = dOptions.id ?? dOptions.data?.id

            if (id == null)
                throw new Error('no id provided')

            let refresh = dOptions.refresh

            if (!refresh && dataItems.value != null) {
                const item = dataItems.value.find(x => itemSelector(x) == id)
                if (item != null)
                    return { data: item }
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)

                if (localRes != null && parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 12)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    // filters.value = localRes.filters ?? []
                    meta.value = localRes.meta
                    
                    let existingItem = dataItems.value?.find(x => itemSelector(x) == id)
                    
                    if (existingItem != null)
                        return { data: existingItem }
                }
            }

            if (options.api == null || dOptions.localOnly) {
                return {
                    data: dataItems.value?.find(x => itemSelector(x) == id)
                }
            }
            else {
                dataItems.value ??= []
            }

            try {
                await createRefreshPromise<T>(dOptions)

                return { data: dataItems.value?.find(x => itemSelector(x) == id) }
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function patch<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'

            let patchedObject: T

            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    patchedObject = { ...dOptions.data, ...apiRes?.data }
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                patchedObject = dOptions.data
            }

            if (patchedObject != null) {
                let existingInd = dataItems.value?.findIndex(x => itemSelector(x) == itemSelector(patchedObject))
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1, patchedObject)
                    await trySaveToLocalCache()
                }
            }

            const id = itemSelector(patchedObject) ?? dOptions.id ?? itemSelector(dOptions.data)

            return dataItems.value?.find(x => itemSelector(x) == id)
        }

        async function post<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            
            let postedObject: any

            //post api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.post<StoreGetReturn<T>>(dOptions)
                    postedObject = apiRes?.data
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                postedObject = dOptions.data
            }

            if (postedObject != null) {
                dataItems.value ??= []
                dataItems.value?.unshift(postedObject)
                count.value += 1
                await trySaveToLocalCache()
            }

            const id = itemSelector(postedObject) ?? dOptions.id ?? itemSelector(dOptions.data)

            return dataItems.value?.find(x => itemSelector(x) == id)
        }

        async function deleteItem<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/delete'

            let deletedObject: T | undefined

            //delete api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.deleteItem<StoreGetReturn<T>>(dOptions)
                    deletedObject = { ...dOptions.data, ...apiRes?.data }
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                deletedObject = dOptions.data
            }

            const id = dOptions.id ?? itemSelector(dOptions.data)
            if (id != null) {
                let existingInd = dataItems.value?.findIndex(x => itemSelector(x) == id)
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1)
                    await trySaveToLocalCache()
                }
            }

            return deletedObject
        }

        async function restore<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            const id = dOptions.id ?? itemSelector(dOptions.data)

            dOptions.additionalUrl ??= `/restore?id=${id}`
            
            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    await options.api.patch<StoreGetReturn<T>>(dOptions)
                    // let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    // return apiRes?.data
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }

            //refresh
            try {
                dOptions.additionalUrl = '/getAll'
                await createRefreshPromise<T>(dOptions)
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }

            return dataItems.value?.find(x => x.id == id)
        }

        return {
            $reset,
            deleteItem,
            get,
            getAll,
            patch,
            post,
            restore,
            //other stuff
            dataItems,
            count,
            currentTimeStampHours,
            // filters,
            meta,
            promiseMemory,
            cacheLocally
        }
    })
}


interface UsePartialLastUpdateStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    bundlingDays?: number
    dates: BTDates
    /**PLU ONLY - the prop to compare date from and date to window */
    dateProp?: string
    demo?: BTDemo
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**used to select item. Default to x => x.id */
    idSelector?: (item: any) => string
    storageMode?: 'session' | 'local-cache'
    storeName: string
}

export interface PLULocalMeta {
    storedOn: string //days
    lastUpdate: string
    dateFrom?: string
    dateTo?: string
}

export interface LocallyStoredPLUItem {
    // meta: PLULocalMeta,
    data: any
}

export interface DateWindow {
    dateFrom: string
    dateTo: string
}

export interface WindowAdjustment {
    left?: DateWindow
    reset: boolean
    right?: DateWindow
}

export interface WindowAdjustments {
    left?: DateWindow[]
    reset: boolean
    right?: DateWindow[]
}

export function createPartialLastUpdateStoreDefinition(options: UsePartialLastUpdateStoreOptions): BTStoreDefinition {
    return defineStore(options.storeName, () => {
        const dataItems: Ref<any[] | undefined> = ref()
        const count = ref(0)
        const currentTimeStampHours = DateTime.utc().toSeconds() / 3600
        
        const cacheLocally = options.storageMode == 'local-cache'
        const itemSelector = options.idSelector ?? ((item: any) => item.id)
        const dateProp = options.dateProp ?? 'lastEditedOn'
        const meta: Ref<PLULocalMeta> = ref({ 
            lastUpdate: getMinDateString(),
            storedOn: currentTimeStampHours.toString()
        })
        const isMetaLoaded = ref(false)
        const promiseMemory: Ref<any> = ref({})
        
        function $reset() {
            dataItems.value = undefined
            count.value = 0
            promiseMemory.value = {}
        }

        function getKey() {
            let strKey = 'plu'

            if (options.demo?.isDemoing.value == true)
                strKey = `${strKey}_demo`
            
            let getKeyOptions = {
                credentials: options.auth?.credentials.value,
                userID: options.auth?.credentials.value.userID,
                storeName: options.storeName
            }

            // if (windowDirection != null)
            //     strKey = `${strKey}_${windowDirection}`

            if (options.getStorageKey != null)
                return `${strKey}_${options.getStorageKey(getKeyOptions)}`

            return `${options.storeName}_${strKey}_${options.auth?.credentials.value.userID ?? 'no-user-id'}`
        }

        async function trySaveToLocalCache() {
            if (cacheLocally == true) {
                const toSave: LocallyStoredPLUItem = { data: toValue(dataItems) ?? [] }
                const metaToSave: PLULocalMeta = toValue(meta)
                
                //save locally
                try {
                    const db = useLocalDb()
                    db.setItem(getKey(), JSON.parse(JSON.stringify(toSave)))
                    db.setItem(`${getKey()}_meta`, JSON.parse(JSON.stringify(metaToSave)))
                }
                catch (err) {
                    console.log('sav err')
                    console.log(err)
                }
            }
        }

        async function tryLoadMeta() {
            if (cacheLocally && !isMetaLoaded.value) {
                try {
                    meta.value = (await useLocalDb().getItem<PLULocalMeta>(`${getKey()}_meta`)) ?? { 
                        lastUpdate: getMinDateString(),
                        storedOn: currentTimeStampHours.toString()
                    }
                    isMetaLoaded.value = true
                }
                catch (err) {
                    console.log('meta save err')
                }
            }
        }

        function getWindowAdjustments(dOptions: StorePathOptions): WindowAdjustment {
            if (meta.value.dateFrom == null || meta.value.dateTo == null) {
                //first time
                return {
                    left: {
                        dateFrom: dOptions.dateFrom ?? getMinDateString(),
                        dateTo: dOptions.dateTo ?? options.dates?.utcString() ?? DateTime.utc().toString()
                    },
                    reset: true,
                    right: undefined
                }
            }

            //meta exists
            var adj: WindowAdjustment = {
                reset: false
            }

            if (dOptions.dateFrom != null && dOptions.dateFrom < meta.value.dateFrom) {
                //expand to left
                adj.left = {
                    dateFrom: dOptions.dateFrom,
                    dateTo: meta.value.dateTo
                }
            }

            if (dOptions.dateTo != null && dOptions.dateTo > meta.value.dateTo) {
                adj.right = {
                    dateFrom: meta.value.dateTo,
                    dateTo: dOptions.dateTo
                }
            }

            return adj
        }

        function getBundledWindowAdjustments(adj: WindowAdjustment): WindowAdjustments {
            if (options.bundlingDays == null) {
                return {
                    left: adj.left != null ? [adj.left] : [],
                    reset: adj.reset,
                    right: adj.right != null ? [adj.right] : []
                }
            }

            let adjustments: WindowAdjustments = {
                reset: adj.reset
            }

            if (adj.left != null) {
                //bundle left
                adjustments.left = []
                let leftFrom = options.dates.btDate(adj.left.dateFrom)
                let leftTo = options.dates.btDate(adj.left.dateTo)

                while (leftTo.diff(leftFrom).as('days') > options.bundlingDays) {
                    adjustments.left.push({
                        dateFrom: leftFrom.toFormat(BTDateFormat),
                        dateTo: leftFrom.plus({ days: options.bundlingDays }).toFormat(BTDateFormat)
                    })

                    leftFrom = leftFrom.plus({ days: options.bundlingDays })
                }

                adjustments.left.push({
                    dateFrom: leftFrom.toFormat(BTDateFormat),
                    dateTo: leftTo.toFormat(BTDateFormat)
                })
            }

            if (adj.right != null) {
                //bundle right
                adjustments.right = []
                let leftFrom = options.dates.btDate(adj.right.dateFrom)
                let leftTo = options.dates.btDate(adj.right.dateTo)

                while (leftTo.diff(leftFrom).as('days') > options.bundlingDays) {
                    adjustments.right.push({
                        dateFrom: leftFrom.toFormat(BTDateFormat),
                        dateTo: leftFrom.plus({ days: options.bundlingDays }).toFormat(BTDateFormat)
                    })

                    leftFrom = leftFrom.plus({ days: options.bundlingDays })
                }

                adjustments.right.push({
                    dateFrom: leftFrom.toFormat(BTDateFormat),
                    dateTo: leftTo.toFormat(BTDateFormat)
                })
            }

            return adjustments
        }

        function createRefreshPromise<T>(dOptions: StorePathOptions): Promise<StoreGetAllReturn<T>> {
            const promiseKey = getKey()

            if (promiseMemory.value[promiseKey])
                return promiseMemory.value[promiseKey]

            promiseMemory.value[promiseKey] = new Promise<StoreGetAllReturn<T>>(async (resolve, reject) => {
                try {
                    //first try expand window left
                    let windows = getWindowAdjustments(dOptions)
                    let bundledWindow = getBundledWindowAdjustments(windows)
                    let lastUpdate = options.dates.utcString() ?? DateTime.utc().toString()

                    let leftItems: T[] = []
                    if (bundledWindow.left != null) {
                        for (let i = 0; i < bundledWindow.left.length; i++) {
                            let currentLeft = bundledWindow.left[i]

                            let leftRes = await options.api?.getAll<StoreGetAllReturn<T>>({
                                additionalUrl: '/getAll',
                                nav: dOptions.nav,
                                params: {
                                    dateFrom: currentLeft.dateFrom,
                                    dateTo: currentLeft.dateTo
                                }
                            })
                            
                            if (leftRes == null) {
                                reject(leftRes)
                                return
                            }

                            if (leftRes.data != null)
                                leftItems.push(...leftRes.data)
                        }
                    }

                    let rightItems: T[] = []
                    if (bundledWindow.right != null) {
                        for (let i = 0; i < bundledWindow.right.length; i++) {
                            let currentRight = bundledWindow.right[i]

                            let rightRes = await options.api?.getAll<StoreGetAllReturn<T>>({
                                additionalUrl: '/getAll',
                                nav: dOptions.nav,
                                params: {
                                    dateFrom: currentRight.dateFrom,
                                    dateTo: currentRight.dateTo
                                }
                            })

                            if (rightRes == null) {
                                reject(rightRes)
                                return
                            }

                            if (rightRes.data != null)
                                rightItems.push(...rightRes.data)
                        }
                    }

                    let updatedItems: T[] = []
                    if (meta.value.dateFrom != null && meta.value.dateTo != null) {
                        //update existing window
                        let res = await options.api?.getAll<StoreGetAllReturn<T>>({
                            additionalUrl: '/getAll',
                            nav: dOptions.nav,
                            params: {
                                dateFrom: meta.value.dateFrom,
                                dateTo: meta.value.dateTo,
                                lastUpdate: meta.value.lastUpdate ?? getMinDateString()
                            }
                        })

                        if (res == null) {
                            reject(res)
                            return
                        }

                        updatedItems = res?.data ?? []
                    }
                    
                    //all apis have been called. Now to process the data
                    dataItems.value ??= []

                    if (windows.reset) {
                        dataItems.value = []
                        count.value = 0
                    }
                    
                    dataItems.value.unshift(...leftItems)
                    
                    dataItems.value.push(...rightItems)

                    updatedItems.forEach(serverItem => {
                        const existingInd = dataItems.value!.findIndex(x => itemSelector(x) == itemSelector(serverItem))
                        if (existingInd >= 0)
                            dataItems.value?.splice(existingInd, 1, serverItem)
                        else
                            dataItems.value?.push(serverItem)
                    })

                    dataItems.value = distinct(dataItems.value, itemSelector)

                    count.value = dataItems.value.length

                    meta.value.lastUpdate = lastUpdate
                    meta.value.storedOn = currentTimeStampHours.toString()

                    meta.value.dateFrom = windows.left?.dateFrom ?? meta.value.dateFrom
                    meta.value.dateTo = windows.right?.dateTo ?? meta.value.dateTo ?? windows.left?.dateTo

                    await trySaveToLocalCache()

                    resolve({
                        count: count.value,
                        data: dataItems.value
                    })
                }
                catch (err) {
                    reject(err)
                }
                finally {
                    //remove promise
                    delete promiseMemory.value[promiseKey]
                }
            })

            return promiseMemory.value[promiseKey]
        }

        function getFilteredResult(dOptions: StorePathOptions) {
            let dateFrom = dOptions.dateFrom ?? meta.value.dateFrom
            let dateTo = dOptions.dateTo ?? meta.value.dateTo
            let dataList = dataItems.value ?? []

            if (dOptions.dateFrom == null && dOptions.dateTo == null)
                return {
                    count: dataList.length,
                    data: dataList,
                    filters: []
                }

            let filteredList = dataList.filter(x => x[dateProp] >= dateFrom! && x[dateProp] < dateTo!)

            return {
                count: filteredList.length,
                data: filteredList,
                filters: []
            }
        }

        async function getAll<T>(dOptions: StorePathOptions): Promise<StoreGetAllReturn<T>> {
            const key = getKey()
            let refresh = dOptions.refresh

            await tryLoadMeta()

            if (meta.value.dateFrom == null || meta.value.dateTo == null || (dOptions.dateFrom != null && dOptions.dateFrom < meta.value.dateFrom) || (dOptions.dateTo != null && dOptions.dateTo > meta.value.dateTo)) {
                //refresh required
                refresh = true
            }
            
            if (!refresh && dataItems.value != null) {
                return getFilteredResult(dOptions)
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredPLUItem>(key)
                if (localRes != null) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    
                    return getFilteredResult(dOptions)
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null || dOptions.localOnly) {
                return getFilteredResult(dOptions)
            }
            else {
                dataItems.value ??= []
            }

            try {
                await createRefreshPromise<T>(dOptions)

                return getFilteredResult(dOptions)
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function get<T>(dOptions: StorePathOptions): Promise<StoreGetReturn<T>> {
            const key = getKey()
            const id = dOptions.id ?? dOptions.data?.id

            if (id == null)
                throw new Error('no id provided')

            let refresh = dOptions.refresh

            if (!refresh && dataItems.value != null) {
                const item = dataItems.value.find(x => itemSelector(x) == id)
                if (item != null)
                    return { data: item }
            }

            await tryLoadMeta()
            
            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredPLUItem>(key)

                // if (localRes != null && parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 12)) {
                if (localRes != null) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    // meta.value = localRes.meta
                    
                    let existingItem = dataItems.value?.find(x => itemSelector(x) == id)
                    
                    if (existingItem != null)
                        return { data: existingItem }
                }
            }

            if (options.api == null || dOptions.localOnly) {
                return {
                    data: dataItems.value?.find(x => itemSelector(x) == id)
                }
            }
            else {
                dataItems.value ??= []
            }

            try {
                await createRefreshPromise<T>(dOptions)

                return { data: dataItems.value?.find(x => itemSelector(x) == id) }
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function patch<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'

            let patchedObject: T

            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                
                try {
                    let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    patchedObject = { ...dOptions.data, ...apiRes?.data }
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                patchedObject = dOptions.data
            }

            if (patchedObject != null) {
                let existingInd = dataItems.value?.findIndex(x => itemSelector(x) == itemSelector(patchedObject))
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1, patchedObject)
                    await trySaveToLocalCache()
                }
            }

            const id = itemSelector(patchedObject) ?? dOptions.id ?? itemSelector(dOptions.data)

            return dataItems.value?.find(x => itemSelector(x) == id)
        }

        async function post<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            
            let postedObject: any

            //post api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.post<StoreGetReturn<T>>(dOptions)
                    postedObject = apiRes?.data
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                postedObject = dOptions.data
            }

            if (postedObject != null) {
                dataItems.value ??= []
                dataItems.value?.unshift(postedObject)
                count.value += 1
                await trySaveToLocalCache()
            }

            const id = itemSelector(postedObject) ?? dOptions.id ?? itemSelector(dOptions.data)

            return dataItems.value?.find(x => itemSelector(x) == id)
        }

        async function deleteItem<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/delete'

            let deletedObject: T | undefined

            //delete api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.deleteItem<StoreGetReturn<T>>(dOptions)
                    deletedObject = { ...dOptions.data, ...apiRes?.data }
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                deletedObject = dOptions.data
            }

            const id = dOptions.id ?? itemSelector(dOptions.data)
            if (id != null) {
                let existingInd = dataItems.value?.findIndex(x => itemSelector(x) == id)
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1)
                    await trySaveToLocalCache()
                }
            }

            return deletedObject
        }

        async function restore<T>(dOptions: StorePathOptions): Promise<T | undefined> {
            const id = dOptions.id ?? itemSelector(dOptions.data)

            dOptions.additionalUrl ??= `/restore?id=${id}`
            
            //patch api
            if (options.api != null && dOptions.localOnly !== true) {
                //do not bother saving the promise
                try {
                    await options.api.patch<StoreGetReturn<T>>(dOptions)
                    // let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    // return apiRes?.data
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }

            //refresh
            try {
                dOptions.additionalUrl = '/getAll'
                await createRefreshPromise<T>(dOptions)
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }

            return dataItems.value?.find(x => x.id == id)
        }

        return {
            $reset,
            deleteItem,
            get,
            getAll,
            patch,
            post,
            restore,
            //other stuff
            dataItems,
            count,
            currentTimeStampHours,
            // filters,
            meta,
            promiseMemory,
            cacheLocally
        }
    })
}