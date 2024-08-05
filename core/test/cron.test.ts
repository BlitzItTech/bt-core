import { describe, test, expect } from 'vitest'
import { useCron, useCronPredictor } from '../src/composables/cron'
import { withSetup } from './utils'
import { createAuth } from '../src/composables/auth'

describe('default cron', () => {
    const cron = useCron({
        // defaultExpression: '0 0 * * 0'
    })

    // test('normal', () => {
    //     expect(cron.regularity.value).toEqual('Custom')

    //     const res = cron.unpack('0 0 * * 0 0-0')

    //     expect(res.everyMonth.value).toEqual(true)
    //     expect(res.everyWeek.value).toEqual(true)
    //     expect(res.everyWeekday.value).toEqual(false)
    //     expect(res.hour.value).toEqual(0)

    //     cron.unpack('0 6 * * 0 0-0')

    //     expect(res.everyMonth.value).toEqual(true)
    //     expect(res.everyWeek.value).toEqual(true)
    //     expect(res.everyWeekday.value).toEqual(false)
    //     expect(res.hour.value).toEqual(6)

    //     cron.unpack('0 6 * * * 0-0')

    //     expect(res.everyMonth.value).toEqual(true)
    //     expect(res.everyWeek.value).toEqual(true)
    //     expect(res.everyWeekday.value).toEqual(true)
    //     expect(res.hour.value).toEqual(6)
    // })

})

describe('default cron predictor', () => {
    const [{ auth }] = withSetup(() => {
        const auth = createAuth({})

        return {
            auth
        }
    })

    const pred = useCronPredictor()

    test('normal', () => {
        const e = pred.predictFuture({ cron: '0 0 * * 0 0-0', futureCount: 2 })
        expect(e).toBeNull()
    })
})