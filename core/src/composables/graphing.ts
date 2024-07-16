import { group, nestedValue } from './helpers.ts'
import { BTDates, useDates } from './dates.ts'
import { useFilters } from './filters.ts'

export interface GetRawXYOptions<T> {
    list: T[]
    getXAxis?: (item: T) => string | number
    getXLabel?: (item: string | number) => string
    xProp?: string
    getYValue?: (item: T) => number
    getYGroupValue?: (items: T[]) => number
    yProp?: string
}

export interface GetXYOptions<T> extends GetRawXYOptions<T> {
    fillGaps?: boolean
    list: T[]
    /**can be a filter or a time format */
    xLabelFilter?: string
    xSpan: 'hour' | 'day' | 'week' | 'month' | 'year'
    xSpanProp: string | ((item: T) => string)
}

export interface GraphedData {
    xValue: string | number,
    xLabel?: string | number,
    yValue: number
}

export interface UseGraphingOptions {
    dates?: BTDates
}

export function useGraphing(useOptions?: UseGraphingOptions) {
    const tzDate = useOptions?.dates?.tzDate ?? useDates().tzDate
    const filters = useFilters()

    function getXY<T>(options: GetXYOptions<T>) {
        let rList: GraphedData[] = []
        const filter = filters.findFilter(options.xLabelFilter)

        rList = getRawXY({
            ...options,
            getXAxis: (item: T) => {
                const xVal = typeof options.xSpanProp == 'string' ? nestedValue(item, options.xSpanProp) : options.xSpanProp(item)
                const res = filter(xVal)

                if (res == null)
                    return tzDate(xVal).startOf(options.xSpan).toFormat(options.xLabelFilter ?? '')

                return res
            }
        })

        if (options.fillGaps)
            rList = rList

        return rList
    }

    function getRawXY<T>(options: GetRawXYOptions<T>) {
        if (options.getXAxis == null && options.xProp == null)
            return []

        if (options.getYGroupValue == null && options.getYValue == null && options.yProp == null)
            return []

        const xList = group<T>(options.list, options.getXAxis ?? options.xProp!)
        const rList: GraphedData[] = []

        xList.forEach((value: any, key: any) => {
            if (options.getYGroupValue != null) {
                rList.push({
                    xValue: key,
                    xLabel: options.getXLabel != null ? options.getXLabel(key) : undefined,
                    yValue: options.getYGroupValue(value)
                })
            }
            else {
                const yItem = {
                    xValue: key,
                    xLabel: options.getXLabel != null ? options.getXLabel(key) : undefined,
                    yValue: 0
                }

                rList.push(yItem)

                if (options.getYValue != null) {
                    value.forEach((v: any) => {
                        yItem.yValue += (options.getYValue!(v))
                    })
                }
                else if (options.yProp != null) {
                    value.forEach((v: any) => {
                        yItem.yValue += (v[options.yProp!] as number)
                    })
                }
            }
        })

        return rList
    }

    return {
        getRawXY,
        getXY
    }
}