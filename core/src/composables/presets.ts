export interface BTPresets {
    usePresets(preset?: string): any
}

export interface CreatePresetsOptions {
    presets?: any
}

let current: BTPresets

export function usePresets(preset?: string): any {
    if (current != null)
        return current.usePresets(preset)

    return {}
}

export function createPresets(options: CreatePresetsOptions): BTPresets {
    
    function usePresets(preset?: string): any {
        if (!preset) return {}
        const sets = options.presets ?? {}
        let mPreset = preset as keyof typeof sets
        return sets[mPreset] ?? {}
    }

    current = {
        usePresets
    }

    return current
}