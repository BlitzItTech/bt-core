import { defineStore, StoreDefinition } from 'pinia'
import { ref, type Ref } from 'vue'
import { type PathOptions, type BTApi } from '../composables/api'
import { DateTime } from 'luxon'
import { toValue } from 'vue'
import { appendUrl, getMinDateString } from '../composables/helpers'
import { firstBy } from 'thenby'
import { useLocalDb } from '../composables/forage'
import { BaseModel } from '../types'
import { BTAuth } from './auth'

export type StoreMode = 'whole-last-updated' | 'partial-last-updated' | 'session'
export type StorageMode = 'session' | 'local-cache'

export interface LocalMeta {
    storedOn: string //days
    isDetailed?: boolean
    earliestData?: string
    lastUpdate?: string
}

export interface LocallyStoredItem<T> {
    meta: LocalMeta,
    data: T,
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

export interface BTStore extends StoreDefinition<any, {}, {},
{
    deleteItem: (dOptions: PathOptions) => Promise<string | undefined>
    get: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetReturn<T>>
    getAll: <T extends BaseModel>(dOptions: PathOptions) => Promise<StoreGetAllReturn<T>>
    patch: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    post: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
    restore: <T extends BaseModel>(dOptions: PathOptions) => Promise<T | undefined>
}> {}

export interface ApiError {
    message: string
}

export interface UseStoreOptions {
    /**ideally required. Otherwise will struggle to find url path */
    api?: BTApi
    /**ideally required. For setting unique local storage keys */
    auth?: BTAuth
    /**build a query.  Overrides the default */
    builderQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    /**particularly what store syle to use */
    storeMode: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode: StorageMode
    /**the name of this store */
    storeName: string
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
}

export interface CreateStoreOptions {
    /**particularly what store syle to use */
    storeMode: StoreMode
    /**whether to store data locally or only for the duration of the session */
    storageMode: StorageMode
    /**the name of this store */
    storeName: string
}

export function createStoreBuilder(options: CreateStoreBuilderOptions): (opt: CreateStoreOptions) => BTStore {
    return (opt: CreateStoreOptions) => {
        return createStore({
            ...options,
            ...opt
        })
    }
}

export function createStore(options: UseStoreOptions): BTStore {
    if (options.storeMode == 'whole-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')

        return createWholeLastUpdateStore(options)
    }
    else if (options.storeMode == 'partial-last-updated') {
        if (options.api == null) throw new Error('Must supply an api object to use store')

        return createWholeLastUpdateStore(options)
    }
    else { //if (options.storeMode == 'session') {
        return createSessionStore(options)
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
    storageMode: 'session' | 'local-cache'
    /**build a query.  Overrides the default */
    buildQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    /**the name of this store */
    storeName: string
}

export function createSessionStore(options: UseSessionStoreOptions): BTStore {
    return defineStore(options.storeName, () => {
        const currentTimeStampDays = DateTime.utc().toSeconds() / 86400
        const searchMemory: Ref<any> = ref({})
        const promiseMemory: Ref<any> = ref({})
        const cacheLocally = options.storageMode == 'local-cache'
        
        const buildPath = options.buildUrl ?? options.api?.buildUrl ?? defaultPathBuilder
        // const authData = useAuthData()
        
        function getKey(dOptions: PathOptions) {
            return `${options.storeName}_${options.auth?.credentials.userID ?? 'no-user-id'}_${dOptions.id ?? dOptions.data?.id ?? 'no-item-id'}`
        }

        async function getAll<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetAllReturn<T>> {
            dOptions.additionalUrl ??= '/getAll'
            
            const path = buildPath(dOptions)
            const key = `${options.storeName}_${options.auth?.credentials.userID ?? 'no-user-id'}_${path}`
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key] ?? null

            if (!refresh && cacheLocally == true) {
                //attempt to get locally
                const localRes = await useLocalDb().getItem<LocallyStoredItem<T[]>>(key)

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
                    apiPrm = new Promise<StoreGetAllReturn<T> | undefined>(async (resolve, reject) => {
                        try {
                            let res = await options.api?.getAll<StoreGetAllReturn<T>>(dOptions)

                            if (cacheLocally == true) {
                                await useLocalDb().setItem(key, {
                                    meta: { storedOn: currentTimeStampDays },
                                    ...res
                                })
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
                return apiRes
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function get<T extends BaseModel>(dOptions: PathOptions): Promise<StoreGetReturn<T>> {
            dOptions.additionalUrl ??= '/get'
            
            const key = getKey(dOptions)
            const refresh = dOptions.refresh

            if (!refresh && searchMemory.value[key] !== undefined)
                return searchMemory.value[key] ?? []

            if (!refresh && cacheLocally == true ) {
                //attempt to get locally
                const localRes = await useLocalDb().getItem<LocallyStoredItem<T>>(key)

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
                    apiPrm = new Promise(async (resolve, reject) => {
                        try {
                            let res = await options.api?.get<LocallyStoredItem<T>>(dOptions)
                            
                            if (cacheLocally == true) {
                                await useLocalDb().setItem(key, {
                                    meta: { storedOn: currentTimeStampDays },
                                    ...res
                                })
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
                return apiRes
            }
            catch (err) {
                let e = err as ApiError
                throw new Error(e.message ?? 'Problem')
            }
        }

        async function patch<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/patch'
            
            const key = getKey(dOptions)
            let patchedObject: any

            //patch api
            if (options.api != null) {
                //do not bother saving the promise
                try {
                    let apiRes = await options.api.patch<StoreGetReturn<T>>(dOptions)
                    patchedObject = apiRes?.data
                }
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
                }
            }
            else {
                patchedObject = dOptions.data
            }

            //update local versions
            if (patchedObject != null) {
                //update keyed search memory
                const existingItem = searchMemory.value[key]
                if (existingItem != null) {
                    existingItem.data = { ...existingItem.data, ...patchedObject }

                    //override local cache
                    if (cacheLocally == true) {
                        await useLocalDb().setItem(key, {
                            meta: { storedOn: currentTimeStampDays },
                            ...existingItem
                        })
                    }
                }
                
                //update other session stored items
                if (patchedObject.id != null && patchedObject.rowVersion != null) {
                    let memoryItems = Object.entries(searchMemory.value)
                    memoryItems.forEach(entry => {
                        let entryVal = entry[1] as any
                        entryVal = entryVal.data
                        if (entryVal != null) {
                            if (Array.isArray(entryVal)) {
                                for (let i = 0; i < entryVal.length; i++) {
                                    const listItem = entryVal[i];
                                    if (listItem.id == patchedObject.id) {
                                        entryVal.splice(i, 1, { ...listItem, ...patchedObject})
                                    }
                                }
                            }
                            else {
                                if (entryVal.id == patchedObject.id) {
                                    searchMemory.value[entry[0]].data = { ...entryVal, ...patchedObject}
                                }
                            }
                        }
                    })
                }
            }

            return patchedObject
        }

        async function post<T extends BaseModel>(dOptions: PathOptions): Promise<T | undefined> {
            dOptions.additionalUrl ??= '/post'
            
            const key = getKey(dOptions)
            let postedObject: any

            //patch api
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

            //update local versions
            searchMemory.value[key] = {
                meta: { storedOn: currentTimeStampDays },
                data: postedObject
            }

            if (cacheLocally == true) {
                await useLocalDb().setItem(key, searchMemory.value[key])
            }
            
            return postedObject
        }

        async function deleteItem(dOptions: PathOptions): Promise<string | undefined> {
            dOptions.additionalUrl ??= '/delete'
            const key = getKey(dOptions)

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

            //delete local memory
            delete searchMemory.value[key]

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
                catch (err) {
                    let e = err as ApiError
                    throw new Error(e.message ?? 'Patch Problem')
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
    storageMode: 'session' | 'local-cache'
    storeName: string
}

export function createWholeLastUpdateStore(options: UseWholeLastUpdateStoreOptions): BTStore {
    return defineStore(options.storeName, () => {
        const dataItems: Ref<any[] | undefined> = ref()
        const count = ref(0)
        const currentTimeStampHours = DateTime.utc().toSeconds() / 3600
        const filters: Ref<string[] | undefined> = ref()
        const meta: Ref<LocalMeta | undefined> = ref()
        const promiseMemory: Ref<any> = ref({})
        const cacheLocally = options.storageMode == 'local-cache'
        
        function getKey() {
            return `${options.storeName}_${options.auth?.credentials.userID ?? 'no-user-id'}`
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
            dOptions.nav ??= options.storeName

            if (!refresh && dataItems.value != null) {
                return {
                    count: dataItems.value?.length,
                    data: dataItems.value,
                    filters: []
                }
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem<T[]>>(key)

                if (localRes != null &&
                    parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 12)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    filters.value = localRes.filters ?? []
                    meta.value = localRes.meta
                    
                    return {
                        count: dataItems.value?.length,
                        data: dataItems.value,
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
            const refresh = dOptions.refresh
            dOptions.nav ??= options.storeName

            if (!refresh && dataItems.value != null) {
                return {
                    data: dataItems.value.find(x => x.id == dOptions.id)
                }
            }

            if (!refresh && cacheLocally == true) {
                //retrieve from local cache
                const localRes = await useLocalDb().getItem<LocallyStoredItem<T[]>>(key)

                if (localRes != null &&
                    parseFloat(localRes.meta.storedOn) > (currentTimeStampHours - 12)) {
                    dataItems.value = localRes.data
                    count.value = localRes.data.length
                    filters.value = localRes.filters ?? []
                    meta.value = localRes.meta
                    
                    let existingItem = dataItems.value.find(x => x.id == dOptions.id)
                    
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
            dOptions.nav ??= options.storeName
            
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
            dOptions.nav ??= options.storeName
            
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
            dOptions.nav ??= options.storeName

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
            dOptions.nav ??= options.storeName
            
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