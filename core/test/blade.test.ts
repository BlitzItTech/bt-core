import { describe, test, expect } from 'vitest'
import { BladeData, useBlade } from '../src/composables/blade'


describe.sequential('default', () => {
    let updated = false

    const bladeOne = useBlade({
        bladeName: 'one'
    })

    const startBlade = useBlade({
        bladeName: 'show',
        bladeStartShowing: true
    })

    const bladeTwo = useBlade({
        bladeName: 'other',
        onUpdate: () => {
            updated = true
        }
    })

    test('basic', () => {
        expect(bladeOne.blades.value.length).toEqual(3)
    })

    test('starts hiding and showing', () => {
        expect(bladeOne.bladeData.show).toEqual(false)
        expect(startBlade.bladeData.show).toEqual(true)
        expect(bladeTwo.bladeData.show).toEqual(false)
    })

    test('default hide', () => {
        bladeOne.closeBlade()
        expect(bladeOne.bladeData.show).toEqual(false)
    })

    test('hide from any blade', () => {
        bladeTwo.closeBlade({ bladeName: 'show' })
        expect(startBlade.bladeData.show).toEqual(false)
    })


    test('create blade', () => {
        startBlade.updateBlade({
            bladeName: 'other',
            data: { id: 'a' }
        })

        expect(bladeTwo.bladeData.show).toEqual(true)
    })


    test('update blade', () => {
        startBlade.updateBlade({
            bladeName: 'other',
            data: { id: 'b' }
        })

        expect(bladeTwo.bladeData.show).toEqual(true)
        expect(updated).toEqual(true)
    })
})