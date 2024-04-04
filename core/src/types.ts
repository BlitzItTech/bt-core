/**
    Inline: merges toolbars | much more compact | hides navigation
    Page: shows navigation and page settings
    Blade: shows blade minimize, maximize, close, and pins as a column
    Free-moving: show blade as draggable and resizable with minimize, maximize, and close and pinning
 */
export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline' | 'pane'

export type BladeMode = 'new' | 'view' | 'edit'

export interface BaseModel {
    id?: string
}