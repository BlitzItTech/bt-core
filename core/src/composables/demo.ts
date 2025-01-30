import { ref, type Ref } from 'vue'
import type { PathOptions } from './api.ts'
import { getActivePinia, Store, Pinia } from 'pinia'
import { BTAuth } from './auth.ts'
import { jwtEncrypt } from './helpers.ts'

export type ApiAction = 'get' | 'getAll' | 'delete' | 'post' | 'patch'

export interface CreateDemoOptions {
    apis?: DemoApiGroup[]
    auth?: BTAuth
    getProfiles?: () => DemoProfile[]
    getAuthToken?: () => any
    startInDemo?: boolean
}

export interface DemoProfile {
    description?: string
    getAuthToken?: () => any
    id: string
    isDefault?: boolean
    profileName?: string
    profileAvatarURL?: string
    profileIcon?: string
}

export interface DemoApiGroup {
    nav?: string | string[]
    path?: string
    data?: any[]
    deleteAction?: <T>(list: T[], itemInd: number) => any
    getAllAction?: <T>(list: T[], params: any) => T[] | any[]
    getAction?: <T>(list: T[], id?: string) => T | any
    patchAction?: <T>(list: T[], item: any) => T | any
    postAction?: <T>(list: T[], item: any) => T | any
    getActions?: Record<string, <T>(list: T[], pathOptions?: PathOptions, id?: string) => any>
    postActions?: Record<string, <T>(list: T[], pathOptions?: PathOptions, id?: string) => any>
    patchActions?: Record<string, <T>(list: T[], pathOptions?: PathOptions, id?: string) => any>
}

export interface BTDemo {
    getProfiles?: () => DemoProfile[]
    endDemo: (goHome?: boolean) => void
    isDemoing: Ref<boolean>
    startDemo: (profileID?: string) => void
    data: DemoApiGroup[]
    deleteItem: (pathOptions: PathOptions) => Promise<any>
    get: (pathOptions: PathOptions) => Promise<any>
    getAll: (pathOptions: PathOptions) => Promise<any>
    post: (pathOptions: PathOptions) => Promise<any>
    patch: (pathOptions: PathOptions) => Promise<any>
}

let current: BTDemo

export function useDemo(): BTDemo {
    return current
}

export interface ExtendedPinia extends Pinia {
    _s: Map<string, Store>
}

export function createDemo(options?: CreateDemoOptions): BTDemo {
    const demoKey = 'isInDemoMode'
    const localMemory = localStorage.getItem(demoKey)
    const isDemoing = ref(options?.startInDemo == true || localMemory == 'true')
    const apis = options?.apis ?? []

    function getProfile(profileID?: string) {
        var profiles = (options?.getProfiles != null ? options?.getProfiles() ?? [] : [])
        var r = profiles.find(x => x.id == profileID)
        r ??= profiles.find(x => x.isDefault)
        return r
    }

    /**logs out and sets auth as demo*/
    function startDemo(profileID?: string) {
        if (options?.auth?.isLoggedIn.value == true)
            options?.auth.logout()

        //update auth
        if (options?.auth != null) { //&& options?.getAuthToken != null
            var getAuthToken = options?.getAuthToken
            getAuthToken ??= getProfile(profileID)?.getAuthToken
            if (getAuthToken != null)
                options.auth.setAuth(jwtEncrypt(getAuthToken()))
        }
        
        isDemoing.value = true
        
        localStorage.setItem(demoKey, 'true')

        window.location.href = location.href
    }

    /**clears stored demo data and logs out of demo */
    function endDemo(goHome?: boolean) {
        isDemoing.value = false

        const activePinia = getActivePinia() as ExtendedPinia
        if (activePinia)
            activePinia._s.forEach((store) => {
                store.$reset()
            })
        
        localStorage.setItem(demoKey, 'false')

        if (options?.auth != null)
            options?.auth.logout()

        window.location.href = goHome == true ? location.origin : location.href
    }

    function getApiGroup(pathOptions: PathOptions): DemoApiGroup | undefined {
        let api: DemoApiGroup | undefined

        if (pathOptions.finalUrl != null) {
            const url = new URL(pathOptions.finalUrl, 'https://demo')

            console.log(`searching for path ${url.pathname} or ${url.pathname + url.search}`)
            api = apis.find(z => z.path == url.pathname || z.path == (url.pathname + url.search))
        }
        
        if (api == null)
            api = apis.find(z => Array.isArray(z.nav) ? z.nav.some(n => n == pathOptions.nav) : z.nav == pathOptions.nav)

        if (api == null)
            console.log(`No api group found for ${pathOptions.nav} and path: ${pathOptions.additionalUrl}`)
        
        return api
    }

    function deleteItem(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            return Promise.resolve('no demo data available for this api')

        const id = pathOptions.id ?? pathOptions.data?.id
        const api = getApiGroup(pathOptions)

        if (id != null && api?.data != null) {
            const ind = api.data.findIndex(z => z.id == id)
            if (ind >= 0) {
                if (api.deleteAction != null)
                    api.deleteAction(api.data, ind)
                else
                    api.data.splice(ind, 1)
            }
        }

        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve({
                    data: undefined
                })
            }, 200)
        })
    }

    function findActionFor(
        api: DemoApiGroup, 
        meth: 'Get' | 'Post' | 'Patch', 
        additionalUrl?: string) {
        var customName: string | undefined = additionalUrl

        if (customName != null)
            customName = customName.replaceAll('/', '').replaceAll(' ', '').toLowerCase()

        if (customName == null)
            return undefined

        customName = customName.split('?')[0]

        if (meth == 'Get') {
            if (customName != null && api.getActions != null && api.getActions[customName] != null)
                return api.getActions[customName]
        }
        else if (meth == 'Patch') {
            if (customName != null && api.patchActions != null && api.patchActions[customName] != null)
                return api.patchActions[customName]
        }
        else if (meth == 'Post') {
            if (customName != null && api.postActions != null && api.postActions[customName] != null)
                return api.postActions[customName]
        }

        return undefined
    }

    function get(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const id = pathOptions.id ?? pathOptions.data?.id
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []

            var customAction = findActionFor(api, 'Get', pathOptions.additionalUrl)
            if (customAction != null) {
                res = customAction(api.data, pathOptions, id)
            }
            else {
                if (api.getAction != null) {
                    res = api.getAction(api.data, id)
                }
                else {
                    if (id != null)
                        res = api.data?.find(z => z.id == id)
                    else if (api.path != null)
                        res = api.data
                }
            }
        }

        if (res == null)
            return Promise.resolve(undefined)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            }, 200)
        })
    }

    function getAll(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        
        let res: any
        
        if (api != null) {
            api.data ??= []

            var customAction = findActionFor(api, 'Get', pathOptions.additionalUrl)
            if (customAction != null) {
                res = customAction(api.data, pathOptions)
            }
            else {
                if (api.getAllAction != null)
                    res = api.getAllAction(api.data, pathOptions.params)
                else
                    res = api.data
            }
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
            }, 200)
        })
       
    }

    function post(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []

            var customAction = findActionFor(api, 'Post', pathOptions.additionalUrl)
            if (customAction != null) {
                res = customAction(api.data, pathOptions)
            }
            else {
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
        }

        if (res == null)
            return Promise.resolve(undefined)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            }, 200)
        })
    }

    function patch(pathOptions: PathOptions): Promise<any> {
        if (apis == null)
            throw new Error('no demo data available for this api')
        
        const api = getApiGroup(pathOptions)
        let res: any
        
        if (api != null) {
            api.data ??= []

            var customAction = findActionFor(api, 'Patch', pathOptions.additionalUrl)
            if (customAction != null) {
                res = customAction(api.data, pathOptions)
            }
            else {
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
        }

        if (res == null)
            return Promise.resolve(undefined)
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: res
                })
            }, 200)
        })
    }

    current = {
        getProfiles: options?.getProfiles,
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