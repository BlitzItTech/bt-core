import { describe, expect, test } from "vitest";
import { useLists } from "../src/composables/lists"
import { twiddleThumbs } from "../src/composables/helpers"
import { ListEvents, ListProps, UseListOptions, useList } from '../src/composables/list'
import { withSetup } from './utils'
import { createApi } from '../src/composables/api'
import { createStoreBuilder } from '../src/composables/stores'
import { createAuth } from '../src/composables/auth'
import { createNavigation } from '../src/composables/navigation'
import { createRouter, createWebHistory } from 'vue-router'

const setupList = (listOne: ListProps, listTwo: ListProps) => {
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
            listOne: useList(listOne),
            listTwo: useList(listTwo)
        }
    })
}

describe('default lists', () => {
    test('basic', async () => {
        let loaded = false

        let listO = false
        let listT = false

        const { registerList } = useLists({
            onAllLoaded: () => {
                loaded = true
                expect(listO).toEqual(true)
                expect(listT).toEqual(true)
            }
        })

        const [{ listOne, listTwo }, app] = setupList(
            registerList({
                eager: true,
                items: [],
                onGetSuccessAsync: async (l) => {
                    await twiddleThumbs(2000)
                    listO = true
                    return l
                },
                storeMode: 'session',
                storageMode: 'session'
            }),
            registerList({
                eager: true,
                items: [],
                onGetSuccessAsync: async (l) => {
                    listT = true
                    return l
                },
                storeMode: 'session',
                storageMode: 'session'
            })
        )

        expect(loaded).toEqual(false)

        await twiddleThumbs(3000)

        expect(loaded).toEqual(true)
    })
    

})


// describe('global loading', () => {
//     test('basic', async () => {
        
//         const { loading, registerList } = useLists({
//             onAllLoaded: () => {}
//         })

//         const [{ listOne, listTwo }, app] = setupList(
//             registerList({
//                 eager: true,
//                 items: [],
//                 onGetSuccessAsync: async (l) => {
//                     await twiddleThumbs(2000)
//                     listO = true
//                     return l
//                 },
//                 storeMode: 'session',
//                 storageMode: 'session'
//             }),
//             registerList({
//                 eager: true,
//                 items: [],
//                 onGetSuccessAsync: async (l) => {
//                     listT = true
//                     return l
//                 },
//                 storeMode: 'session',
//                 storageMode: 'session'
//             })
//         )

//         expect(loaded).toEqual(false)

//         await twiddleThumbs(3000)

//         expect(loaded).toEqual(true)
//     })
    

// })