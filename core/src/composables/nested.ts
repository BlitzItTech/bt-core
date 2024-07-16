import { nestedValue } from "./helpers.ts"
import { useFilters } from "./filters.ts"

export function useNested() {
    const { findFilter } = useFilters()

    function getValue(item: any, path?: string, textFilter?: string) {
        let t = item

        if (path != null)
            t = nestedValue(item, path)

        if (textFilter != null) {
            const func = findFilter(textFilter)
            if (func != null)
                return func(textFilter)
        }

        return t
    }

    return {
        getValue
    }
}