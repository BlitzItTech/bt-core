import { describe, test, expect } from 'vitest'
import { useGraphing } from '../src/composables/graphing'
import { createDates } from '../src/composables/dates'

describe('default graphing', () => {
    const dates = createDates({
        getTimeZone: () => 'Australia/Melbourne'
    })
    const { getRawXY, getXY } = useGraphing({ dates })

    const data = [
        { a: 'a', b: 1 },
        { a: 'b', b: 1 },
        { a: 'c', b: 1 },
        { a: 'b', b: 1 },
        { a: 'a', b: 1 }
    ]

    test('raw xy', () => {
        let res = getRawXY({
            list: data,
            xProp: 'a',
            yProp: 'b'
        })

        expect(res).toEqual([
            { xValue: 'a', yValue: 2 },
            { xValue: 'b', yValue: 2 },
            { xValue: 'c', yValue: 1 }
        ])

        res = getRawXY({
            list: data,
            getXAxis: (item: any) => item.a,
            getYValue: (item: any) => item.b
        })

        expect(res).toEqual([
            { xValue: 'a', yValue: 2 },
            { xValue: 'b', yValue: 2 },
            { xValue: 'c', yValue: 1 }
        ])

        res = getRawXY({
            list: data,
            getXAxis: (item: any) => item.a,
            getYGroupValue: (items: any) => items.length
        })

        expect(res).toEqual([
            { xValue: 'a', yValue: 2 },
            { xValue: 'b', yValue: 2 },
            { xValue: 'c', yValue: 1 }
        ])
    })

    const dateData = [
        { d: dates.getToday(), e: 2 },
        { d: dates.getTomorrow(), e: 2 },
        { d: dates.getToday(), e: 2 },
        { d: dates.getToday(), e: 2 }
    ]


    // test('xy', () => {
    //     let res = getXY({
    //         list: dateData,
    //         xSpan: 'day',
    //         fillGaps: false,
    //         xSpanProp: x => x.d,
    //         yProp: 'e'
    //     })

    //     expect(res).toEqual([
    //         { xValue: dates.getToday(), yValue: 6 },
    //         { xValue: dates.getTomorrow(), yValue: 2 }
    //     ])
    // })

})