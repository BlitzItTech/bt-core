import { defineStore, Store, StoreDefinition } from 'pinia'
import { ref, type Ref } from 'vue'
import { type ApiError, type PathOptions, type BTApi } from './api.ts'
import { DateTime } from 'luxon'
import { toValue } from 'vue'
import { appendUrl, getMinDateString } from './helpers.ts'
import { firstBy } from 'thenby'
import { useLocalDb } from './forage.ts'
import { BaseModel } from '../types.ts'
import { BTAuth } from './auth.ts'
import { BTNavigation } from './navigation.ts'

export type StoreMode = 'whole-last-updated' | 'partial-last-updated' | 'session'
export type StorageMode = 'session' | 'local-cache'

export interface LocalMeta {
    storedOn: string //days
    isDetailed?: boolean
    earliestData?: string
    lastUpdate?: string
}

export interface LocallyStoredItem {
    meta: LocalMeta,
    data: any,
    count?: number,
    filters?: string[]
}

// export interface SearchMemoryItem {
//     meta: LocalMeta,
//     data: any,
//     count?: number,
//     filters?: string[]
// }

export interface StoreGetAllReturn<T> {
    data: T[],
    count?: number,
    filters?: string[]
}

export interface StoreGetReturn<T> {
    data: T
}

export interface BTStoreDefinition extends StoreDefinition<any, {}, {},
{
    deleteItem: (dOptions: PathOptions) => Promise<string | undefined>
    get: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetReturn<T>>
    getAll: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetAllReturn<T>>
    patch: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    post: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    restore: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
}> {}

export interface BTStore extends Store<any, {}, {}, {
    deleteItem: (dOptions: PathOptions) => Promise<string | undefined>
    get: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetReturn<T>>
    getAll: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetAllReturn<T>>
    patch: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    post: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    restore: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
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

let currentBuilder: (opt: CreateStoreOptions) => BTStoreDefinition

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

/**defaults to options --> navigation --> session/local-cache */
export function createStoreDefinition(options: UseStoreOptions): BTStoreDefinition {
    options.storeMode ??= options.navigation?.findItem(options.nav)?.storeMode ?? 'session'
    options.storageMode ??= options.navigation?.findItem(options.nav)?.storageMode ?? 'local-cache'
    options.storeName ??= options.navigation?.findStoreName(options.nav) ?? options.nav

    if (options.storeName == null)
        throw new Error('no store name provided')

    if (options.storeMode == 'whole-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')

        return createWholeLastUpdateStoreDefinition({ ...options, storeName: options.storeName ?? '' })
    }
    else if (options.storeMode == 'partial-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')

        return createWholeLastUpdateStoreDefinition({ ...options, storeName: options.storeName ?? '' })
    }
    else { //if (options.storeMode == 'session') {
        return createSessionStoreDefinition({ ...options, storeName: options.storeName ?? '' })
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

interface UseSessionStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
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
        // const searchMemory: SearchMemoryItem[] = []
        // const searchMemory: Ref<any> = ref({})
        const searchMemory: Ref<{ [key: string]: LocallyStoredItem }> = ref({})
        const promiseMemory: Ref<{ [key: string]: Promise<LocallyStoredItem> }> = ref({})
        // const promiseMemory: Ref<{ [key: string]: Promise<StoreGetAllReturn<any>> }> = ref({})
        // const promiseMemory: Ref<any> = ref({})
        const cacheLocally = options.storageMode == 'local-cache'
        
        const buildPath = options.buildUrl ?? options.api?.buildUrl ?? defaultPathBuilder
        // const authData = useAuthData()
        
        function getKey(dOptions: PathOptions) {
            //return `${options.storeName ?? 'base'}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}`
            // return `${options.storeName ?? 'base'}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}_${dOptions.finalUrl}`
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

            return `${options.storeName ?? 'base'}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}_${paramStr ?? 'no-params'}`
        }

        async function getAll<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetAllReturn<T>> {
            dOptions.additionalUrl ??= '/getAll'
            
            buildPath(dOptions)
            const key = getKey(dOptions) // `${options.storeName}_${options.auth?.credentials.value.userID ?? 'no-user-id'}_${path}`
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key]

            if (!refresh && cacheLocally == true) {
                //attempt to get locally
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)

                if (localRes != null && 
                    (options.api == null || parseFloat(localRes.meta.storedOn) > (currentTimeStampDays - 7))) {
                    searchMemory.value[key] = localRes
                    return localRes
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null) {
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
                                await useLocalDb().setItem(key, res)
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
                    data: apiRes?.data,
                    filters: apiRes?.filters,
                    count: apiRes?.count
                }
            }
            catch (err: any) {
                throw err
            }
        }

        async function get<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetReturn<T>> {
            dOptions.additionalUrl ??= '/get'
            
            buildPath(dOptions)
            const key = getKey(dOptions)
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key]

            if (!refresh && cacheLocally == true ) {
                //attempt to get locally
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)

                if (localRes != null && 
                    (options.api == null || parseFloat(localRes.meta.storedOn) > (currentTimeStampDays - 7))) {
                    searchMemory.value[key] = localRes
                    return { data: localRes.data }
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null) {
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
                                await useLocalDb().setItem(key, res)
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

                return { data: apiRes.data }
            }
            catch (err: any) {
                throw err
            }
        }

        async function patch<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'
            
            buildPath(dOptions)
            const key = getKey(dOptions)
            let patchedObject: any

            //patch api
            if (options.api != null) {
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
                let existingItem = {
                    meta: { storedOn: currentTimeStampDays.toString() },
                    data: { ...searchMemory.value[key]?.data, ...patchedObject }
                }

                searchMemory.value[key] = existingItem
                
                //override local cache
                if (cacheLocally == true) {
                    await useLocalDb().setItem(key, existingItem)
                }

                if (patchedObject.id != null && patchedObject.rowVersion != null) {
                    //update other session stored items
                    let memoryItems = Object.entries(searchMemory.value)
                    memoryItems.forEach(entry => {
                        const entryVal = entry[1].data
                        if (entryVal != null) {
                            if (Array.isArray(entryVal)) {
                                for (let i = 0; i < entryVal.length; i++) {
                                    const listItem = entryVal[i];
                                    if (listItem.id == patchedObject.id) {
                                        entryVal.splice(i, 1, existingItem.data)
                                    }
                                }
                            }
                            else {
                                if (entryVal.id == patchedObject.id) {
                                    searchMemory.value[entry[0]] = existingItem
                                }
                            }
                        }
                    })
                }

                return existingItem.data
            }

            return patchedObject
        }

        async function post<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            
            buildPath(dOptions)
            const key = getKey(dOptions)
            let postedObject: any

            //patch api
            if (options.api != null) {
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
                let existingItem = {
                    meta: { storedOn: currentTimeStampDays.toString() },
                    data: postedObject
                }

                if (cacheLocally == true)
                    await useLocalDb().setItem(key, existingItem)

                searchMemory.value[key] = existingItem

                return existingItem.data
            }

            return postedObject
        }

        async function deleteItem(dOptions: PathOptions): Promise<string | undefined> {
            dOptions.additionalUrl ??= '/delete'

            buildPath(dOptions)
            const key = getKey(dOptions)

            //delete api
            if (options.api != null) {
                //do not bother saving the promise
                try {
                     let res = await options.api.deleteItem(dOptions)
                     if (res != null)
                        return res
                }
                catch (err: any) {
                    throw err
                }
            }

            //delete local memory
            delete searchMemory.value[key]

            //delete any other versions in other saved requests
            const id = dOptions.data?.id ?? dOptions.id

            if (id != null) {
                //update other session stored items
                let memoryItems = Object.entries(searchMemory.value)
                memoryItems.forEach(entry => {
                    const entryVal = entry[1].data
                    if (entryVal != null) {
                        if (Array.isArray(entryVal)) {
                            for (let i = 0; i < entryVal.length; i++) {
                                const listItem = entryVal[i];
                                if (listItem.id == id) {
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
                await useLocalDb().removeItem(key)
            }

            return undefined
        }

        async function restore<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= `/patch/restore?id=${dOptions.data.id}`
            
            buildPath(dOptions)

            //patch api
            if (options.api != null) {
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
            deleteItem,
            get,
            getAll,
            patch,
            post,
            restore,
            searchMemory //mainly for testing
        }
    })
}

interface UseWholeLastUpdateStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    storageMode?: 'session' | 'local-cache'
    storeName: string
}

export function createWholeLastUpdateStoreDefinition(options: UseWholeLastUpdateStoreOptions): BTStoreDefinition {
    return defineStore(options.storeName, () => {
        const dataItems: Ref<any[] | undefined> = ref()
        const count = ref(0)
        const currentTimeStampHours = DateTime.utc().toSeconds() / 3600
        const filters: Ref<string[] | undefined> = ref()
        const meta: Ref<LocalMeta | undefined> = ref()
        const promiseMemory: Ref<any> = ref({})
        const cacheLocally = options.storageMode == 'local-cache'
        
        function getKey() {
            return `${options.storeName}_${options.auth?.credentials.value.userID ?? 'no-user-id'}`
        }

        async function trySaveToLocalCache() {
            if (cacheLocally == true) {
                //save locally
                await useLocalDb().setItem(getKey(), {
                    meta: meta.value,
                    data: dataItems.value,
                    count: count.value,
                    filters: []
                })
            }
        }
        
        function createRefreshPromise<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetAllReturn<T>> {
            const key = getKey()

            if (promiseMemory.value[key])
                return promiseMemory.value[key]

            promiseMemory.value[key] = new Promise<StoreGetAllReturn<T>>(async (resolve, reject) => {
                try {
                    let res = await options.api?.getAll<StoreGetAllReturn<T>>({
                        additionalUrl: '/getAll',
                        nav: dOptions.nav,
                        params: {
                            lastUpdate: meta.value?.lastUpdate ?? getMinDateString()
                        }
                    })

                    if (res == null) {
                        reject(res)
                    }
                    else {
                        //update
                        dataItems.value ??= []
                        res.data.forEach(serverItem => {
                            const existingInd = dataItems.value!.findIndex(x => x.id == serverItem.id)
                            if (existingInd >= 0)
                                dataItems.value?.splice(existingInd, 1, serverItem)
                            else
                                dataItems.value?.push(serverItem)
                        })

                        count.value = dataItems.value.length
                        meta.value = {
                            lastUpdate: DateTime.utc().toString(),
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

        async function getAll<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetAllReturn<T>> {
            const key = getKey()
            const refresh = dOptions.refresh
            // dOptions.nav ??= options.

            if (!refresh && dataItems.value != null) {
                return {
                    count: dataItems.value?.length,
                    data: dataItems.value,
                    filters: []
                }
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)

                if (localRes != null && parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 7)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    filters.value = localRes.filters ?? []
                    meta.value = localRes.meta
                    
                    return {
                        count: dataItems.value?.length,
                        data: dataItems.value ?? [],
                        filters: []
                    }
                }
            }

            //nothing exists in session so far so load from api
            if (options.api == null) {
                return {
                    count: dataItems.value?.length,
                    data: dataItems.value ?? [],
                    filters: filters.value
                }
            }
            else {
                dataItems.value ??= []
            }

            try {
                return await createRefreshPromise(dOptions)
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function get<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetReturn<T>> {
            const key = getKey()
            const id = dOptions.id ?? dOptions.data?.id

            if (id == null)
                throw new Error('no id provided')

            let refresh = dOptions.refresh

            if (!refresh && dataItems.value != null) {
                const item = dataItems.value.find(x => x.id == id)
                if (item != null)
                    return { data: item }
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem>(key)

                if (localRes != null && parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 12)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    filters.value = localRes.filters ?? []
                    meta.value = localRes.meta
                    
                    let existingItem = dataItems.value?.find(x => x.id == dOptions.id)
                    
                    if (existingItem != null)
                        return { data: existingItem }
                }
            }

            if (options.api == null) {
                return {
                    data: dataItems.value?.find(x => x.id == dOptions.id)
                }
            }
            else {
                dataItems.value ??= []
            }

            try {
                await createRefreshPromise<T>(dOptions)

                return { data: dataItems.value?.find(x => x.id == dOptions.id) }
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function patch<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'
            // dOptions.nav ??= options.storeName
            
            let patchedObject: any

            //patch api
            if (options.api != null) {
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
                let existingInd = dataItems.value?.findIndex(x => x.id == patchedObject.id)
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1, patchedObject)
                    await trySaveToLocalCache()
                }
            }

            return dataItems.value?.find(x => x.id == (dOptions.id ?? dOptions.data.id))
        }

        async function post<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            // dOptions.nav ??= options.storeName
            
            let postedObject: any

            //post api
            if (options.api != null) {
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

            return dataItems.value?.find(x => x.id == (dOptions.id ?? dOptions.data.id))
        }

        async function deleteItem(dOptions: PathOptions): Promise<string | undefined> {
            dOptions.additionalUrl ??= '/delete'
            // dOptions.nav ??= options.storeName

            //delete api
            if (options.api != null) {
                //do not bother saving the promise
                try {
                    let res = await options.api.deleteItem(dOptions)
                    if (res != null)
                        return res
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }

            const id = dOptions.id ?? dOptions.data.id
            if (id != null) {
                let existingInd = dataItems.value?.findIndex(x => x.id == id)
                if (existingInd != null && existingInd >= 0) {
                    dataItems.value ??= []
                    dataItems.value?.splice(existingInd, 1)
                    await trySaveToLocalCache()
                }
            }

            return undefined
        }

        async function restore<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= `/patch/restore?id=${dOptions.data.id}`
            // dOptions.nav ??= options.storeName
            
            //patch api
            if (options.api != null) {
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
                await createRefreshPromise<any>(dOptions)
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }

            return dataItems.value?.find(x => x.id == (dOptions.id ?? dOptions.data.id))
        }

        return {
            deleteItem,
            get,
            getAll,
            patch,
            post,
            restore
        }
    })
}