export type ViewVariant = 'list-item' | 'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled'
export type EditVariant = 'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled'

export interface CreateComponentConfigOptions {
    editVariant?: EditVariant
    viewVariant?: ViewVariant
}

let current: CreateComponentConfigOptions

export function useComponentConfig() : CreateComponentConfigOptions {
    current ??= {}
    return current
}

export function createComponentConfig(opt?: CreateComponentConfigOptions) {
    current = opt ?? {}
}