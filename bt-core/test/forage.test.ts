import { describe, expect, test } from 'vitest'
import { withSetup } from './utils'
import { useLocalDb, useLocalCache } from '../src/composables/forage'

describe('foraging', () => {
    const [db] = withSetup(() => useLocalDb())
    
    test('local db exists', () => {
        expect(db).not.toBeNull()
        expect(db._config.name).toEqual('Db_undefined')
    })

})

// describe('local cache', () => {
//     const [cache] = withSetup(() => useLocalCache())

//     test('save', async () => {
//         expect(cache).not.toBeNull()

//         await cache.saveAsync({ test: 'a' }, 'test-key')

//         const res = await cache.getAsync('test-key')

//         expect(res.test).toEqual('a')

//         await cache.clearAsync()

//         const none = await cache.getAsync('test-key')
//     })
// })