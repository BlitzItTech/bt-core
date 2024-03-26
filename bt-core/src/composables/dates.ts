import { DateTime, Info, DurationLikeObject } from 'luxon'
import { useTimeZone } from '@/composables/auth'

export interface UseDatesReturn {
    getToday: () => string
    getTomorrow: () => string
    tzDate: (val?: string, fromFormat?: string) => DateTime
    tzString: (val?: string, format?: string, fromFormat?: string) => string
    utcDate: (val?: string, fromFormat?: string) => DateTime
    utcString: (val?: string, format?: string, fromFormat?: string) => string
}
 
export function useDates() {

    function getToday(): string {
        return tzDate()?.startOf('day').toUTC().toString() ?? '';
    }

    function getTomorrow(): string {
        return tzDate()?.endOf('day').toUTC().toString() ?? '';
    }

    function tzDate(val?: string, fromFormat?: string): DateTime {
        if (val == null) {
            //create now
            return DateTime.utc().setZone(useTimeZone())
        }

        return fromFormat ? DateTime.fromFormat(val, fromFormat, { zone: useTimeZone() }) : DateTime.fromISO(val, { zone: useTimeZone() })
    }

    function tzString(val?: string, format?: string, fromFormat?: string): string {
        if (val == null) {
            //create now
            const d = DateTime.utc().setZone(useTimeZone())
            return format ? d.toFormat(format) : d.toString()
        }

        if (val == 'Invalid DateTime') {
            return ''
        }

        const d = fromFormat ? DateTime.fromFormat(val, fromFormat, { zone: useTimeZone() }) : DateTime.fromISO(val, { zone: useTimeZone() })
        
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

export function useDateAdapter() {
    const d = useDates()

    const defaultFormats: any = {
        dayOfMonth: "d",
        fullDate: "DD",
        fullDateWithWeekday: "DDDD",
        fullDateTime: "ff",
        fullDateTime12h: "DD, hh:mm a",
        fullDateTime24h: "DD, T",
        fullTime: "t",
        fullTime12h: "hh:mm a",
        fullTime24h: "HH:mm",
        hours12h: "hh",
        hours24h: "HH",
        keyboardDate: "D",
        keyboardDateTime: "D t",
        keyboardDateTime12h: "D hh:mm a",
        keyboardDateTime24h: "D T",
        minutes: "mm",
        seconds: "ss",
        month: "LLLL",
        monthAndDate: "MMMM d",
        monthAndYear: "LLLL yyyy",
        monthShort: "MMM",
        weekday: "cccc",
        weekdayShort: "ccc",
        normalDate: "d MMMM",
        normalDateWithWeekday: "EEE, MMM d",
        shortDate: "MMM d",
        year: "yyyy",
    };

    function date(value?: any) {
        if (typeof value === 'undefined')
            return d.tzDate()

        if (typeof value === 'string') {
            return d.tzDate(value)
            // return DateTime.fromJSDate(new Date(value));
        }
    
        if (DateTime.isDateTime(value)) {
            return value;
        }
    
        return DateTime.fromJSDate(value);
    }

    function format(date: DateTime, formatString: string) {
        console.log('a');
        return date.toFormat(defaultFormats[formatString] as string)
    };

    // function formatByString(date: DateTime, format: string) {
    //     return date.toFormat(format);
    // };

    function toJsDate(value: DateTime) {
        console.log('a');
        return value.toJSDate();
    };
    
    function parseISO(isoString: string) {
        console.log('a');
        return DateTime.fromISO(isoString);
    };
    
    function toISO(value: DateTime) {
        console.log('a');
        return value.toISO({ format: "extended" });
    };
    
    function startOfDay(value: DateTime) {
        console.log('a');
        return value.startOf("day");
    };

    function endOfDay(value: DateTime) {
        console.log('a');
        return value.endOf("day");
    };

    function startOfMonth(value: DateTime) {
        console.log('a');
        return value.startOf("month");
      };
    
  function endOfMonth(value: DateTime) {
    console.log('a');
    return value.endOf("month");
  };

  function startOfYear(value: DateTime) {
    console.log('a');
    return value.startOf("year");
  };

  function endOfYear(value: DateTime) {
    console.log('a');
    return value.endOf("year");
  };


  function isBefore(value: DateTime, comparing: DateTime) {
    console.log('a');
    return value < comparing;
  };

  function isAfter(value: DateTime, comparing: DateTime) {
    console.log('a');
    return value > comparing;
  };


  function isEqual(value: any, comparing: any) {
    console.log('a');
    if (value === null && comparing === null) {
      return true;
    }

    // make sure that null will not be passed to this.date
    if (value === null || comparing === null) {
      return false;
    }

    if (!date(comparing)) {
      /* istanbul ignore next */
      return false;
    }

    return date(value)?.equals(date(comparing) as DateTime) ?? false;
  };

  function isSameDay(date: DateTime, comparing: DateTime) {
    console.log('a');
    return date.hasSame(comparing, "day");
  };

  function isSameMonth(date: DateTime, comparing: DateTime) {
    console.log('a');
    return date.hasSame(comparing, "month");
  };

  function isValid(value: any) {
    console.log('a');
    if (DateTime.isDateTime(value)) {
      return value.isValid;
    }

    if (value === null) {
      return false;
    }

    return date(value)?.isValid ?? false;
  };

  function isWithinRange(date: DateTime, [start, end]: [DateTime, DateTime]) {
    console.log('a');
    return (
      date.equals(start) ||
      date.equals(end) ||
      (isAfter(date, start) && isBefore(date, end))
    );
  };

  function addDays(date: DateTime, count: number) {
    console.log('a');
    return date.plus({ days: count });
  };

  function addMonths(date: DateTime, count: number) {
    console.log('a');
    return date.plus({ months: count });
  };

  function getYear(value: DateTime) {
    console.log('a');
    return value.get("year");
  };

  function setYear(value: DateTime, year: number) {
    console.log('a');
    return value.set({ year });
  };

  function getDiff(value: DateTime, comparing: DateTime | string, unit?: keyof DurationLikeObject) {
    console.log('a');
    if (typeof comparing === "string") {
      comparing = DateTime.fromJSDate(new Date(comparing));
    }

    if (!comparing.isValid) {
      return 0;
    }

    if (unit) {
      return Math.floor(value.diff(comparing).as(unit));
    }

    return value.diff(comparing).as("millisecond");
  };

  function getWeekArray(date: DateTime) {
    console.log('a');
    const { days } = date
      .endOf("month")
      .endOf("week")
      .diff(date.startOf("month").startOf("week"), "days")
      .toObject();

    const weeks: DateTime[][] = [];
    new Array<number>(Math.round(days!))
      .fill(0)
      .map((_, i) => i)
      .map((day) => date.startOf("month").startOf("week").plus({ days: day }))
      .forEach((v: any, i: any) => {
        if (i === 0 || (i % 7 === 0 && i > 6)) {
          weeks.push([v]);
          return;
        }

        weeks[weeks.length - 1].push(v);
      });

    return weeks;
  };

  function getWeekdays() {
    console.log('a');
    return Info.weekdaysFormat("short", { locale: 'en-au' }) //this.locale });
  };

  function getMonth(value: DateTime) {
    console.log('a');
    // See https://github.com/moment/luxon/blob/master/docs/moment.md#major-functional-differences
    return value.get("month") - 1;
  };

  function setMonth(value: DateTime, count: number) {
    console.log('a');
    return value.set({ month: count + 1 });
  };

  function getNextMonth(value: DateTime) {
    console.log('a');
    return value.plus({ months: 1 });
  };

    return {
        date,
        format,
        toJsTDate: toJsDate,
        parseISO,
        toISO,
        startOfDay,
        endOfDay,
        startOfMonth,
        endOfMonth,
        startOfYear,
        endOfYear,
        isBefore,
        isAfter,
        isEqual,
        isSameDay,
        isSameMonth,
        isValid,
        isWithinRange,
        addDays,
        addMonths,
        getYear,
        setYear,
        getDiff,
        getWeekArray,
        getWeekdays,
        getMonth,
        setMonth,
        getNextMonth
    }
}