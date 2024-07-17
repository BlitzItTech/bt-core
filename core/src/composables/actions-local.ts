import { useActionsTracker, type DoActionOptions } from "./actions-tracker.ts"
import { StorePathOptions, useStoreDefinition } from "./stores.ts"

export interface DeleteOptions extends StorePathOptions, DoActionOptions {
    id?: string
    nav: string
}

export function useLocalActions() {
    const { actionErrorMsg, actionLoadingMsg, clearErrors, isLoading, doAction, logError } = useActionsTracker(
    {
        stringifyError: (err: any) => {
            if (typeof err == 'object') {
                return err.message
            }

            return err?.toString()
        }
    })

    function deleteItem(doOptions: DeleteOptions) {
        doOptions.useLocalCache ??= true
        const store = useStoreDefinition({ nav: doOptions.nav })

        return doAction(async () => {
            const err = await store().deleteItem(doOptions)

            logError(err)

            return undefined
        }, doOptions)
    }

    return {
        actionErrorMsg,
        actionLoadingMsg,
        clearErrors,
        deleteItem,
        isLoading
    }
}