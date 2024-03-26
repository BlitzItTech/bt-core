import localforage from 'localforage';
import { useUrl } from '@/composables/urls';

let localDb: LocalForage | null = null;

localforage.config({
    name: useUrl(`Db_${import.meta.env.MODE}`)
})

export function useLocalDb(): LocalForage {
    const dbName = `Db_${useUrl('LOCAL_DB_NAME')}`
    if (localDb == null || localDb.config.name != dbName) {
        localDb = localforage.createInstance({ name: dbName })
    }

    return localDb
}

export function useLocalCache() {

    async function clearAsync(storeName: string) {
        const db = useLocalDb()
        const keys = await db.keys()
        let filteredKeys = keys.filter(key => key.startsWith(storeName))

        filteredKeys.forEach(fKey => {
            db.removeItem(fKey)
        })
    }

    async function getAsync<T>(key: string) {
        return await useLocalDb().getItem<T>(key)
    }

    async function removeAsync(key: string) {
        return await useLocalDb().removeItem(key)
    }

    async function saveAsync<T>(data: T, key: string) {
        await useLocalDb().setItem(key, data)
    }

    return {
        clearAsync,
        getAsync,
        removeAsync,
        saveAsync
    }
}