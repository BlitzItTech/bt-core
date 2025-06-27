import { describe, test, expect } from 'vitest'
import { useCSV } from '../src/composables/csv'

describe('default csv', () => {
    const { exportToCSV } = useCSV()

    test('delimiter', () => {
        let res = exportToCSV({
            delimiter: '|',
            items: [{ firstName: 'andy', lastName: 'deroon', age: '15' }, { firstName: 'matt', lastName: 'deroon', age: '17' }],
            headers: [{ value: 'firstName', csv: true }, { value: 'lastName', csv: true }, { value: 'age' }],
            format: 'array'
        })

        expect(res).toEqual(["firstName|lastName","andy|deroon","matt|deroon"])
    })
    
    test('normal', () => {
        let res = exportToCSV({
            items: [{ firstName: 'andy', lastName: 'deroon', age: '15' }, { firstName: 'matt', lastName: 'deroon', age: '17' }],
            headers: [{ value: 'firstName', csv: true }, { value: 'lastName', csv: true }, { value: 'age' }],
            format: 'array'
        })

        expect(res).toEqual(["firstName,lastName","andy,deroon","matt,deroon"])
    })

})