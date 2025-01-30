import { describe, expect, test } from "vitest";
import { useIterating } from '../src/composables/iterating'
import { copyDeep } from "../src/composables/helpers";

describe('default', () => {

    test('succeeds', async () => {
        let error
        const itera = useIterating({
            iterationCount: 2,
            onError: err => {
                error = err
            }
        })

        const li = ['1','2','3','4','5','6','7','8','9']
        const done: string[] = []
        let cnt = 0

        await itera.iterateThrough({
            eachIteration: partial => {
                cnt += partial.length
                partial.forEach(p => {
                    done.push(p)
                })
                return Promise.resolve()
            },
            listToIterate: li,
            msg: 'Items'
        })

        expect(li).toEqual(done)
        expect(cnt).toEqual(9)
    })
})