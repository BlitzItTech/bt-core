export type Environment = 'production' | 'staging' | 'development'

export interface CreateUrlOptions {
    getEnv: () => string,
    production: UrlSet
    staging: UrlSet
    development: UrlSet
}

export interface UrlSet {
    auth?: string
    data?: string
    localDbName?: string
    other?: any
}

let current: CreateUrlOptions

export function useDbName(): string {
    const env = current?.getEnv() as Environment

    if (current == null)
        return env as string
    
    const urlSet = current[env] ?? current['development']
    return urlSet.localDbName ?? env as string
}

export function useAuthUrl(): string {
    const env = current?.getEnv() as Environment

    console.log(`env var: ${env}`)
    if (current == null)
        return ''

    const urlSet = current[env] ?? current['development']
    return urlSet.auth ?? ''
}

/**
 *
 * @param microservice 
 * @returns 
 */
export function useDataUrl(microservice?: string): string {
    const env = current?.getEnv() as Environment

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