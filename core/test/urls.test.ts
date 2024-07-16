import { describe, test, expect } from 'vitest'
import { createUrl, useDbName, useAuthUrl, useDataUrl } from '../src/composables/urls'

describe.sequential('default dev urls', () => {
    var env = 'development'

    const urls = createUrl({
        getEnv: () => env,
        production: {
            auth: 'pauth',
            data: 'pdata',
            localDbName: 'pdb',
            other: {
                ordering: 'pordering',
                stock: 'pstock'
            }
        },
        staging: {
            auth: 'sauth',
            data: 'sdata',
            localDbName: 'sdb',
            other: {
                ordering: 'sordering',
                stock: 'sstock'
            }
        },
        development: {
            auth: 'dauth',
            data: 'ddata',
            localDbName: 'ddb',
            other: {
                ordering: 'dordering',
                stock: 'dstock'
            }
        }
    })
    
    test('use dev names', () => {
        expect(useDbName()).toEqual('ddb')
        expect(useAuthUrl()).toEqual('dauth')
        expect(useDataUrl()).toEqual('ddata')
        expect(useDataUrl('ordering')).toEqual('dordering')
        expect(useDataUrl('stock')).toEqual('dstock')
    })

    test('use staging names', () => {
        env = 'staging'
        expect(useDbName()).toEqual('sdb')
        expect(useAuthUrl()).toEqual('sauth')
        expect(useDataUrl()).toEqual('sdata')
        expect(useDataUrl('ordering')).toEqual('sordering')
        expect(useDataUrl('stock')).toEqual('sstock')
    })

    test('use production names', () => {
        env = 'production'
        expect(useDbName()).toEqual('pdb')
        expect(useAuthUrl()).toEqual('pauth')
        expect(useDataUrl()).toEqual('pdata')
        expect(useDataUrl('ordering')).toEqual('pordering')
        expect(useDataUrl('stock')).toEqual('pstock')
    })
})