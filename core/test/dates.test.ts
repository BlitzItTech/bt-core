import { describe, test, expect } from 'vitest'
import { createDates, useDates, BTDateFormat } from '../src/composables/dates'
import { DateTime } from 'luxon'

describe.sequential('default dates', () => {
    let dates = createDates({
        getTimeZone: () => 'Africa/Abidjan', //'Australia/Melbourne',
        getUTC: () => DateTime.utc(2000, 1, 1, 0, 0, 0, 0)
    })


    test('default today is 11 hours after utc', () => {
        expect(dates.getToday()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toFormat(BTDateFormat))
    })

    test('default tomorrow', () => {
        expect(dates.getTomorrow()).toEqual(DateTime.utc(2000, 1, 2, 0, 0, 0, 0).toFormat(BTDateFormat))
    })

    test('default tz', () => {
        expect(dates.tzDate().toMillis()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toMillis())
    })

    test('default tz string', () => {
        expect(dates.tzString()).toEqual('2000-01-01T00:00:00Z')
    })

    test('default utc', () => {
        expect(dates.utcDate().toMillis()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toMillis())
    })

    test('default utc string', () => {
        expect(dates.utcString()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toFormat(BTDateFormat))
    })

    test('today in utc', () => {
        dates = createDates({
            getTimeZone: () => 'Australia/Melbourne',
            getUTC: () => DateTime.utc(2000, 1, 1, 0, 0, 0, 0)
        })
        
        expect(dates.getToday()).toEqual(DateTime.utc(1999, 12, 31, 13, 0, 0, 0).toFormat(BTDateFormat))
    })

    test('tomorrow', () => {
        expect(dates.getTomorrow()).toEqual(DateTime.utc(2000, 1, 1, 13, 0, 0, 0).toFormat(BTDateFormat))
    })

    test('tz date', () => {
        expect(dates.tzDate().toMillis()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toMillis())
    })

    test('tz date format', () => {
        expect(dates.tzDate('01-01-2000', 'dd-MM-yyyy').toString()).toEqual('2000-01-01T00:00:00.000+11:00')
    })

    test('tz string', () => {
        expect(dates.tzString()).toEqual('2000-01-01T11:00:00Z')
    })
    
    test('tz string format', () => {
        expect(dates.tzString('01-01-2000', 'dd/MM/yyyy t', 'dd-MM-yyyy')).toEqual('01/01/2000 12:00 am')
    })

    test('utc', () => {
        expect(dates.utcDate().toMillis()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toMillis())
    })

    test('utc date format', () => {
        expect(dates.utcDate('01-01-2000', 'dd-MM-yyyy').toString()).toEqual('2000-01-01T00:00:00.000+11:00')
    })

    test('utc string', () => {
        expect(dates.utcString()).toEqual(DateTime.utc(2000, 1, 1, 0, 0, 0, 0).toFormat(BTDateFormat))
    })
    
    test('utc string format', () => {
        expect(dates.utcString('01-01-2000', 'dd/MM/yyyy t', 'dd-MM-yyyy')).toEqual('01/01/2000 12:00 am')
    }) 

})