import { DateTime } from 'luxon'

export interface BTDates {
    getToday: () => string
    getTomorrow: () => string
    tzDate: (val?: string, fromFormat?: string) => DateTime
    tzString: (val?: string, format?: string, fromFormat?: string) => string
    utcDate: (val?: string, fromFormat?: string) => DateTime
    utcString: (val?: string, format?: string, fromFormat?: string) => string
}

export interface CreateDatesOptions {
  getTimeZone: () => string
}
 
export function createDates(options: CreateDatesOptions): BTDates {

    function getToday(): string {
        return tzDate()?.startOf('day').toUTC().toString() ?? '';
    }

    function getTomorrow(): string {
        return tzDate()?.endOf('day').toUTC().toString() ?? '';
    }

    function tzDate(val?: string, fromFormat?: string): DateTime {
        if (val == null) {
            //create now
            return DateTime.utc().setZone(options.getTimeZone())
        }

        return fromFormat ? DateTime.fromFormat(val, fromFormat, { zone: options.getTimeZone() }) : DateTime.fromISO(val, { zone: options.getTimeZone() })
    }

    function tzString(val?: string, format?: string, fromFormat?: string): string {
        if (val == null) {
            //create now
            const d = DateTime.utc().setZone(options.getTimeZone())
            return format ? d.toFormat(format) : d.toString()
        }

        if (val == 'Invalid DateTime') {
            return ''
        }

        const d = fromFormat ? DateTime.fromFormat(val, fromFormat, { zone: options.getTimeZone() }) : DateTime.fromISO(val, { zone: options.getTimeZone() })
        
        return format ? d.toFormat(format) : d?.toString()
    }

    function utcDate(val?: string, fromFormat?: string): DateTime {
        if (val == null) {
            return DateTime.utc()
        }
        else {
            return fromFormat ? DateTime.fromFormat(val, fromFormat) : DateTime.fromISO(val)
        }
    }

    function utcString(val?: string, format?: string, fromFormat?: string): string {
        if (val == null) {
            return format ? DateTime.utc().toFormat(format) : DateTime.utc().toString()
        }
        else {
            const d = fromFormat ? DateTime.fromFormat(val, fromFormat) : DateTime.fromISO(val)
            return format ? d.toFormat(format) : d.toString()
        }
    }

    return {
        getToday,
        getTomorrow,
        tzDate,
        tzString,
        utcDate,
        utcString
    }
}