import { computed, ref } from 'vue'
import { isLengthyArray, isNullOrEmpty, isSameDownToHour } from './helpers.ts'
import { BTDateFormat, useDates } from './dates.ts'
import { useAuth } from './auth.ts'
import * as cronjsMatcher from '@datasert/cronjs-matcher'
import { firstBy } from 'thenby'

export interface Adjustment {
    dateTrigger: string
    isAdjusting?: boolean
    leadTimeLeft: number
    leadTimeRight: number
    replacingDate?: string
    //non-saveable
    isInSchedule?: boolean
    leadLeftDate?: string
    leadRightDate?: string
}

export interface UseCronAdjustmentsOptions {
    adjustmentString?: string
    cronExpression?: string
    useLeadTimeInHours?: boolean
}

export function useCronAdjustments(options: UseCronAdjustmentsOptions) {
    const { tzDate, utcDate } = useDates()
    const { timeZone } = useAuth()
    const adjustments = ref<Adjustment[]>([])
    const adjustmentsString = ref<string>()
    const cronExpression = ref<string>()

    /**only requires dateTrigger, replacingDate, leadLeftDate, leadRightDate */
    function applyAdjustment(data: Adjustment) {
        const adj = adjustments.value.find(z => z.dateTrigger == data.dateTrigger)

        if (adj != null && data.replacingDate != null && data.leadLeftDate != null) {
            const diffMins = utcDate(data.leadLeftDate).diff(utcDate(data.replacingDate), 'minutes')
            if (diffMins.minutes >= 0) {
                adj.replacingDate = data.replacingDate
                adj.isAdjusting = true
                adj.leadTimeLeft = diffMins.minutes
                adj.leadLeftDate = data.leadLeftDate

                const diffRightMins = utcDate(data.leadRightDate).diff(utcDate(data.replacingDate), 'minutes')
                if (diffRightMins.minutes >= 0) {
                    adj.leadTimeRight = diffRightMins.minutes
                    adj.leadRightDate = data.leadRightDate
                }
            }
        }

        if (adj != null && data.leadLeftDate == null) {
            adj.leadTimeLeft = 0
            adj.leadLeftDate = undefined
            adj.leadTimeRight = 0
            adj.leadRightDate = undefined
        }

        if (adj != null && data.leadRightDate == null) {
            adj.leadTimeRight = 0
            adj.leadRightDate = undefined
        }

        //update?
    }

    function cancelAdjustment(adj: Adjustment) {
        if (adj != null) {
            adj.replacingDate = undefined
            adj.isAdjusting = true
        }

        return adj
    }

    function getCronExpressionFrom(cronExp?: string) {
        if (cronExp == null)
            return cronExp

        const split = cronExp.split(/\s+/).slice(0, 5)

        if (split[2] == '*')
            split[2] = '?'

        return split.join(' ')
    }

    function stringifyAdjustment(adj: Adjustment) {
        return `${adj.dateTrigger}|${adj.replacingDate ?? ''}|${adj.leadTimeLeft.toString()}-${adj.leadTimeRight.toString()}`
    }

    //filters to valid adjustments and stringifies them
    function stringifyAdjustments(adjustments: Adjustment[]) {
        if (!isLengthyArray(adjustments))
            return undefined

        return adjustments
            .filter(x => x.isAdjusting == true)
            .map(x => stringifyAdjustment(x))
            .filter(x => x != null && !x.includes('undefined'))
            .toString()
    }

    function undoAdjustment(adj: Adjustment) {
        adj.replacingDate = undefined
        adj.isAdjusting = false

        //reupdate?
    }

    function unpackAdjustmentFrom(adjStr?: string): Adjustment | undefined {
        if (!isNullOrEmpty(adjStr)) {
            if (adjStr?.includes('undefined'))
                return undefined

            const adjSplit = adjStr?.split('|')

            if (isLengthyArray(adjSplit, 2)) {
                let leftLead = 0
                let rightLead = 0
                let leadSplit = adjSplit![2].split('-')

                if (leadSplit.length > 0)
                    leftLead = Number.parseInt(leadSplit[0])

                if (leadSplit.length > 1)
                    rightLead = Number.parseInt(leadSplit[1])

                let replacingDate = adjSplit![1].length > 1 ? adjSplit![1] : undefined

                return {
                    dateTrigger: adjSplit![0],
                    isAdjusting: true,
                    leadTimeLeft: leftLead,
                    leadTimeRight: rightLead,
                    replacingDate: replacingDate,
                    //other props
                    isInSchedule: false,
                    leadLeftDate: replacingDate != null ? tzDate(replacingDate).plus({ minutes: leftLead }).toFormat(BTDateFormat) : undefined
                    // replacingTime: replacingDate != null ? tzString(replacingDate, 'HH:mm') : '00:00',
                    // leadDateLeft: replacingDate != null ? utcDate(replacingDate).plus({ minutes: leftLead }) : undefined,
                    // leadDateRight: replacingDate != null ? utcDate(replacingDate).plus({ minutes: rightLead }) : undefined
                }
            }
        }

        return undefined
    }

    function unpackAdjustmentsFrom(adjStr?: string): Adjustment[] {
        const adjList: Adjustment[] = []
        if (adjStr != null) {
            let adjSplit = adjStr.split(',')
            adjSplit.forEach((str: string) => {
                const adj = unpackAdjustmentFrom(str)
                if (adj != null)
                    adjList.push(adj)
            })
        }

        return adjList
    }

    function unpack(adjString?: string, cronExp?: string) {
        //unpack adjustment string
        let adjList: Adjustment[] = []
    
        adjustmentsString.value = adjString ?? ''
        adjList = unpackAdjustmentsFrom(adjustmentsString.value)
    
        cronExpression.value = cronExp
        const cron = getCronExpressionFrom(cronExp)
        if (cron != null) {
            const future = cronjsMatcher.getFutureMatches(cron, { matchCount: 2, formatInTimezone: false, timezone: timeZone.value })
            future.forEach((f: string) => {
                // let futureDate = utcString(f)
                let existing = adjList.find(x => isSameDownToHour(x.dateTrigger, f))
                if (existing == null) {
                    adjList.push({
                        dateTrigger: f,//futureDate,
                        isAdjusting: false,
                        leadTimeLeft: 0,
                        leadTimeRight: 0,
                        replacingDate: undefined,
                        //other props
                        isInSchedule: true,
                        leadLeftDate: undefined
                    })
                }
                else {
                    existing.isInSchedule = true
                }
            })
        }

        adjList.sort(firstBy(x => x.dateTrigger))

        adjustments.value = adjList

        return adjustments.value
    }

    unpack(options.adjustmentString, options.cronExpression)

    return {
        adjustments,
        adjustmentsString,
        applyAdjustment,
        cancelAdjustment,
        filteredAdjustments: computed(() => adjustments.value.filter(z => z.isAdjusting)),
        stringifyAdjustments,
        stringify: () => { 
            adjustmentsString.value = stringifyAdjustments(adjustments.value)
            return adjustmentsString.value
        },
        undoAdjustment,
        unpack,
    }
}