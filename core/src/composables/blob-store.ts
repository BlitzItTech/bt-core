// import { defineStore, StoreDefinition } from "pinia";
// import { BTStoreDefinition, LocallyStoredItem, StorePathOptions, UseStoreOptions } from "./stores.ts";
// import { Ref } from "vue";

// export interface BTBlobStoreDefinition extends StoreDefinition<any, {}, {}, {
//     $reset: () => void
//     getFile: (dOptions: StorePathOptions) => Promise<Response>
// }> {}

// export function createBlobStoreDefinition(options: UseStoreOptions): BTBlobStoreDefinition {
//     let navItem = options.navigation?.findItem(options.nav)
//     options.storeMode ??= navItem?.storeMode ?? 'session'
//     options.storageMode ??= navItem?.storageMode ?? 'local-cache'
//     options.storeName ??= options.navigation?.findStoreName(navItem ?? options.nav) ?? options.nav
//     options.getStorageKey ??= navItem?.getStorageKey

//     if (options.demo?.isDemoing.value)
//         options.storageMode = 'session'

//     if (options.storeName == null)
//         throw new Error('no store name provided')

//     return defineStore(options.storeName ?? 'blob-store', () => {
//         const searchMemory: Ref<{ [key: string]: LocallyStoredItem }> = ref({})
//         const promiseMemory: Ref<{ [key: string]: Promise<LocallyStoredItem> }> = ref({})
//         const cacheLocally = options.storageMode == 'local-cache'
//         const localDb = useLocalDb()
        
//         const buildPath = options.buildUrl ?? options.api?.buildUrl ?? defaultPathBuilder
//         const itemSelector = options.idSelector ?? ((item: any) => item.id)
        
//         function $reset() {
//             searchMemory.value = {}
//             promiseMemory.value = {}
//         }

//         async function getFile(dOptions: StorePathOptions) : Promise<Response> {
//             dOptions.additionalUrl ??= '/get'
            
//             buildPath(dOptions)
//             const key = getKey(dOptions)
//             const refresh = dOptions.refresh

//             if (!refresh && searchMemory.value[key] !== undefined)
//                 return searchMemory.value[key]

//             if (!refresh && cacheLocally == true ) {
//                 //attempt to get locally
//                 const localRes = await localDb.getItem<LocallyStoredItem>(key)

//                 if (localRes != null && 
//                     (options.api == null || parseFloat(localRes.meta?.storedOn ?? '0') > (currentTimeStampDays - 7))) {
//                     searchMemory.value[key] = localRes
//                     return { data: localRes.data }
//                 }
//             }

//             //nothing exists in session so far so load from api
//             if (options.api == null || dOptions.localOnly) {
//                 return searchMemory.value[key]
//             }

//             try {
//                 let apiPrm = promiseMemory.value[key]

//                 if (apiPrm == null) {
//                     apiPrm = new Promise<LocallyStoredItem>(async (resolve, reject) => {
//                         try {
//                             let apiRes = await options.api?.get<StoreGetReturn<T>>(dOptions)
                            
//                             const res: LocallyStoredItem = {
//                                 meta: { storedOn: currentTimeStampDays.toString() },
//                                 data: apiRes?.data
//                             }

//                             if (cacheLocally == true) {
//                                 await localDb.setItem(key, res)
//                             }
                            
//                             resolve(res)
//                         }
//                         catch (err) {
//                             reject(err)
//                         }
//                         finally {
//                             //remove promise
//                             delete promiseMemory.value[key]
//                         }
//                     })

//                     promiseMemory.value[key] = apiPrm
//                 }

//                 const apiRes = await apiPrm

//                 searchMemory.value[key] = apiRes

//                 return { data: apiRes.data }
//             }
//             catch (err: any) {
//                 throw err
//             }
//         }

//         return {
//             $reset,
//             getFile
//         }
//     })
// }