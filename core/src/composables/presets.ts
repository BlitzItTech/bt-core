export interface BTPresets {
    usePresets(preset?: string): any
}

export interface CreatePresetsOptions {
    presets: any
}

let current: BTPresets

export function usePresets(preset?: string): any {
    return current.usePresets(preset)
}

export function createPresets(options: CreatePresetsOptions): BTPresets {
    
    function usePresets(preset?: string): any {
        if (!preset) return {}
        let mPreset = preset as keyof typeof options.presets
        return options.presets[mPreset] ?? {}
    }

    current = {
        usePresets
    }

    return current
}