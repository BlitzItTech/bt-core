import { describe, test, expect, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
import { ListEvents, ListProps, UseListOptions, useList } from '../src/composables/list'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { defineComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { withSetup } from './utils'
import { createApi } from '../src/composables/api'
import { createStoreBuilder } from '../src/composables/stores'
import { createAuth } from '../src/composables/auth'
import { UseNavigationOptions, createNavigation } from '../src/composables/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { twiddleThumbs } from '../src/composables/helpers'
import { createPinia, setActivePinia } from 'pinia'

const handlers = [
    http.get('https://test-api/get/1', () => {
        return HttpResponse.json({
            data: { test: 'a' }
        })
    }),
    http.get('https://test-api/get/2', () => {
        return new HttpResponse('not found', {
            status: 304,
            statusText: 'testing error one two three'
        })
    }),
    http.get('https://test-api/getAll', () => {
        return HttpResponse.json({
            data: [{ test: 'a' }, { test: 'b' }],
            count: 2,
            filters: ['test', 'test two']
        })
    }),
    http.get('https://test-api/getError', () => {
        return new HttpResponse('unauthorized', {
            status: 401
        })
    }),
    http.post('https://test-api/post', () => {
        return HttpResponse.json({ data: { test: 'b' } })
    }),
    http.patch('https://test-api/patch', () => {
        return HttpResponse.json({ data: { test: 'c', rowVersion: 2 } })
    })
]


const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterAll(() => server.close())

afterEach(() => {
    server.resetHandlers()
})

const setupList = (props: ListProps<any, any, any>, events?: ListEvents, options?: UseListOptions) => {
    return withSetup(() => {
        const api = createApi({

        })

        const auth = createAuth({

        })

        const router = createRouter({
            history: createWebHistory(),
            routes: []
        })

        const navigation = createNavigation({ })

        return {
            api: api,
            store: createStoreBuilder({
                api: api,
                auth,
                navigation
            }),
            router,
            auth,
            navigation,
            list: useList(props, events, options)
        }
    })
}

describe.sequential('default list no api', () => {
    const carOne = { model: 'carolla', brand: 'toyota', plate: 'abc' }
    const carTwo = { model: 'camry', brand: 'toyota', plate: 'def' }
    const carThree = { model: 'magna', brand: 'mits', plate: 'ghi' }
    const carFour = { model: 'bt-50', brand: 'mazda', plate: 'jkl' }
    const cars = [carOne, carTwo, carThree]

    const modelHeader = { hide: false, display: true, value: 'model', title: 'Model', sublevel: 0 }
    const brandHeader = { search: true, display: true, value: 'brand', title: 'Brand', sublevel: 1 }
    const plateHeader = { value: 'plate', title: 'Plate', level: 0 }

    const [{ list }, app] = setupList({
        eager: true,
        headers: [modelHeader, brandHeader, plateHeader],
        items: cars,
        itemsPerPage: 2,
        localOnly: true,
        onFilter: list => list.filter(z => z.brand == 'toyota'),
        storeMode: 'session',
        storageMode: 'session',
        useBladeSrc: false,
        useRouteSrc: false
    }, undefined, {

    })

    test('basic eager setup', () => {
        //items is loaded into list
        expect(list.asyncItems.value).toEqual(cars)
        //always starts on page 1
        expect(list.currentPage.value).toEqual(1)
        //display headers are loaded
        expect(list.displayHeaders.value.length).toEqual(2)
        //filtered items are loaded
        expect(list.filteredItems.value).toEqual([carOne, carTwo])
        //subtitles to show
        expect(list.subtitleOptions.value.length).toEqual(2)
        //titles to show
        expect(list.titleOptions.value.length).toEqual(1)
        //headers options include item actions
        expect(list.headerOptions.value.length).toEqual(4)
        //defaults
        expect(list.showSearch.value).toEqual(false)
        expect(list.showInactive.value).toEqual(false)
        expect(list.showError.value).toEqual(false)
    })

    test('change to items updates', () => {
        cars.push(carFour)
        expect(list.asyncItems.value.length).toEqual(4)
    })

    test('local search', async () => {
        list.searchString.value = 'toyota'
        // await twiddleThumbs(1000)
        expect(list.filteredItems.value).toEqual([carOne, carTwo])
    })

})

describe.sequential('can/cannot list no api', () => {
    const carOne = { model: 'carolla', brand: 'toyota', plate: 'abc' }
    const carTwo = { model: 'camry', brand: 'toyota', plate: 'def' }
    const carThree = { model: 'magna', brand: 'mits', plate: 'ghi' }
    const carFour = { model: 'bt-50', brand: 'mazda', plate: 'jkl' }
    const cars = [carOne, carTwo, carThree]

    const modelHeader = { hide: false, display: true, value: 'model', title: 'Model', sublevel: 0 }
    const brandHeader = { search: true, display: true, value: 'brand', title: 'Brand', sublevel: 1 }
    const plateHeader = { value: 'plate', title: 'Plate', level: 0 }

    const [{ list }, app] = setupList({
        eager: true,
        headers: [modelHeader, brandHeader, plateHeader],
        items: cars,
        itemsPerPage: 2,
        localOnly: true,
        onCanDelete: item => item.plate == 'abc',
        onCanRestore: item => item.brand == 'toyota',
        onCanSelectItem: item => item.model == 'cambry',
        onFilter: list => list.filter(z => z.brand == 'toyota'),
        startShowingInactive: true,
        storeMode: 'session',
        storageMode: 'session',
        useBladeSrc: false,
        useRouteSrc: false
    }, undefined, {

    })

    test('basic eager setup', () => {
        //items is loaded into list
        expect(list.asyncItems.value).toEqual(cars)
        //always starts on page 1
        expect(list.currentPage.value).toEqual(1)
        //display headers are loaded
        expect(list.displayHeaders.value.length).toEqual(2)
        //filtered items are loaded
        expect(list.filteredItems.value).toEqual([carOne, carTwo])
        //subtitles to show
        expect(list.subtitleOptions.value.length).toEqual(2)
        //titles to show
        expect(list.titleOptions.value.length).toEqual(1)
        //headers options include item actions
        expect(list.headerOptions.value.length).toEqual(4)
        //defaults
        expect(list.showSearch.value).toEqual(false)
        expect(list.showInactive.value).toEqual(true)
        // expect(list.totalPages.value).toEqual(2)
    })

    test('deletable', () => {
        expect(list.isDeletable.value(carOne)).toEqual(true)
        expect(list.isDeletable.value(carTwo)).toEqual(false)
    })

    test('restorable', () => {
        expect(list.isRestorable.value(carOne)).toEqual(true)
        expect(list.isRestorable.value(carTwo)).toEqual(true)
        expect(list.isRestorable.value(carThree)).toEqual(false)
    })

})

const setupListAndStuff = (props: ListProps<any, any, any>, navOptions?: UseNavigationOptions, path?: string) => {
    return withSetup(() => {
        const api = createApi({
            findPath() {
                return path ?? 'https://test-api/'
            }
        })

        const auth = createAuth({
            
        })

        // const router = createRouter({
        //     history: createWebHistory(),
        //     routes: []
        // })

        const navigation = createNavigation(navOptions ?? {})

        return {
            api: api,
            store: createStoreBuilder({
                api: api,
                auth,
                navigation
            }),
            auth,
            navigation,
            list: useList(props)
        }
    })
}


describe.sequential('list with api and filters', async () => {
    const [{ list }, app] = setupListAndStuff({
        defaultFilters: ['test', 'test three'],
        eager: true,
        nav: 'test',
        storeMode: 'session',
        storageMode: 'session',
        useRouteSrc: false,
        useBladeSrc: false
    },
    {
        navItems: [{ name: 'test', path: '' }]
    })

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    
    test('includes server and default filters', async () => {
        await flushPromises()
        await list.refresh({ deepRefresh: true })
        expect(list.filters.value).toEqual(['test', 'test three', 'test two'])
    })

    test('reset filters', async () => {
        list.filters.value.splice(0, 1)
        expect(list.filters.value).toEqual(['test three', 'test two'])
        await list.refresh({})
    })
})

describe.sequential('list pull unauthorized', async () => {
    const [{ list }, app] = setupListAndStuff({
        additionalUrl: '/getError',
        eager: true,
        nav: 'test',
        onError: (err: any) => {
            var e = 'str'
        },
        storeMode: 'session',
        storageMode: 'session',
        useRouteSrc: false,
        useBladeSrc: false
    },
    {
        navItems: [{ name: 'test', path: '' }]
    })

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    
    test('reset fails', async () => {
        await list.refresh({ deepRefresh: true })
    })
})

describe.sequential('list setup last updated store from nav items', async () => {
    const [{ list }, app] = setupListAndStuff({
        additionalUrl: '/getError',
        eager: true,
        nav: 'test',
        onError: (err: any) => {
            var e = 'str'
        },
        useRouteSrc: false,
        useBladeSrc: false
    },
    {
        navItems: [{ 
            name: 'test', 
            path: '',
            storeMode: 'whole-last-updated',
            storageMode: 'session'
        }]
    })
    

    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    
    test('reset fails', async () => {
        await list.refresh({ deepRefresh: true })
    })
})
