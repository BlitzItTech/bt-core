import { DisplayInstance } from "vuetify"
import { BTNavigation } from "./navigation.ts"
import { computed } from "vue"

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
    getUsedHeight: (display?: DisplayInstance, navigation?: BTNavigation) => number
}

export function useResponsiveStyle(options: ResponsiveStyleOptions) {
    return {
        style: computed(() => {
            if (current == null)
                return ''

            return `height: calc(100vh - ${options.getUsedHeight(currentCreateOptions?.display, currentCreateOptions?.navigation)}px); overflow-y: auto;`
        })
    }
}

export function useStyle(actualUsedHeight?: number, ignoreCore?: boolean) {
    return {
        style: computed(() => {
            if (current == null)
                return ''

            return `height: calc(100vh - ${ignoreCore == true ? actualUsedHeight : current.getUsedHeight(actualUsedHeight)}px); overflow-y: auto;`
        })
    }
}