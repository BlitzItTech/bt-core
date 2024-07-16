/**
    Inline: merges toolbars | much more compact | hides navigation
    Page: shows navigation and page settings
    Blade: shows blade minimize, maximize, close, and pins as a column
    Free-moving: show blade as draggable and resizable with minimize, maximize, and close and pinning
 */
// export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline' | 'pane'

// export type BladeDensity = 'default' | 'comfortable' | 'compact'

// export type BladeMode = 'new' | 'view' | 'edit'

export type FieldVariant = 'underlined' | 'outlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled' | 'plain'

export interface BaseModel {
    id?: string
}

const navigationKey = Symbol()
const urlsKey = Symbol()
const demoKey = Symbol()
const authKey = Symbol()

export { navigationKey, urlsKey, demoKey, authKey }