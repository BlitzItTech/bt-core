import { getLocationLine, isMinDate } from '@/composables/helpers';
import { BTDates } from './dates';

export interface BTFilters {
    findFilter: (mFilter: string | undefined) => Function
}

export interface UseFiltersOptions {
    dates: BTDates
}

export function createFilters(options: UseFiltersOptions): BTFilters {
    // const { tzString, tzDate, utcString } = useDates()

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

    function toLocationLine(val: any): string {
        return getLocationLine(val, false);
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
        return toTimeZoneFormat(value, 'ddd DD MMM YYYY', placeholder);
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
        toFormat,
        toLocationLine,
        toLocationLineNoCommas,
        toLongDate,
        toLongDateAndTime,
        toPercent,
        toPrettyCSV,
        toShortDate,
        toShortDateAndTime,
        toTime,
        toTimeOfDay
    }

    function findFilter(mFilter: undefined | string): Function {
        if (mFilter != null) {
            let filter = mFilter as keyof typeof e
            if (filter != null && e[filter] != null) {
                return e[filter] as Function
            }
        }

        return (v: any) => v
    }

    return {
        findFilter,
        ...e
    }
}

export type Textfilter = 'toLocationLine' | 'toLocationLineNoCommas' | 'toLongDate' | 'toLongDateAndTime' | 'toPercent' | 'toPrettyCSV' | 'toShortDate' | 'toShortDateAndTime' | 'toTime' | 'toTimeOfDay' | 'toCompanyNameAndLocationLine' | 'toCurrency' | 'toDayDate' | 'toDayMonth' | 'toDayOfWeek' | 'toDayShortDate' | 'toDayShortDateAndTime' | 'toDisplayNumber' | 'toDisplayNumberOver' | 'toDisplayNumberSigned' | 'toFormat'