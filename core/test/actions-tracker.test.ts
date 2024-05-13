import { useActionsTracker } from '../src/composables/actions-tracker'
import { describe, expect, test } from 'vitest'
import { twiddleThumbs } from '../src/composables/helpers'

describe("basic tests", () => {

    test('basic functionality', async () => {
        const { actionErrorMsg, actionLoadingMsg, actionCompleteMsg, clearErrors, doAction, isLoading, logError } = useActionsTracker({
            completionMsg: 'complete',
            confirmationMsg: 'confirm',
            errorMsg: 'error',
            loadingMsg: 'lo',
            throwError: false
        })

        expect(actionErrorMsg.value).toBeUndefined()
        expect(actionLoadingMsg.value).toBeUndefined()
        expect(actionCompleteMsg.value).toBeUndefined()

        logError('test error')

        expect(actionErrorMsg.value).toEqual('test error')
        clearErrors()
        expect(actionErrorMsg.value).toBeUndefined()

        await doAction(async () => {
            let act = true
            expect(actionLoadingMsg.value).toEqual('lo')
            do {
                throw new Error('mm')
            } while (act);
        })

        expect(actionErrorMsg.value).toEqual('error')
        expect(actionLoadingMsg.value).toBeUndefined()
        expect(actionCompleteMsg.value).toBeUndefined()

        await doAction(async () => {
            let act = true
            expect(actionLoadingMsg.value).toEqual('lo')
            do {
                act = false
            } while (act);
        })

        // expect(actionErrorMsg.value).toBeUndefined()
        expect(actionLoadingMsg.value).toBeUndefined()
        expect(actionCompleteMsg.value).toBeUndefined()
    })

    test('throws error', async () => {
        const { actionErrorMsg, actionLoadingMsg, actionCompleteMsg, clearErrors, doAction, isLoading, logError } = useActionsTracker({
            completionMsg: 'complete',
            confirmationMsg: 'confirm',
            errorMsg: 'error',
            throwError: true
        })

        const res = await doAction(async () => {
            let act = true
            expect(actionLoadingMsg.value).toEqual('loading')
            do {
                throw new Error('mm')
            } while (act);
        })

        expect(res).toBeUndefined()
    })
})