import { ref, type Ref } from 'vue'
import type { PathOptions } from './api.ts'

export type ApiAction = 'get' | 'getAll' | 'delete' | 'post' | 'patch'

export interface CreateDemoOptions {
    apis?: DemoApiGroup[]
}

export interface DemoApiGroup {
    nav?: string | string[]
    path?: string
    data?: any[]
    getAllAction?: (list: any[], params: any) => any[]
    getAction?: (list: any[], id?: string) => any
    patchAction?: (list: any[], item: any) => any
    postAction?: (list: any[], item: any) => any
}

export interface BTDemo {
    endDemo: () => void
    isDemoing: Ref<boolean>
    startDemo: () => void
    data: DemoApiGroup[]
    deleteItem: (pathOptions: PathOptions) => Promise<string | undefined>
    get: (pathOptions: PathOptions) => Promise<any>
    getAll: (pathOptions: PathOptions) => Promise<any>
    post: (pathOptions: PathOptions) => Promise<any>
    patch: (pathOptions: PathOptions) => Promise<any>
    // getApiGroup: (PathOptions: PathOptions) => DemoApiGroup | undefined
}

let current: BTDemo

export function useDemo(): BTDemo {
    return current
}

export function createDemo(options?: CreateDemoOptions): BTDemo {
    const isDemoing = ref(false)
    const apis = options?.apis ?? []

    function startDemo() {
        isDemoing.value = true
    }

    function endDemo() {
        isDemoing.value = false
    }

    function getApiGroup(pathOptions: PathOptions): DemoApiGroup | undefined {
        let api: DemoApiGroup | undefined

        if (pathOptions.finalUrl != null) {
            const url = new URL(pathOptions.finalUrl)
            api = apis.find(z => z.path == url.pathname || z.path == (url.pathname + url.search))
        }
        
        if (api == null)
            api = apis.find(z => Array.isArray(z.nav) ? z.nav.some(n => n == pathOptions.nav) : z.nav == pathOptions.nav)

        return api
    }

    function deleteItem(pathOptions: PathOptions): Promise<string | undefined> {
        if (apis == null)
            return Promise.resolve('no demo data available for this api')

        const id = pathOptions.id ?? pathOptions.data?.id
        const api = getApiGroup(pathOptions)

        if (id != null && api?.data != null) {
            const ind = api.data.findIndex(z => z.id == id)
            if (ind >= 0)
                api.data.splice(ind, 1)
        }

        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(undefined)
            }, 200)
        })
    }

    function get(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const id = pathOptions.id ?? pathOptions.data?.id
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []
            if (api.getAction != null) {
                res = api.getAction(api.data, id)
            }
            else {
                if (id != null)
                    res = api.data?.find(z => z.id == id)
                else if (api.path != null && api.data?.length == 1)
                    res = api.data[0]
            }
        }

        if (res == null)
            return Promise.resolve(undefined)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            })
        })
    }

    function getAll(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []
            if (api.getAllAction != null)
                res = api.getAllAction(api.data, pathOptions.params)
            else
                res = api.data
        }

        if (res == null)
            return Promise.resolve(undefined)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res,
                    filters: [],
                    count: res?.length ?? 0
                })
            })
        })
       
    }

    function post(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []
            if (api.postAction != null) {
                res = api.postAction(api.data, pathOptions.data)
            }
            else if (pathOptions.data != null) {
                if (pathOptions.data.id == null)
                    pathOptions.data.id = ((api.data?.length ?? 0) + 1).toString()

                res = pathOptions.data
                api.data?.push(res)
            }
        }

        if (res == null)
            return Promise.resolve(undefined)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            })
        })
    }

    function patch(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []
            if (api.patchAction != null) {
                res = api.patchAction(api.data, pathOptions.data)
            }
            else if (pathOptions.data.id != null) {
                const ind = api.data?.findIndex(z => z.id == pathOptions.data.id)
                if (ind != null && ind > -1)
                    api.data?.splice(ind, 1, pathOptions.data)

                res = pathOptions.data
            }
        }

        if (res == null)
            return Promise.resolve(undefined)
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            })
        })
    }

    current = {
        endDemo,
        isDemoing,
        startDemo,
        data: apis,
        deleteItem,
        get,
        getAll,
        post,
        patch
    }

    return current
}