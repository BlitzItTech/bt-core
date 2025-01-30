import { computed, ref, shallowRef } from 'vue'
import type { ShallowRef, Ref } from 'vue'
// import { useConfirmAsync } from '../composables/dialogs'
import { watchArray } from '@vueuse/core'
import { useId } from '../composables/id.ts'

interface LoadingMsg {
    id: string,
    msg: string
}

export interface DoActionOptions {
    completionMsg?: string
    confirmationMsg?: string
    errorMsg?: string
    loadingMsg?: string
    onFinished?: () => void
    onError?: (err: any) => void
    requireConfirmation?: boolean
    stringifyError?: (err: any) => string
    throwError?: boolean
}

export function useActionsTracker(useOptions?: DoActionOptions) {
    const loadingMsgs: Ref<LoadingMsg[]> = ref([])
    const mLoadingMsg: ShallowRef<string | undefined> = shallowRef()
    const mErrorMsg: ShallowRef<string | undefined> = shallowRef()
    const mCompletionMsg: ShallowRef<string | undefined> = shallowRef()
    const isLoading = computed(() => mLoadingMsg.value != null)
    
    function endLoading(id: string) {
        loadingMsgs.value = loadingMsgs.value.filter(x => x.id != id)
    }

    function startLoading(msg?: string): string {
        const e = {
            id: useId(),
            msg: msg ?? 'Loading'
        }
        loadingMsgs.value.push(e)
        return e.id
    }

    function stringifyError(err: any) {
        if (useOptions?.stringifyError != null)
            return useOptions?.stringifyError(err)
        return err?.toString()
    }

    function logError(err?: string | Error) {
        if (err != null)
            mErrorMsg.value = stringifyError(err)
    }

    function clearErrors() {
        mErrorMsg.value = undefined
    }

    async function doAction<TReturn>(action: any, options?: DoActionOptions) {
        const opt = { ...options }
        opt.completionMsg ??= useOptions?.completionMsg
        opt.confirmationMsg ??= useOptions?.confirmationMsg
        opt.errorMsg ??= useOptions?.errorMsg
        opt.loadingMsg ??= useOptions?.loadingMsg ?? 'Loading'
        opt.requireConfirmation ??= useOptions?.requireConfirmation
        opt.onError ??= useOptions?.onError
        opt.onFinished ??= useOptions?.onFinished
        
        const id = startLoading(opt.loadingMsg)
        let res: any = null

        try {
            if (opt.requireConfirmation || opt.confirmationMsg) {
                // if (!await useConfirmAsync(opt.confirmationMsg ?? 'Are you sure?'))
                //     return
            }

            res = await action()
            
            if (opt.completionMsg != null) {
                mCompletionMsg.value = opt.completionMsg
            }

            return res as TReturn
        }
        catch (err: any) {
            if (opt.onError != null)
                opt.onError(err)
            else if (opt.throwError == true)
                throw err
            else
                logError(opt.errorMsg ?? (err as string) ?? 'error')
        }
        finally {
            if (opt.onFinished != null)
                opt.onFinished()

            endLoading(id)
        }
    }

    watchArray(loadingMsgs, (newList: LoadingMsg[]) => {
        mLoadingMsg.value = newList.length > 0 ? newList[0].msg : undefined
    }, { deep: true })

    return {
        actionErrorMsg: mErrorMsg,
        actionLoadingMsg: mLoadingMsg,
        actionCompleteMsg: mCompletionMsg,
        clearErrors,
        doAction,
        isLoading,
        logError
    }
}