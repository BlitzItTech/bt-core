import { ref } from 'vue'

export interface UseIteratingOptions {
    iterationCount?: number
    onError?: (err: any) => void
}

export interface IterateThroughOptions<T> {
    eachIteration: (list: T[]) => Promise<any>
    getLoadingMsg?: (ind: number, total: number) => string
    iterationCount?: number
    listToIterate: T[]
}

export function useIterating(options?: UseIteratingOptions) {
    const optCount = options?.iterationCount ?? 20
    const loadingMsg = ref<string | undefined>()
    const onError = options?.onError ?? (() => {})

    async function iterateThrough<T>(doOptions: IterateThroughOptions<T>) {
        try {
            let getLoadingMsg = doOptions.getLoadingMsg ?? ((ind: number, total: number) => `${ind} of ${total}`)
            let count = doOptions.iterationCount ?? optCount
            let soFar = 0
            let li = doOptions.listToIterate
            let total = li.length
            let startInd = 0
            let endInd = 0

            while (endInd < total) {
                endInd += count
                let partialList = li.slice(startInd, endInd)
                soFar += partialList.length
                loadingMsg.value = getLoadingMsg(soFar, total)
                startInd += partialList.length
                await doOptions.eachIteration(partialList)
            }

            return true
        }
        catch (err) {
            onError(err)
            return false
        }
        finally {
            loadingMsg.value = undefined
        }
    }

    return {
        iterateThrough,
        loadingMsg
    }
}