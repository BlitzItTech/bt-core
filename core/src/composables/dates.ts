import { DateTime } from 'luxon'

export interface BTDates {
    /**returns start of day */
    getToday: () => string
    /**returns start of tomorrow */
    getTomorrow: () => string
    /**returns current datetime in tz format */
    tzDate: (val?: string, fromFormat?: string) => DateTime
    tzString: (val?: string, format?: string, fromFormat?: string) => string
    utcDate: (val?: string, fromFormat?: string) => DateTime
    utcString: (val?: string, format?: string, fromFormat?: string) => string
}

export interface CreateDatesOptions {
  getTimeZone: () => string
  getUTC?: () => DateTime
}

let current: BTDates
 
export function useDates(): BTDates {
    return current
}

export function createDates(options: CreateDatesOptions): BTDates {
    const getUtc = options.getUTC ?? DateTime.utc

    function getToday(): string {
        return tzDate().startOf('day').toUTC().toString() ?? '';
    }

    function getTomorrow(): string {
        return tzDate().startOf('day').plus({ day: 1 }).toUTC().toString() ?? '';
        // return tzDate().endOf('day').toUTC().toString() ?? '';
    }

    function tzDate(val?: string, fromFormat?: string): DateTime {
        if (val == null) {
            //create now
            return getUtc().setZone(options.getTimeZone())
        }

        return fromFormat ? DateTime.fromFormat(val, fromFormat, { zone: options.getTimeZone() }) : DateTime.fromISO(val, { zone: options.getTimeZone() })
    }

    function tzString(val?: string, format?: string, fromFormat?: string): string {
        if (val == null) {
            //create now
            const d = getUtc().setZone(options.getTimeZone())
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
            return getUtc()
        }
        else {
            return fromFormat ? DateTime.fromFormat(val, fromFormat) : DateTime.fromISO(val)
        }
    }

    function utcString(val?: string, format?: string, fromFormat?: string): string {
        if (val == null) {
            return format ? getUtc().toFormat(format) : getUtc().toString()
        }
        else {
            const d = fromFormat ? DateTime.fromFormat(val, fromFormat) : DateTime.fromISO(val)
            return format ? d.toFormat(format) : d.toString()
        }
    }

    current = {
        getToday,
        getTomorrow,
        tzDate,
        tzString,
        utcDate,
        utcString
    }

    return current
}