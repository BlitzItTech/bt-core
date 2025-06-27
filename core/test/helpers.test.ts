import { dropAndAddToList, dropFromList, toggle, group, orderBy, sum, nestedValue, toCompareString, hasSearch, deepSelect, containsSearch, copyItemByAlphabet, copyDeep, csvContains, toggleCSV, roundTo, isArrayOfLength, isLengthyArray, addWeekday, removeWeekday, appendUrl, distinct, getLocationLine, capitalizeWords, fromCamelCase, toCamelCase, weekdayValue, weekdayShortName, containsWeekday, validEmail, isNullOrEmpty, jwtEncrypt, jwtDecrypt } from '../src/composables/helpers'
import { describe, expect, test } from 'vitest'

describe("helpers", () => {

    interface T {
        toggle?: string
    }

    test('drop from list', () => {
        let l = [{ test: 'a' }, { test: 'b' }, { test: 'c' }]

        let res = dropFromList(l, x => x.test == 'b')

        expect(res).toEqual(1)
        expect(l).toEqual([{ test: 'a' }, { test: 'c' }])
        
    })


    test('replace or add to list', () => {
        let l = [{ test: 'a' }, { test: 'b' }, { test: 'c' }, { test: 'b', b: 'a' }]

        let res = dropAndAddToList(l, { test: 'd' }, x => x.test == 'b')

        expect(res).toEqual(1)
        expect(l).toEqual([{ test: 'a' }, { test: 'd' }, { test: 'c' }])

        res = dropAndAddToList(l, { test: 'e' }, x => x.test == 'b')

        expect(res).toEqual(3)
        expect(l).toEqual([{ test: 'a' }, { test: 'd' }, { test: 'c' }, { test: 'e' }])

        let m = [{ test: 'a' }, { test: 'b' }]

        dropAndAddToList(m, { test: 'c' }, x => x.test == 'c')

        expect(m).toEqual([{ test: 'a' }, { test: 'b' }, { test: 'c' }])

        dropAndAddToList(m, { test: 'c' }, x => x.test == 'c')
        
        expect(m).toEqual([{ test: 'a' }, { test: 'b' }, { test: 'c' }])

        dropAndAddToList(m, { test: 'c' }, x => x.test == 'c')

        expect(m).toEqual([{ test: 'a' }, { test: 'b' }, { test: 'c' }])
    })

    test('toggle', () => {
        var v: T = { toggle: 'one' }

        toggle(v, 'toggle', ['one', 'two', 'three'])

        expect(v.toggle).toEqual('two')
        toggle(v, 'toggle', ['one', 'two', 'three'])
        expect(v.toggle).toEqual('three')
        toggle(v, 'toggle', ['one', 'two', 'three'])
        expect(v.toggle).toEqual('one')

        v.toggle = undefined
        

        toggle(v, 'toggle', ['one', 'two', 'three'])
        expect(v.toggle).toEqual('one')
        toggle(v, 'toggle', ['one', 'two', 'three'])
        expect(v.toggle).toEqual('two')
        toggle(v, 'toggle', ['one', 'two', 'three'])
        expect(v.toggle).toEqual('three')

        toggle(v, 'toggle', [undefined, true, false, 'three'])
        expect(v.toggle).toBeUndefined()

        toggle(v, 'toggle', [undefined, true, false, 'three'])
        expect(v.toggle).toEqual(true)

        toggle(v, 'toggle', [undefined, true, false, 'three'])
        expect(v.toggle).toEqual(false)
    })

    test('decrypt encrypt', () => {
        const token = {
            test: '1'
        }

        const encryptedToken = jwtEncrypt(token)

        const decrypted = jwtDecrypt(encryptedToken)

        expect(decrypted).toEqual(token)
    })

    test('sum', () => {
        expect(sum([1,2,3])).toEqual(6)
    })

    test('order by', () => {
        const e = orderBy(['b', 'd', 'a'])
        expect(e).toEqual(['a', 'b', 'd'])

        const a = orderBy([
            { a: 'a', b: 'b' },
            { a: 'd', b: 'q' },
            { a: 'c', b: 'b' }
        ], x => x.a)

        expect(a).toEqual([
            { a: 'a', b: 'b' },
            { a: 'c', b: 'b' },
            { a: 'd', b: 'q' }
        ])
    })


    test('append url', () => {
        expect(appendUrl('https://test.com/', '/test')).toEqual('https://test.com/test')
        expect(appendUrl('https://test.com', 'test')).toEqual('https://test.com/test')
        expect(appendUrl('https://test.com/', 'test')).toEqual('https://test.com/test')
        expect(appendUrl('https://test.com', '/test')).toEqual('https://test.com/test')
        expect(appendUrl('https://test.com///', '///test')).toEqual('https://test.com/test')
    })

    test('distinct', () => {
        expect(distinct(['list', 'list'])).toEqual(['list'])
        expect(distinct(['one', 'one', 'two'])).toEqual(['one','two'])
    })
    
    const itemOne = { id: '1', other: 'a' }
    const itemTwo = { id: '2', other: 'a' }
    const itemThree = { id: '3', other: 'a' }
    const itemFour = { id: '1', other: 'a' }
    
    test('distinct prop compare', () => {
        expect(distinct([itemOne, itemTwo, itemThree], 'id')).toEqual([itemOne, itemTwo, itemThree])
        expect(distinct([itemOne, itemTwo, itemThree, itemFour], 'id')).toEqual([itemOne, itemTwo, itemThree])
        expect(distinct([itemOne, itemFour, itemThree, itemFour], 'id')).toEqual([itemOne, itemThree])
        expect(distinct([itemOne, itemFour, itemThree, itemFour], 'other')).toEqual([itemOne])
    })

    test('distinct func compare', () => {
        expect(distinct([itemOne, itemTwo, itemThree], x => x.id)).toEqual([itemOne, itemTwo, itemThree])
        expect(distinct([itemOne, itemTwo, itemThree, itemFour], x => x.id)).toEqual([itemOne, itemTwo, itemThree])
        expect(distinct([itemOne, itemFour, itemThree, itemFour], x => x.id)).toEqual([itemOne, itemThree])
    })

    // test('group', () => {
    //     expect(group([]))
    // })
    
    // test('get area around', () => {
    //     //starts with top left and goes anti-clockwise
    //     expect(getAreaAround({ lat: 0, lng: 0 }, 1)).toEqual([{ lat: -1, lng: 1 },{ lat: -1, lng: -1 },{ lat: 1, lng: -1 },{ lat: 1, lng: 1 }])
    //     expect(getAreaAround({ lat: 0, lng: 0 }, 2)).toEqual([{ lat: -2, lng: 2 },{ lat: -2, lng: -2 },{ lat: 2, lng: -2 },{ lat: 2, lng: 2 }])
    //     expect(getAreaAround({ lat: 2, lng: 6 }, 1)).toEqual([{ lat: 1, lng: 7 },{ lat: 1, lng: 5 },{ lat: 3, lng: 5 },{ lat: 3, lng: 7 }])
    // })

    // test('get area to left', () => {
    //     //starts with top left and goes anti-clockwise
    //     expect(getAreaToLeft({ lat: 0, lng: 0 }, 1)).toEqual([{ lat: -2, lng: 1 },{ lat: -2, lng: -1 },{ lat: 0, lng: -1 },{ lat: 0, lng: 1 }])
    //     expect(getAreaToLeft({ lat: 0, lng: 0 }, 2)).toEqual([{ lat: -4, lng: 2 },{ lat: -4, lng: -2 },{ lat: 0, lng: -2 },{ lat: 0, lng: 2 }])
    // })

    // test('get area to right', () => {
    //     //starts with top left and goes anti-clockwise
    //     expect(getAreaToRight({ lat: 0, lng: 0 }, 1)).toEqual([{ lat: 0, lng: 1 },{ lat: 0, lng: -1 },{ lat: 2, lng: -1 },{ lat: 2, lng: 1 }])
    //     expect(getAreaToRight({ lat: 2, lng: 0 }, 2)).toEqual([{ lat: 2, lng: 2 },{ lat: 2, lng: -2 },{ lat: 6, lng: -2 },{ lat: 6, lng: 2 }])
    // })

    test('get location line', () => {
        expect(getLocationLine(null)).toEqual('')
        expect(getLocationLine({ streetNumber: '9', streetName: 'Morgan St', suburb: 'Timboon', state: 'VIC', postcode: '3268' })).toEqual('9 Morgan St, Timboon VIC 3268')
    })

    test('from camel case', () => {
        expect(fromCamelCase('testOneTwo')).toEqual('Test One Two')
        expect(fromCamelCase('testOne Two')).toEqual('Test One  Two')
        expect(fromCamelCase('tesTOneTwo')).not.toEqual('Test One Two')
        expect(fromCamelCase()).toBeUndefined()
    })

    test('to camel case', () => {
        expect(toCamelCase(undefined)).toBeUndefined()
        expect(toCamelCase({ Test: 't' })).not.toEqual({ Test: 't' })
        expect(toCamelCase({ Test: 't' })).toEqual({ test: 't' })
    })

    test('capitalize', () => {
        expect(capitalizeWords('test')).toEqual('Test')
        expect(capitalizeWords('test one')).toEqual('Test One')
    })
    
    test('weekdays csv string sort value', () => {
        expect(weekdayValue('sun, wed, sat')).toEqual(1)
        expect(weekdayValue('wed, sat')).toEqual(4)
        expect(weekdayValue('')).toEqual(8)
        expect(weekdayValue()).toEqual(0)
        expect(weekdayValue('sun, wed, sat, always')).toEqual(0)
        expect(weekdayValue('Tuesday')).toEqual(3)
    })

    test('weekday short name conversion', () => {
        expect(weekdayShortName('Sun, Mon, tuesday')).toEqual('sun,mon,tue')
        expect(weekdayShortName('Sun, Mon, blah')).toEqual('sun,mon')
        expect(weekdayShortName('Sun, Fri, Wedne')).toEqual('sun,fri')
        expect(weekdayShortName('Sunday')).toEqual('sun')
    })

    test('contains weekday', () => {
        expect(containsWeekday('sun', 'sun')).toEqual(true)
        expect(containsWeekday('sun', 'Sunday')).toEqual(true)
        expect(containsWeekday('sun,mon,tue, wed', 'Tuesday')).toEqual(true)
        expect(containsWeekday('sun,mon,tuesday, wed', 'Tuesday')).toEqual(true)
        expect(containsWeekday('sun,mon, wed', 'tue')).toEqual(false)
    })

    test('add weekday', () => {
        expect(addWeekday(undefined, 'sun')).toEqual('sun')
        expect(addWeekday(undefined, 'sun')).toEqual('sun')
        expect(addWeekday('mon,sun', 'sun')).toEqual('sun,mon')
        expect(addWeekday('mon,sun, always, m', 'sun')).toEqual('always,sun,mon')
    })

    test('remove weekday', () => {
        expect(removeWeekday(undefined, 'sun')).toEqual(undefined)
        expect(removeWeekday('sun', 'sun')).toEqual(undefined)
        expect(removeWeekday('sun, thur, tue', 'sun')).toEqual('tue,thu')
        expect(removeWeekday('always', 'sun')).toEqual('always')
    })

    test('is array of length', () => {
        expect(isArrayOfLength([], 0)).toEqual(true)
        expect(isArrayOfLength([1,1,1], 3)).toEqual(true)
        expect(isArrayOfLength(undefined, 0)).toEqual(false)
        expect(isArrayOfLength({}, 0)).toEqual(false)
    })

    test('is lengthy array', () => {
        expect(isLengthyArray([])).toEqual(false)
        expect(isLengthyArray(undefined)).toEqual(false)
        expect(isLengthyArray([1])).toEqual(true)
        expect(isLengthyArray([1,1])).toEqual(true)
        expect(isLengthyArray([1,1], 1)).toEqual(true)
        expect(isLengthyArray([1,1], 3)).toEqual(false)
    })

    test('isNullOrEmpty', () => {
        expect(isNullOrEmpty('')).toEqual(true)
        expect(isNullOrEmpty(undefined)).toEqual(true)
        expect(isNullOrEmpty('a')).toEqual(false)
    })

    test('rounding decimal places', () => {
        expect(roundTo(1, 0)).toEqual(1)
        expect(roundTo(1.1, 0)).toEqual(1)
        expect(roundTo(1.6, 0)).toEqual(2)
        expect(roundTo(2.22567, 3)).toEqual(2.226)
        expect(roundTo(2.22547, 3)).toEqual(2.225)
    })

    
    test('toggle csv', () => {
        expect(toggleCSV('one,two,three', 'two')).toEqual('one,three')
        expect(toggleCSV('two', 'two')).toBeUndefined()

        expect(toggleCSV(['one','two','three'], 'two')).toEqual('one,three')
        expect(toggleCSV(['two'], 'two')).toBeUndefined()


        var e: string | undefined
        e = toggleCSV(e, 'two')
        expect(e).toEqual('two')

        e = toggleCSV(e, 'two')
        expect(e).toBeUndefined()
    })

    test('csv contains', () => {
        expect(csvContains('one,two,three', 'two')).toEqual(true)
        expect(csvContains('one,two,three', 'three')).toEqual(true)
        expect(csvContains('one,three', 'two')).toEqual(false)
        expect(csvContains(undefined, 'two')).toEqual(false)
    })

    test('copy deep', () => {
        expect(copyDeep(null)).toStrictEqual(null)
        expect(copyDeep(undefined)).toStrictEqual(undefined)
        
        let item = { test: { one: 'treat' } }
        let copy = copyDeep(item)
        item.test.one = 'other'

        expect(item.test).not.toEqual(copy.test)
        expect(item).not.toEqual(copy)
    })

    test('copy by property alphabet', () => {
        expect(copyItemByAlphabet(null)).toStrictEqual(null)
        expect(copyItemByAlphabet(undefined)).toStrictEqual(undefined)

        let item = { test: { b: 'treat', a: 't' }, v: 'a', s: 'a', z: undefined }
        //consistency
        expect(JSON.stringify(copyItemByAlphabet(item))).toEqual(JSON.stringify(copyItemByAlphabet(item)))
        expect(JSON.stringify(copyItemByAlphabet(item))).toEqual(JSON.stringify({ s: 'a', test: { a: 't', b: 'treat' }, v: 'a', z: undefined }))
        expect(JSON.stringify(copyItemByAlphabet(item))).not.toEqual(JSON.stringify({ s: 'a', test: { b: 'treat', a: 't' }, v: 'a' }))
    })

    test('contains search', () => {
        expect(containsSearch(undefined, undefined)).toEqual(true)
        expect(containsSearch('a', undefined)).toEqual(true)
        expect(containsSearch('aa', 'aa')).toEqual(true)
        expect(containsSearch('aa', 'a')).toEqual(true)
        expect(containsSearch('aa', 'b')).toEqual(false)
        expect(containsSearch('Testing One Two Three', ' one')).toEqual(true)
        expect(containsSearch('Testing One Two Three', '  one')).toEqual(false)
    })

    test('deep select', () => {
        expect(deepSelect(null)).toEqual([])

        let item = [
            { a: 'a', b: [{ a: 'd' }] },
            { a: 'b'},
            { a: 'c' }
        ]

        expect(deepSelect(item, x => x.b).length).toEqual(4)

        let ite = [{
            b: [
                { a: 'a', b: [{ a: 'b', b: [{ a: 'c' }] }]},
                { a: 'd' },
                { a: 'e', b: [{ a: 'f' }]}
            ]
        }]

        expect(deepSelect(ite, x => x.b).length).toEqual(7)

        let te = {
            b: [
                { a: 'a', b: [{ a: 'b', b: [{ a: 'c' }] }]},
                { a: 'd' },
                { a: 'e', b: [{ a: 'f' }]}
            ]
        }

        //misses the parent
        expect(deepSelect(te, x => x.b).length).toEqual(6)
    })

    test('has search', () => {
        expect(hasSearch(undefined, 'test', ['a', 'b'])).toEqual(false)
        expect(hasSearch('test', undefined, ['a', 'b'])).toEqual(true)
        expect(hasSearch({ test: 'one two three', a: 'one' }, 'four', ['test', 'a'])).toEqual(false)
        expect(hasSearch({ test: 'two', a: 'one' }, 'one', undefined)).toEqual(false)
        expect(hasSearch({ test: 'one two three', a: 'one', b: 'two' }, 'three', ['a', 'b'])).toEqual(false)
        expect(hasSearch({ test: 'one two three', a: 'one', b: 'two' }, 'three', ['a', 'b', 'test'])).toEqual(true)
        expect(hasSearch({ test: 'one two three', a: 'one', b: 'two' }, 'one', ['b'])).toEqual(false)
        expect(hasSearch({ test: 'one two three', a: 'one', b: 'two' }, 'one', ['a', 'b'])).toEqual(true)
    })

    test('to compare string', () => {
        expect(toCompareString('one')).toEqual('one')
        expect(toCompareString(undefined)).toStrictEqual(null)
        expect(toCompareString('one two three')).toEqual('onetwothree')
    })

    test('nested value', () => {
        let item = {
            a: { b: 'b', c: { d: 'd' } },
            b: 'str'
        }

        expect(nestedValue(item, 'b')).toEqual('str')
        expect(nestedValue(item, 'a.c.d')).toEqual('d')
        expect(nestedValue(item, 'a.b')).toEqual('b')
    })

    test('valid email', () => {
        expect(validEmail('andrewderoon@gmail.com')).toEqual(true)
        expect(validEmail('@gmail.com')).toEqual(false)
        expect(validEmail('a@')).toEqual(false)
        expect(validEmail('a@e')).toEqual(true)
        expect(validEmail('andrewderoon.com')).toEqual(false)
    })
})