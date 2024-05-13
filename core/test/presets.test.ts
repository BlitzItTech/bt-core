import { createPresets, usePresets } from '../src/composables/presets'
import { describe, expect, test } from 'vitest'

describe("navigation", () => {
    const preset = createPresets({
        presets: {
            'test-one': {
                a: 'b'
            },
            test: {
                b: 'c'
            }
        }
    })

    test('use presets', () => {
        const u = usePresets()
        expect(u).toEqual({})
    })

    test('normal', () => {
        expect(usePresets('test')).toEqual({ b: 'c' })
    })

    test('with dash', () => {
        expect(usePresets('test-one')).toEqual({ a: 'b' })
    })
})