import { appendUrl } from "./helpers.ts"

export type Environment = 'production' | 'staging' | 'development'

export interface CreateUrlOptions {
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
    origins?: string[]
    other?: any
    images?: string
}

let current: CreateUrlOptions

export function useCurrentEnv(): Environment {
    let getE = current?.getEnv
    if (getE == null && current != null) {
        getE = () => {
            if (current.development.origins?.some((o: string) => o == location.origin))
                return 'development'
            
            if (current.staging.origins?.some((o: string) => o == location.origin))
                return 'staging'

            if (current.production.origins?.some((o: string) => o == location.origin))
                return 'production'

            return 'staging'
        }
    }

    if (getE != null)
        return getE() as Environment

    return 'staging'
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