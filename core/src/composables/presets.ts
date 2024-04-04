export interface BTPresets {
    usePresets(preset?: string): any
}

export interface CreatePresetsOptions {
    presets: any
}

export function createPresets(options: CreatePresetsOptions): BTPresets {
    
    function usePresets(preset?: string): any {
        if (!preset) return {}
        let mPreset = preset as keyof typeof options.presets
        return options.presets[mPreset] ?? {}
    }

    return {
        usePresets
    }
}