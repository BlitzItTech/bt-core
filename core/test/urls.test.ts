import { describe, test, expect } from 'vitest'
import { createUrl, useDbName, useAuthUrl, useDataUrl } from '../src/composables/urls'

describe('default urls', () => {
    const urls = createUrl({
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
    
    test('use prod db name', () => {
        const d = useDbName()
        expect(useDbName()).toEqual('ddb')
        expect(useAuthUrl()).toEqual('dauth')
        expect(useDataUrl()).toEqual('ddata')
        expect(useDataUrl('stock')).toEqual('dstock')
    })
})