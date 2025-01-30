import { describe, expect, test } from "vitest"
import { withSetup } from './utils'
import { useTracker } from '../src/composables/track'
import { twiddleThumbs } from "../src/composables/helpers"
import { ref } from 'vue'

describe("track", () => {
    test('tracker test', async () => {

        const item = { test: 'a' }
        const [{ asyncItem, isChanged, restartTracker }] = withSetup(() => useTracker(item))

        
        expect(isChanged.value).toEqual(false)
        asyncItem.value.test = 'b'
        await twiddleThumbs(500)
        expect(isChanged.value).toEqual(true)
        asyncItem.value.test = 'a'
        await twiddleThumbs(500)
        expect(isChanged.value).toEqual(false)
        asyncItem.value.test = 'b'
        await twiddleThumbs(500)
        expect(isChanged.value).toEqual(true)
        restartTracker()
        await twiddleThumbs(500)
        expect(isChanged.value).toEqual(false)
        
    })
    
    test('undefined succeeds', () => {
        const j = ref(undefined)
        const [tracker] = withSetup(() => useTracker(j, {
            propsToTrack: ['test']
        }))


        expect(tracker.isChanged.value).toEqual(false)
    })
})