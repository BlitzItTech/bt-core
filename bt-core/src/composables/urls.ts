export type Environment = 'production' | 'staging' | 'development'

/**
 * ms: BASE_AUTH_URL, BASE_DATA_URL, WEB_APP_URL, Microservice, LOCAL_DB_NAME
 * @param microservice 
 * @returns 
 */
export function useUrl(microservice?: string) {
    let ms = `VITE_${microservice ?? 'BASE_DATA_URL'}`
    return import.meta.env[ms] as string | undefined
}