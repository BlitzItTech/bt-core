import { toValue } from 'vue'
import { appendUrl } from '../composables/helpers'
import { type BTAuth } from './auth'

export interface QueryParams {
    filterBy?: string,
    includeCount?: boolean,
    includeDetails?: boolean,
    includeInactive?: boolean,
    lastUpdate?: string,
    other?: any //for other random params
    properties?: string[] | string,
    query?: string,
    searchString?: string,
    sortOrder?: string,
    sortBy?: string,
    takeFrom?: number,
    takeAmount?: number
}

export interface PathOptions {
    /**always added to end before query {url}/{additionalUrl}?{query} */
    additionalUrl?: string
    /**application/json or other options */
    contentType?: string
    /**that data to send in the body for POST, PATCH, and DELETE requests */
    data?: any
    /** resulting url after building {nav | url}/{additionalUrl}?{params} */
    finalUrl?: string,
    /**override default headers */
    headers?: HeadersInit
    /**id will be added as a url paramter (/{id}?) rather than as a query parameter */
    id?: string
    /**where to find the url */
    nav?: string
    /**headers will not be calculated.  Only the given headers in these options will be used */
    overrideHeaders?: boolean
    /**query parameters */
    params?: QueryParams
    /**attaches a proxyID to the request */
    proxyID?: string
    /**whether to refresh the store data and go straight to the server */
    refresh?: boolean
    /**returns result as a json object.  Defaults to true. */
    returnJson?: boolean
    /**returns result as a string */
    returnText?: boolean
    /**If false, returns response no matter the status code */
    throwError?: boolean
    /**if exists then overrides default nav */
    url?: string
    /**whether to preference using the local cache */
    useLocalCache?: boolean
}

type FindPath = (navName?: string) => string | undefined
// type BuildHeaders = (path: PathOptions) => HeadersInit
// type BuildQuery = (params: any) => string
// type BuildUrl = (path: PathOptions) => string

export interface UseApiOptions {
    auth?: BTAuth
    /**overrides the default */
    buildHeaders?: (path: PathOptions) => HeadersInit
    /**build a query.  Overrides the default */
    buildQuery?: (params: any) => string
    /**overrides the default */
    buildUrl?: (path: PathOptions) => string
    /**defaults to 'application/json' */
    defaultContentType?: string
    /**returns result as a json object.  Defaults to true. */
    defaultReturnJson?: boolean
    /**returns result as a string */
    defaultReturnText?: boolean
    /**defaults to true.  Will throw an error on fail */
    defaultThrowError?: boolean
    /**defaults to a function that returns '' */
    findPath?: FindPath
    /**if true and logged in then will set an authorization header with 'bearer [token]' */
    useBearerToken?: boolean
}

export interface BTApi {
    buildHeaders: (options: PathOptions) => HeadersInit
    buildQuery: (params: any) => string
    buildUrl: (path: PathOptions) => string
    deleteItem: (pathOptions: PathOptions) => Promise<string | undefined>
    get: <T>(pathOptions: PathOptions) => Promise<T>
    getAll: <T>(pathOptions: PathOptions) => Promise<T>
    post: <T>(pathOptions: PathOptions) => Promise<T | undefined>
    patch: <T>(pathOptions: PathOptions) => Promise<T | undefined>
}

let current: BTApi

export function useApi(): BTApi {
    return current
}

export function createApi(options?: UseApiOptions): BTApi {
    const buildHeaders = options?.buildHeaders ?? defaultBuildHeaders
    const buildQuery = options?.buildQuery ?? defaultBuildQuery
    const buildUrl = options?.buildUrl ?? defaultBuildUrl

    function defaultBuildQuery(params: QueryParams): string {
        let query = new URLSearchParams()
        
        Object.entries(params).forEach(x => {
            if (x[1] != undefined) {
                query.append(x[0], x[1])
            }
        })
        
        if (params.filterBy) {
            query.set('filterBy', params.filterBy)
        }

        if (params.includeCount)
            query.set('includeCount', params.includeCount.toString())

        if (params.includeDetails != undefined)
            query.set('includeDetails', params.includeDetails.toString())

        if (params.includeInactive)
            query.set('includeInactive', params.includeInactive.toString())

        if (params.properties)
            query.set('properties', params.properties.toString())

        if (params.query)
            query.set('query', params.query.toString())

        if (params.searchString)
            query.set('searchString', params.searchString)

        if (params.sortOrder)
            query.set('sortOrder', params.sortOrder)

        if (params.sortBy)
            query.set('sortBy', params.sortBy)

        if (params.takeFrom)
            query.set('takeFrom', params.takeFrom.toString())

        if (params.takeAmount)
            query.set('takeAmount', params.takeAmount.toString())

        if (params.other) {
            Object.entries(params.other).forEach(x => {
                if (x[1] != undefined) {
                    query.append(x[0], x[1].toString())
                }
            })
        }

        return query.toString()
    }

    /**returns path and sets final url */
    function defaultBuildUrl(path: PathOptions) {
        let url: string | undefined = toValue(path.url) ?? undefined
        let id = toValue(path.id)

        if (url == null && path.nav != null && options?.findPath != null)
            url = options.findPath(path.nav)

        if (path.additionalUrl != null) {
            if (url == null)
                url = path.additionalUrl
            else
                url = appendUrl(url, path.additionalUrl)
        }

        if (id != null) {
            if (url?.includes('{id}'))
                url = url.replaceAll('{id}', id)
            else
                url = appendUrl(url, id)
        }

        if (path.params != null)
            url = `${url}?${buildQuery(path.params)}`

        path.finalUrl = url

        return path.finalUrl ?? ''
    }

    function defaultBuildHeaders(path: PathOptions): HeadersInit {
        let fetchOptions:any = { ...path.headers }
        const auth = options?.auth?.credentials

        if (path.proxyID)
            fetchOptions.ManagedCompanyAccountID ??= path.proxyID

        if (options?.useBearerToken != false && auth?.isLoggedIn == true)
            fetchOptions.authorization ??= `bearer ${auth.token}`
        
        fetchOptions['Content-Type'] ??= (path.contentType ?? options?.defaultContentType ?? 'application/json')

        return fetchOptions
    }

    async function get<T>(pathOptions: PathOptions): Promise<T> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers
        
        if (url == null)
            url = buildUrl(pathOptions)
        
        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        console.log(`Get from ${url}`)

        let res: any = undefined

        try {
            res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers
            });

            // if (!throwError) {
            //     return res
            // }

            if (!res.ok) {
                let errorContent = await res.text()
                throw new Error(errorContent ?? res.statusText ?? 'Get error')
            }
        
            if (returnText)
                return await res.text()
            if (returnJson)
                return await res.json()
            
            return res
        }
        catch (err) {
            if (!throwError) {
                return res
            }

            throw new Error(err as string)
        }
    }
    
    async function getAll<T>(pathOptions: PathOptions): Promise<T> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        console.log(`Get all from ${url}`)

        let res: any = undefined

        try {
            res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers
            });

            // if (!throwError) {
            //     return res
            // }

            if (!res.ok) {
                let errorContent = await res.text()
                throw new Error(errorContent ?? res.statusText ?? 'Get all error')
            }
        
            if (returnText)
                return await res.text()
            if (returnJson)
                return await res.json()
            
            return res
        }
        catch (err) {
            if (!throwError) {
                return res
            }

            throw new Error(err as string)
        }
        
    }

    async function post<T>(pathOptions: PathOptions): Promise<T | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        console.log(`Post to ${url}`)
        
        let res: any = undefined
        
        try {
            res = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers,
                body: JSON.stringify(pathOptions.data)
            })

            // if (!throwError) {
            //     return res
            // }

            if (!res.ok) {
                let errorContent = await res.text()
                throw new Error(errorContent ?? res.statusText ?? 'Post error!')
            }
        
            if (returnText)
                return await res.text()
            if (returnJson)
                return await res.json()
            
            return res
        }
        catch (err) {
            if (!throwError) {
                return res
            }

            if (res.status == 200)
                return undefined

            throw new Error(err as string)
        }
    }
    
    async function patch<T>(pathOptions: PathOptions): Promise<T | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        console.log(`Patch to ${url}`)

        let res: any = undefined

        try {
            res = await fetch(url, {
                method: 'PATCH',
                mode: 'cors',
                cache: 'no-cache',
                headers,
                body: JSON.stringify(pathOptions.data)
            })

            // if (!throwError) {
            //     return res
            // }

            if (!res.ok) {
                let errorContent = await res.text()
                throw new Error(errorContent ?? res.statusText ?? 'Patch error!')
            }
        
            if (returnText)
                return await res.text()
            if (returnJson)
                return await res.json()
            
            return res
        }
        catch (err) {
            if (!throwError) {
                return res
            }

            if (res.status == 200)
                return undefined
        
            throw new Error(err as string)
        }
    }

    /**
     * 
     * @param options 
     * returns an error msg if failed
     */
    async function deleteItem(pathOptions: PathOptions): Promise<string | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        
        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        console.log(`Delete ${url}`)

        let res: any = undefined

        try {
            res = await fetch(url, {
                method: 'DELETE',
                mode: 'cors',
                cache: 'no-cache',
                headers,
                body: JSON.stringify(pathOptions.data)
            })
        
            // if (!throwError) {
            //     return res
            // }

            if (res.status == 200) {
                return undefined
            }
            else {
                return res.statusText
            }
        }
        catch (err) {
            if (!throwError) {
                return res
            }

            throw new Error(err as string)
        }
    }

    current = {
        buildHeaders,
        buildQuery,
        buildUrl,
        deleteItem,
        get,
        getAll,
        patch,
        post
    }

    return current
}