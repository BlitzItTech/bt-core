import { DurationUnit } from 'luxon'
import { getLocationLine, getLocationLineOne, getLocationLineTwo, isMinDate } from '../composables/helpers.ts'
import { BTAuth } from './auth.ts'
import { BTDates } from './dates.ts'
import { BTDemo } from './demo.ts'

export interface BTFilters {
    findFilter: (mFilter: string | undefined) => Function
}

export interface UseFiltersOptions {
    auth: BTAuth,
    dates: BTDates,
    demo: BTDemo,
    filters?: any
}

let current: BTFilters

export function useFilters(): BTFilters {
    if (current == null)
        return {
            findFilter: () => { return () => {} }
        }

    return current
}

export function createFilters(options: UseFiltersOptions): BTFilters {
    const customFilters = options.filters ?? {}

    function toTimeZoneFormat(value?: string, format?: string, placeholder?: string): string {
        if (!value)
            return placeholder ?? value ?? '';
    
        if (isMinDate(value))
            return placeholder ?? '';

        return options.dates.tzString(value, format)
    }

    function toCompanyNameAndLocationLine(value: object | null | any): string {
        if (!value) {
            return '';
        }
    
        if (typeof value !== 'object') {
            return value;
        }
        
        var rStr = '';
    
        if (value.companyAccount != null) {
            rStr = value.companyAccount.companyName + ' | ';
        }
        
        if (value.addressLineOne != null) {
            rStr = rStr +  value.addressLineOne + ' ';
        }
        if (value.streetNumber != null) {
            rStr = rStr + value.streetNumber + ' ';
        }
        if (value.streetName != null) {
            rStr = rStr + value.streetName + ', ';
        }
        if (value.suburb != null) {
            rStr = rStr + value.suburb + ' ';
        }
        if (value.state != null) {
            rStr = rStr + value.state + ' ';
        }
        if (value.postcode != null) {
            rStr = rStr + value.postcode;
        }
        
        return rStr;
    }

    function toCurrency(val: any): string {
        if (typeof val !== 'number') {
            return val;
        }

        var formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 2
        });

        return formatter.format(val);
    }

    function toDayDate(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc | d LLL', placeholder)
    }

    function toDayMonth(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'd LLL', placeholder)
    }

    function toDayOfWeek(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc', placeholder);
    }

    function toDayShortDate(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc dd LLL yyyy', placeholder);
    }

    function toDayShortDateAndTime(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc dd LLL @ hh:mm a', placeholder);
    }

    function toDisplayNumber(val: number): string {
        return new Intl.NumberFormat().format(val);
    }

    function toDisplayNumberOver(val: number): string {
        if (val == 0) {
            return '';
        }

        return new Intl.NumberFormat().format(val);
    }

    function toDisplayNumberSigned(val: number): string {
        if (val == 0) {
            return '';
        }

        var r = new Intl.NumberFormat().format(val);

        if (val > 0) {
            return '+' + r;
        }
        else {
            return r;
        }
    }

    function toFormat(val?: string, format?: string) {
        return options.dates.utcString(val, format);
    }

    function toFamiliarLocationLine(val: any): string {
        if (!val)
            return ''

        if (typeof val !== 'object')
            return val

        let companyID: string = options.demo.isDemoing.value ? 'comp1' : options.auth.credentials.value.companyAccountID

        if (val.companyAccountID == companyID)
            return val.locationName

        let rStr = ''

        if (val.companyAccount != null)
            rStr = `${rStr}${val.companyAccount.companyName} | `

        if (val.addressLineOne != null)
            rStr = `${rStr}${val.addressLineOne} `

        if (val.streetNumber != null)
            rStr = `${rStr}${val.streetNumber} `

        if (val.streetName != null)
            rStr = `${rStr}${val.streetName}, `

        if (val.suburb != null)
            rStr = `${rStr}${val.suburb} `

        if (val.state != null)
            rStr = `${rStr}${val.state} `

        if (val.postcode != null)
            rStr = `${rStr}${val.postcode}`

        return rStr
    }

    function toLocationLine(val: any): string {
        return getLocationLine(val, false);
    }

    function toLocationLineOne(val: any): string {
        return getLocationLineOne(val);
    }

    function toLocationLineTwo(val: any): string {
        return getLocationLineTwo(val);
    }

    function toLocationLineNoCommas(value: any): string {
        if (!value) {
            return '';
        }
    
        if (typeof value !== 'object') {
            return value;
        }    
        
        var rStr = '';
    
        if (value.addressLineOne != null) {
            rStr = value.addressLineOne + ' ';
        }
        if (value.streetNumber != null) {
            rStr = rStr + value.streetNumber + ' ';
        }
        if (value.streetName != null) {
            rStr = rStr + value.streetName + ' ';
        }
        if (value.suburb != null) {
            rStr = rStr + value.suburb + ' ';
        }
        if (value.state != null) {
            rStr = rStr + value.state + ' ';
        }
        if (value.postcode != null) {
            rStr = rStr + value.postcode;
        }
        
        rStr = rStr.replaceAll(',', ' ');
    
        return rStr;
    }

    function toLongDate(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc dd LLL yyyy', placeholder);
    }

    function toLongDateAndTime(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'ccc dd LLL yyyy hh:mm a', placeholder);
    }

    function toPercent(val: number): string {
        var formatter = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2
        });

        return formatter.format(val);
    }

    function toPrettyCSV(val: string): string {
        return val.replaceAll(',', ' ');
    }

    function toShortDate(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'dd LLL yyyy', placeholder);
    }

    function toShortDateAndTime(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'dd LLL yyyy hh:mm a', placeholder);
    }

    function toTime(value?: string, placeholder?: string): string {
        return toTimeZoneFormat(value, 'hh:mm a', placeholder);
    }

    function toTimeOfDay(val?: string | number): string {
        if (val == null) {
            return '';
        }

        if (typeof val == 'number') {
            return options.dates.tzDate().startOf('day').plus({ minutes: val }).toFormat('T')
        }
        else if (typeof val == 'string') {
            return options.dates.tzString(val, 't')
        }
        else {
            return 'unknown';
        }
    }

    function toTimeSpan(val?: string, spanName?: DurationUnit): string {
        var d = options.dates
        if (spanName != null)
            return d.utcDate().diff(d.btDate(val), spanName).toString() ?? ''
        else {
            var dif = d.btDate(val).diff(d.utcDate(), ['months','days','hours','minutes','seconds']).toObject();

            var str = '';

            if (dif.months != null && dif.months > 0) {
                return `${dif.months} ${dif.months == 1 ? 'month ' : 'months '}`;
            }
            if (dif.days != null && dif.days > 0) {
                return `${str} ${dif.days} ${dif.days == 1 ? 'day ' : 'days '}`;
            }
            if (dif.hours != null && dif.hours > 0) {
                str = `${str} ${dif.hours} ${dif.hours == 1 ? 'hour ' : 'hours '}`;
            }
            if (dif.minutes != null && dif.minutes > 0) {
                str = `${str} ${dif.minutes} ${dif.minutes == 1 ? 'minute ' : 'minutes '}`;
            }
            return str;
        }
    }

    const e = {
        toCompanyNameAndLocationLine,
        toCurrency,
        toDayDate,
        toDayMonth,
        toDayOfWeek,
        toDayShortDate,
        toDayShortDateAndTime,
        toDisplayNumber,
        toDisplayNumberOver,
        toDisplayNumberSigned,
        toFamiliarLocationLine,
        toFormat,
        toLocationLine,
        toLocationLineOne,
        toLocationLineTwo,
        toLocationLineNoCommas,
        toLongDate,
        toLongDateAndTime,
        toPercent,
        toPrettyCSV,
        toShortDate,
        toShortDateAndTime,
        toTime,
        toTimeOfDay,
        toTimeSpan,
        ...customFilters
    }

    function findFilter(mFilter?: string): Function {
        if (mFilter != null) {
            let filter = mFilter as keyof typeof e
            if (filter != null && e[filter] != null) {
                return e[filter] as Function
            }
        }

        return (v: any) => v
    }

    current = {
        findFilter,
        ...e
    }

    return current
}

// export type Textfilter = 'toFamiliarLocationLine' | 'toLocationLine' | 'toLocationLineNoCommas' | 'toLongDate' | 'toLongDateAndTime' | 'toPercent' | 'toPrettyCSV' | 'toShortDate' | 'toShortDateAndTime' | 'toTime' | 'toTimeOfDay' | 'toCompanyNameAndLocationLine' | 'toCurrency' | 'toDayDate' | 'toDayMonth' | 'toDayOfWeek' | 'toDayShortDate' | 'toDayShortDateAndTime' | 'toDisplayNumber' | 'toDisplayNumberOver' | 'toDisplayNumberSigned' | 'toFormat'