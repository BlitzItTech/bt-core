import { describe, test, expect } from 'vitest'
import { createDemo, useDemo } from '../src/composables/demo'


describe.sequential('default demo', () => {
    const carOne = {
        id: '1',
        model: 'svu',
        plate: 'abc'
    }

    const carTwo = {
        id: '2',
        model: 'sedan',
        plate: 'def'
    }

    const demo = createDemo({
        apis: [
        {
            nav: 'cars',
            data: [carOne, carTwo]
        },
        {
            nav: 'utes',
            data: []
        },
        {
            nav: 'custom patch',
            data: [{ id: '1' }],
            patchAction: (list: any[], item: any) => {
                const existing = list.find(z => z.id == item.id)
                existing.version = 2
                return existing
            }
        },
        {
            nav: 'svus',
            data: []
        },
        {
            nav: 'custom',
            postAction: (list: any[], item: any) => {
                item.test = 'a'
                list.push(item)
                return item
            },
            getAction: (list: any, id?: string) => {
                return { test: true }
            },
            getAllAction: (list: any, params: any) => {
                return ['test']
            },
            data: [{ id: '1', treat: true }]
        },
        {

            path: '/sub',
            data: ['test one two three']
        }]
    })


    test('use succeeds', () => {
        const us = useDemo()
        expect(us.data).toEqual(demo.data)
    })

    test('get', async () => {
        let res = await demo.get({ nav: 'cars', id: '1' })
        expect(res).toEqual({ data: carOne })
        res = await demo.get({ nav: 'cars', id: '2' })
        expect(res).toEqual({ data: carTwo })
        res = await demo.get({ nav: 'cars', id: '3' })
        expect(res).toBeUndefined()
    })

    test('custom get action', async () => {
        let res = await demo.get({ nav: 'custom', id: '1' })
        expect(res).toEqual({ data: { test: true }})
    })

    test('get by path', async () => {
        let res = await demo.get({ additionalUrl: '/sub' })
        expect(res).toEqual({ data: 'test one two three' })
    })

    test('get all', async () => {
        let res = await demo.getAll({ nav: 'cars' })
        expect(res).toEqual({ data: [carOne, carTwo], filters: [], count: 2 })
        res = await demo.getAll({ nav: 'utes' })
        expect(res).toEqual({ data: [], filters: [], count: 0 })
    })

    test('custom get all', async () => {
        let res = await demo.getAll({ nav: 'custom' })
        expect(res).toEqual({ data: ['test'], filters: [], count: 1 })
    })

    test('post', async () => {
        const postItem = { id: undefined, plate: 'a' }
        const res = await demo.post({ nav: 'utes', data: postItem })
        expect(res.data.id).toEqual('1')
    })

    test('custom post', async () => {
        const res = await demo.post({ nav: 'custom', data: { dev: true } })
        expect(res).toEqual({ data: { dev: true, test: 'a' } })
    })

    test('patch', async () => {
        const res = await demo.post({ nav: 'svus', data: { model: 'a', plate: 'aa' }})
        const patchItem = { model: 'b', plate: 'aa', id: '1' }
        const patchRes = await demo.patch({ nav: 'svus', data: patchItem })
        expect(patchRes).toEqual({ data: { model: 'b', plate: 'aa', id: '1' } })
        const getRes = await demo.getAll({ nav: 'svus' })
        expect(getRes.data.length).toEqual(1)
    })

    test('custom patch', async () => {
        const patchRes = await demo.patch({ nav: 'custom patch', data: { id: '1' } })
        expect(patchRes).toEqual({ data: { id: '1', version: 2 } })
    })

    test('delete existing', async () => {
        await demo.post({ nav: 'svus', data: { test: true } })
        let getRes = await demo.getAll({ nav: 'svus' })
        expect(getRes.data.length).toEqual(2)
        let res = await demo.deleteItem({ nav: 'svus', id: '1' })
        getRes = await demo.getAll({ nav: 'svus' })
        expect(getRes.data.length).toEqual(1)
        res = await demo.deleteItem({ nav: 'svus', data: { id: '2' } })
        getRes = await demo.getAll({ nav: 'svus' })
        expect(getRes.data.length).toEqual(0)
    })

})