import { toValue } from 'vue'
import { appendUrl } from '../composables/helpers.ts'
import { type BTAuth } from './auth.ts'
import { type BTDemo } from './demo.ts'

export interface QueryParams extends Record<string, any> {
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

export interface CreateApiOptions {
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
    /**demo for providing any demo data */
    demo?: BTDemo
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
    get: <T>(pathOptions: PathOptions) => Promise<T | undefined>
    getAll: <T>(pathOptions: PathOptions) => Promise<T | undefined>
    post: <T>(pathOptions: PathOptions) => Promise<T | undefined>
    patch: <T>(pathOptions: PathOptions) => Promise<T | undefined>
    uploadImage: (pathOptions: PathOptions) => Promise<string | undefined>
}

let current: BTApi

export function useApi(): BTApi {
    return current
}

export interface ApiError {
    name: string,
    code: 401 | 403,
    message: string
}

export function createApi(options?: CreateApiOptions): BTApi {
    const buildHeaders = options?.buildHeaders ?? defaultBuildHeaders
    const buildQuery = options?.buildQuery ?? defaultBuildQuery
    const buildUrl = options?.buildUrl ?? defaultBuildUrl
    const demo = options?.demo

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

        if (url == null && options?.findPath != null)
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
        //const auth = options?.auth?.credentials

        if (path.proxyID)
            fetchOptions.ManagedCompanyAccountID ??= path.proxyID

        if (options?.useBearerToken != false && options?.auth?.isLoggedIn.value == true)
            fetchOptions.authorization ??= `bearer ${options?.auth?.credentials.value.token}`
        
        fetchOptions['Content-Type'] ??= (path.contentType ?? options?.defaultContentType ?? 'application/json')

        return fetchOptions
    }

    async function get<T>(pathOptions: PathOptions): Promise<T | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers
        
        if (url == null)
            url = buildUrl(pathOptions)
        
        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Get from ${url}`)
            return demo.get(pathOptions)
        }
        
        console.log(`Get from ${url}`)

        let res: Response | undefined

        try {
            res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers
            });

            if (!res.ok) {
                if (res.status == 401) {
                    throw {
                        code: res.status,
                        name: 'Unauthorized',
                        message: res.statusText
                    }
                }

                let errorContent = await res.text()

                throw {
                    code: res.status,
                    name: 'Get error',
                    message: errorContent ?? res.statusText ?? ''
                }
                // throw new Error(errorContent ?? res.statusText ?? 'Get error')
            }
        
            if (returnText)
                return await res.text() as T
            if (returnJson)
                return await res.json() as T
            
            throw new Error()
        }
        catch (err: any) {
            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`
            if (!throwError) {
                return undefined
            }

            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Error',
                message: errMsg
            }
            // throw new Error(errMsg)
        }
    }
    
    async function getAll<T>(pathOptions: PathOptions): Promise<T | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true)
            headers = buildHeaders(pathOptions)

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Get all from ${url}`)
            return demo.getAll(pathOptions)
        }
        
        console.log(`Get all from ${url}`)

        let res: Response | undefined

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
                if (res.status == 401) {
                    throw {
                        code: res.status,
                        name: 'Unauthorized',
                        message: res.statusText
                    }
                }
                
                let errorContent = await res.text()
                throw {
                    code: res.status,
                    name: 'Get all error',
                    message: errorContent ?? res.statusText ?? ''
                }
                // throw new Error(errorContent ?? res.statusText ?? 'Get all error')
            }
        
            if (returnText)
                return await res.text() as T
            if (returnJson)
                return await res.json() as T
            
            throw new Error()
        }
        catch (err: any) {
            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`
            if (!throwError) {
                return undefined
            }

            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Error',
                message: errMsg
            }
            // throw new Error(errMsg)
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

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Post to ${url}`)
            return demo.post(pathOptions)
        }
        
        console.log(`Post to ${url}`)
        
        let res: Response | undefined
        
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
                if (res.status == 401) {
                    throw {
                        code: res.status,
                        name: 'Unauthorized',
                        message: res.statusText
                    }
                }

                let errorContent = await res.text()

                throw {
                    code: res.status,
                    name: 'Post error',
                    message: errorContent ?? res.statusText ?? ''
                }
                // throw new Error(errorContent ?? res.statusText ?? 'Post error!')
            }
        
            if (returnText)
                return await res.text() as T
            if (returnJson)
                return await res.json() as T
            
            throw new Error()
        }
        catch (err: any) {
            if (res!.status == 200 || !throwError)
                return undefined

            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`

            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Post error',
                message: errMsg
            }

            // throw new Error(errMsg)
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

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Patch to ${url}`)
            return demo.patch(pathOptions)
        }
        
        console.log(`Patch to ${url}`)

        let res: Response | undefined

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
                if (res.status == 401) {
                    throw {
                        code: res.status,
                        name: 'Unauthorized',
                        message: res.statusText
                    }
                }

                let errorContent = await res.text()

                throw {
                    code: res.status,
                    name: 'Patch error',
                    message: errorContent ?? res.statusText ?? ''
                }

                // throw new Error(errorContent ?? res.statusText ?? 'Patch error!')
            }
        
            if (returnText)
                return await res.text() as T
            if (returnJson)
                return await res.json() as T
            
            throw new Error()
        }
        catch (err: any) {
            // if (!throwError) {
            //     return res
            // }

            if (res!.status == 200 || !throwError)
                return undefined
        
            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`
            
            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Error',
                message: errMsg
            }

            // throw new Error(errMsg)
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

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Delete ${url}`)
            return demo.deleteItem(pathOptions)
        }
        
        console.log(`Delete ${url}`)

        let res: Response | undefined

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
            if (res.status == 401) {
                throw {
                    code: res.status,
                    name: 'Unauthorized',
                    message: res.statusText
                }
            }
            
            if (res.status == 200) {
                return undefined
            }
            else {
                return res.statusText
            }
        }
        catch (err: any) {
            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`
            if (!throwError) {
                return errMsg
            }

            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Error',
                message: errMsg
            }

            // throw new Error(`${res!.status} ${res!.statusText} ${err.message}`)
        }
    }

    /**data as a blob */
    async function uploadImage(pathOptions: PathOptions): Promise<string | undefined> {
        const throwError = pathOptions.throwError ?? options?.defaultThrowError ??  true
        // const returnJson = pathOptions.returnJson ?? options?.defaultReturnJson ?? true
        // const returnText = pathOptions.returnText ?? options?.defaultReturnText ?? false

        let url = pathOptions.finalUrl
        let headers = pathOptions.headers

        if (url == null)
            url = buildUrl(pathOptions)

        if (pathOptions.overrideHeaders !== true) {
            // pathOptions.contentType = 'multipart/form-data'
            headers = buildHeaders(pathOptions)
        }

        if (demo?.isDemoing.value) {
            console.log(`DEMO: Uploading image to ${url}`)
            return demo.post(pathOptions)
        }
        
        console.log(`Upload image to ${url}`)
        
        let res: Response | undefined
        
        try {
            const files = new FormData();
            // const file = DataURIToBlob(pathOptions.data);
            files.append('file', pathOptions.data);

            //remove headers content type
            const headersObj: any = { ...headers }
            delete headersObj['Content-Type']
            headers = new Headers(headersObj)

            res = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers,
                body: files
            })

            if (res.status == 401) {
                throw {
                    code: res.status,
                    name: 'Unauthorized',
                    message: res.statusText
                }
            }

            if (res.status == 200)
                return undefined

            return res.statusText
        }
        catch (err: any) {
            if (res!.status == 200 || !throwError)
                return undefined

            const errMsg = `${res?.status ?? ''} ${res?.statusText ?? ''} ${err.message}`

            if (err.code == 401)
                throw err

            throw {
                code: res?.status ?? err?.code ?? undefined,
                name: 'Upload error',
                message: errMsg
            }
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
        post,
        uploadImage
    }

    return current
}