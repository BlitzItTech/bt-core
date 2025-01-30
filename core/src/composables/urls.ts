import { appendUrl } from "./helpers.ts"

export type Environment = 'production' | 'staging' | 'development'

export interface CreateUrlOptions {
    getDocTitle?: () => string | undefined,
    getEnv?: () => string,
    production: UrlSet
    staging: UrlSet
    development: UrlSet
}

export interface UrlSet {
    auth?: string
    data?: string
    localDbName?: string
    /**the origins that are this url set */
    origins?: Array<string | UrlOrigin>
    other?: any
    images?: string
    tabTitle?: string
}

export interface UrlOrigin {
    origin: string
    tabTitle?: string
}

let current: CreateUrlOptions

function originMatches(origin: string | UrlOrigin, currentOrigin: string) {
    if (typeof origin == 'string')
        return origin == currentOrigin
    else
        return origin.origin == currentOrigin
}

export function useCurrentEnv(): Environment {
    let getE = current?.getEnv
    if (getE == null && current != null) {
        getE = () => {
            const origin = location.origin
            if (current.development.origins?.some((o: string | UrlOrigin) => originMatches(o, origin)))
                return 'development'
            
            if (current.staging.origins?.some((o: string | UrlOrigin) => originMatches(o, origin)))
                return 'staging'

            if (current.production.origins?.some((o: string | UrlOrigin) => originMatches(o, origin)))
                return 'production'

            return 'staging'
        }
    }

    if (getE != null)
        return getE() as Environment

    return 'staging'
}

export function useTabTitle(): string | undefined {
    let getE = current?.getDocTitle
    if (getE == null && current != null) {
        getE = () => {
            const origin = location.origin
            const devSet = current.development.origins?.find(x => originMatches(x, origin))
            if (devSet != null)
                return typeof devSet == 'string' ? current.development.tabTitle : devSet.tabTitle

            const stageSet = current.staging.origins?.find(x => originMatches(x, origin))
            if (stageSet != null)
                return typeof stageSet == 'string' ? current.staging.tabTitle : stageSet.tabTitle

            const prodSet = current.production.origins?.find(x => originMatches(x, origin))
            if (prodSet != null)
                return typeof prodSet == 'string' ? current.production.tabTitle : prodSet.tabTitle

            return current.staging.tabTitle
        }
    }

    if (getE != null)
        return getE()

    return ''
}

export function useDbName(): string {
    const env = useCurrentEnv()

    if (current == null)
        return env as string
    
    const urlSet = current[env] ?? current['development']

    return urlSet.localDbName ?? env as string
}

export function useAuthUrl(): string {
    const env = useCurrentEnv()

    if (current == null)
        return ''

    const urlSet = current[env] ?? current['development']
    return urlSet.auth ?? ''
}

export function useImageUrl(id: string, containerUrl?: string): string {
    const env = useCurrentEnv()

    if (current == null)
        return ''

    const urlSet = current[env] ?? current['development']
    return appendUrl(appendUrl(urlSet.images ?? '', containerUrl), id)
}

/**
 *
 * @param microservice 
 * @returns 
 */
export function useDataUrl(microservice?: string): string {
    const env = useCurrentEnv()

    if (current == null)
        return ''

    const urlSet = current[env] ?? current['development']

    if (microservice == null)
        return urlSet.data ?? ''

    if (urlSet.other == null)
        return urlSet.data ?? ''
    
    let other = urlSet.other[microservice]

    return other ?? urlSet.data ?? ''
}

export function useUrls(): CreateUrlOptions {
    return current
}

export function createUrl(options: CreateUrlOptions): CreateUrlOptions {
    current = options
    return current
}