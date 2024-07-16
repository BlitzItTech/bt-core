export interface XAxis {
    xSpanOptions: string[]
    xSpreadOptions: string[]
}

export interface UseXOptions<T> {
    data?: T[]
    xProp?: string
    xSpanOptions?: string[]
    xSpreadOptions?: string[]
}

// export function useXAxis(options?: useXOptions) {

// }