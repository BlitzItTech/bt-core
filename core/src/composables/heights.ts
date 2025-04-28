import { DisplayInstance } from "vuetify"
import { BTNavigation } from "./navigation.ts"
import { computed, MaybeRefOrGetter, toValue } from "vue"

export interface HeightOptions {
    getStyle: (actualUsedHeight?: number) => string
    getUsedHeight: (inAdditionTo?: number) => number
}

export interface CreateHeightOptions {
    display?: DisplayInstance,
    navigation?: BTNavigation,
    getUsedHeight?: (display?: DisplayInstance, navigation?: BTNavigation) => number
}

let current: HeightOptions
let currentCreateOptions: CreateHeightOptions | undefined

export function useHeights(options?: CreateHeightOptions): HeightOptions {
    if (current != null)
        return current

    const baseCalc = options?.getUsedHeight ?? (() => 0)

    function getUsedHeight(inAdditionTo?: number): number {
        return baseCalc(options?.display, options?.navigation) + (inAdditionTo ?? 0)
    }

    function getStyle(actualUsedHeight?: number): string {
        return `height: calc(100vh - ${getUsedHeight(actualUsedHeight)}px);`
    }

    currentCreateOptions = options

    current = {
        getStyle,
        getUsedHeight
    }

    return current
}

export interface ResponsiveStyleOptions {
    getUsedHeight: (display?: DisplayInstance, navigation?: BTNavigation) => number,
    overflow?: boolean
}

export function useResponsiveStyle(options: ResponsiveStyleOptions) {
    return {
        style: computed(() => {
            var doOverflow = options.overflow !== false
            if (current == null)
                return ''

            if (doOverflow)
                return `height: calc(100vh - ${options.getUsedHeight(currentCreateOptions?.display, currentCreateOptions?.navigation)}px); overflow-y: auto;`
            else
                return `height: calc(100vh - ${options.getUsedHeight(currentCreateOptions?.display, currentCreateOptions?.navigation)}px);`
        })
    }
}

// export function useStyle(actualUsedHeight?: number, ignoreCore?: boolean) {
//     const aHeight = ref(actualUsedHeight)

//     return {
//         style: computed(() => {
//             if (current == null)
//                 return ''

//             return `height: calc(100vh - ${ignoreCore == true ? aHeight.value : current.getUsedHeight(aHeight.value)}px); overflow-y: auto;`
//         }),
//         usedHeight: aHeight
//     }
// }

export function useStyle(actualUsedHeight?: MaybeRefOrGetter<number>, ignoreCore?: boolean) {
    return {
        style: computed(() => {
            if (current == null)
                return ''

            var v = toValue(actualUsedHeight)
            return `height: calc(100vh - ${ignoreCore == true ? v : current.getUsedHeight(v)}px); overflow-y: auto;`
        })
        // usedHeight: aHeight
    }
}