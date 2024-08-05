import { useAuth } from "./auth.ts"
import { appendUrl, isLengthyArray, isNullOrEmpty } from "./helpers.ts"
import { computed, ref } from 'vue'
import * as cronjsMatcher from '@datasert/cronjs-matcher'

export const hourOptions = [
  { text: '12:00 AM', value: '0' },
  { text: '1:00 AM', value: '1' },
  { text: '2:00 AM', value: '2' },
  { text: '3:00 AM', value: '3' },
  { text: '4:00 AM', value: '4' },
  { text: '5:00 AM', value: '5' },
  { text: '6:00 AM', value: '6' },
  { text: '7:00 AM', value: '7' },
  { text: '8:00 AM', value: '8' },
  { text: '9:00 AM', value: '9' },
  { text: '10:00 AM', value: '10' },
  { text: '11:00 AM', value: '11' },
  { text: '12:00 PM', value: '12' },
  { text: '1:00 PM', value: '13' },
  { text: '2:00 PM', value: '14' },
  { text: '3:00 PM', value: '15' },
  { text: '4:00 PM', value: '16' },
  { text: '5:00 PM', value: '17' },
  { text: '6:00 PM', value: '18' },
  { text: '7:00 PM', value: '19' },
  { text: '8:00 PM', value: '20' },
  { text: '9:00 PM', value: '21' },
  { text: '10:00 PM', value: '22' },
  { text: '11:00 PM', value: '23' }
]

export const monthOptions = [
    { text: 'Jan', value: '1' },
    { text: 'Feb', value: '2' },
    { text: 'Mar', value: '3' },
    { text: 'Apr', value: '4' }, 
    { text: 'May', value: '5' },
    { text: 'Jun', value: '6' },
    { text: 'Jul', value: '7' },
    { text: 'Aug', value: '8' },
    { text: 'Sep', value: '9' },
    { text: 'Oct', value: '10' },
    { text: 'Nov', value: '11' },
    { text: 'Dec', value: '12' }
]
export const weekOptions = [
    { text: '1st', value: '1-7' },
    { text: '2nd', value: '8-14' },
    { text: '3rd', value: '15-21' },
    { text: '4th', value: '22-28' },
    { text: '5th', value: '29-31' }
]
export const weekdayOptions = [
    { text: 'Sun', value: '0' },
    { text: 'Mon', value: '1' },
    { text: 'Tue', value: '2' },
    { text: 'Wed', value: '3' },
    { text: 'Thu', value: '4' },
    { text: 'Fri', value: '5' },
    { text: 'Sat', value: '6' }]

export type CronRegularity = 'Daily' | 'Weekly' | 'Monthly' | 'Custom'

export const regularityOptions = [
  { text: 'Daily', value: 'Daily' },
  { text: 'Weekly', value: 'Weekly' },
  { text: 'Monthly', value: 'Monthly' },
  { text: 'Custom', value: 'Custom' }
]

export interface UseCronOptions {
    defaultExpression?: string
    /**defaults to minutes */
    useLeadTimeInHours?: boolean
    useLeadTimeLeft?: boolean
    useLeadTimeRight?: boolean,
    value?: string
}

export interface PredictOptions {
    adjustments?: string
    futureCount: number,
    cron?: string
}

export function useCronPredictor() {
    const { timeZone } = useAuth()

    function predictFuture(options: PredictOptions) {
        if (options.cron == null) {
            return []
        }
        // return cronExpression.value?.split(/\s+/)
        const baseCron = options.cron.split(/\s+/).slice(0, 5).join(' ')

        return cronjsMatcher.getFutureMatches(baseCron, { matchCount: options.futureCount, formatInTimezone: false, timezone: timeZone.value })
    }

    return {
        predictFuture
    }
}

export function useCron(options: UseCronOptions) {

    function getDefaultExpression() {
        let exp = '0 0 * * 1'

        if (options.useLeadTimeLeft) {
            if (options.useLeadTimeRight)
                exp = appendUrl(exp, `${filteredLeadTimeLeft.value.toString()}-${filteredLeadTimeRight.value.toString()}`, ' ')
            else
                exp = appendUrl(exp, filteredLeadTimeLeft.value.toString(), ' ')
        }

        return exp
    }

    const cronExpression = ref<string>()

    let mRawExpression: string | undefined = ''
    const rawExpression = computed({
        get() {
            return cronExpression.value
        },
        set(value) {
            mRawExpression = value
        }
    })

    const leadTimeLeft = ref<number>(0)
    const leadTimeRight = ref<number>(0)

    const mRegularity = ref<CronRegularity>('Custom')
    const regularity = computed({
        get() {
            return mRegularity.value
        },
        set(v) {
            if (mRegularity.value !== v) {
                mRegularity.value = v
                applyRegularity(v)
            }
        }
    })

    const filteredLeadTimeLeft = computed(() => options.useLeadTimeInHours ? leadTimeLeft.value * 60 : leadTimeLeft.value)
    const filteredLeadTimeRight = computed(() => options.useLeadTimeInHours ? leadTimeRight.value * 60 : leadTimeRight.value)

    const hour = ref<string>()
    const months = ref<string[]>()
    const weeks = ref<string[]>()
    const weekdays = ref<string[]>()

    function applyRawExpression() {
        unpack(mRawExpression ?? rawExpression.value)
    }

    function applyRegularity(v: any) {
        if (v == 'Daily') {
            months.value = ['*']
            weeks.value = ['*']
            weekdays.value = ['*']
        }
        else if (v == 'Weekly') {
            months.value = ['*']
            weeks.value = ['*']
            weekdays.value = ['0']
        }
        else if (v == 'Monthly') {
            months.value = ['*']
            weeks.value = [weekOptions[0].value]
            weekdays.value = [weekdayOptions[0].value]
        }
    }

    function getCronSplit() {
        return cronExpression.value?.split(/\s+/)
    }

    function unpack(exp?: string) {
        if (cronExpression.value != exp) {
            //if changed, then reunpack
            cronExpression.value = exp
            let isCustom = false
            let everyWeek = false
            let everyWeekday = false
            let everyMonth = false

            if (isNullOrEmpty(cronExpression.value) || !isLengthyArray(getCronSplit(), 4)) {
                isCustom = true
            }
            else {
                const cronSplit = getCronSplit()!
                isCustom = false

                //unpack hours
                const secondStr = cronSplit[1]
                if (secondStr.includes(',') || secondStr.includes('-') || secondStr.includes('/')) {
                    isCustom = true
                }
                else {
                    if (!hourOptions.some(x => x.value == secondStr)) {
                        isCustom = true
                    }
                    else {
                        hour.value = secondStr
                    }
                }

                //unpack days
                const dayStr = cronSplit[2]
                if (dayStr.includes('/')) {
                    isCustom = true
                }
                else if (dayStr == '*') {
                    everyWeek = true
                }
                else {
                    everyWeek = false

                    const daySplit = dayStr.split(',')
                    if (daySplit.some((x: string) => !weekOptions.some(y => y.value == x))) {
                        isCustom = true
                    }
                    else {
                        weeks.value = daySplit
                    }
                }

                //unpack months
                const monthStr = cronSplit[3]
                if (monthStr.includes('-') || monthStr.includes('/')) {
                    isCustom = true
                }
                else if (monthStr == '*') {
                    everyMonth = true
                }
                else {
                    everyMonth = false

                    const monthSplit = monthStr.split(',')
                    if (monthSplit.some(x => !monthOptions.some(y => y.value == x)))
                        isCustom = true
                    else
                        months.value = monthSplit
                }

                //unpack weekdays
                const wkStr = cronSplit[4]
                if (wkStr.includes('-') || wkStr.includes('/')) {
                    isCustom = true
                }
                else if (wkStr == '*') {
                    everyWeekday = true
                    weekdays.value = weekdayOptions.map(x => x.value)
                }
                else {
                    everyWeekday = false

                    const wkSplit = wkStr.split(',')
                    if (wkSplit.some(x => !weekdayOptions.some(y => y.value == x))) {
                        isCustom = true
                    }
                    else {
                        weekdays.value = wkSplit
                    }
                }

                //unpack lead time
                if (isLengthyArray(cronSplit, 5)) {
                    if (options.useLeadTimeLeft) {
                        const ltSplit = cronSplit[5].split('-')
                        if (options.useLeadTimeRight) {
                            if (ltSplit.length > 1) {
                                const rightNum = Number.parseInt(ltSplit[1])
                                leadTimeRight.value = options.useLeadTimeInHours ? Math.round(rightNum / 60) : rightNum
                            }
                        }

                        if (ltSplit.length > 0) {
                            const leftNum = Number.parseInt(ltSplit[0])
                            leadTimeLeft.value = options.useLeadTimeInHours ? Math.round(leftNum / 60) : leftNum
                        }
                    }
                }
            }

            if (isCustom) {
                regularity.value = 'Custom'
            }
            else if (everyMonth && everyWeek && everyWeekday) {
                mRegularity.value = 'Daily'
            }
            else if (everyMonth && everyWeek) {
                mRegularity.value = 'Weekly'
            }
            else if (everyMonth) {
                mRegularity.value = 'Monthly'
            }
            else {
                mRegularity.value = 'Custom'
            }
        }

        return {
            applyRawExpression,
            applyRegularity,
            cronExpression,
            hour,
            leadTimeLeft,
            leadTimeRight,
            months,
            pack,
            rawExpression,
            regularity,
            unpack,
            weekdays,
            weeks
        }
    }

    function pack(): string | undefined {
        if (regularity.value == 'Custom')
            return cronExpression.value

        let exp = '0'

        exp = appendUrl(exp, hour.value, ' ')

        if (!isLengthyArray(weeks.value))
            exp = appendUrl(exp, '*', ' ')
        else
            exp = appendUrl(exp, weeks.value?.toString(), ' ')

        if (!isLengthyArray(months.value))
            exp = appendUrl(exp, '*', ' ')
        else
            exp = appendUrl(exp, months.value?.toString(), ' ')

        if (weekdays.value?.length == 7)
            exp = appendUrl(exp, '*', ' ')
        else
            exp = appendUrl(exp, weekdays.value?.toString(), ' ')

        exp = appendUrl(exp, `${filteredLeadTimeLeft.value}-${filteredLeadTimeRight.value}`, ' ')

        cronExpression.value = exp

        return cronExpression.value
    }

    unpack(options.value ?? options.defaultExpression ?? getDefaultExpression())

    return {
        applyRawExpression,
        applyRegularity,
        cronExpression,
        hour,
        leadTimeLeft,
        leadTimeRight,
        months,
        pack,
        rawExpression,
        regularity,
        unpack,
        weekdays,
        weeks
    }
}