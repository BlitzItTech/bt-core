import { ListProps } from "./list.ts"

export interface BTUseDialogOption extends RegisterDialogOptions {

}

export interface BTUseDialog {
    options: BTUseDialogOption[]
}

export type DialogResolve<T> = (value: DialogReturn<T> | PromiseLike<DialogReturn<T>>) => void

let current: BTUseDialog

export interface RegisterDialogOptions {
    dialogType: 'items' | 'number' | 'date' | 'string'
    open: (options: any, resolve: DialogResolve<any>) => void
}

export interface DialogReturn<T> {
    isError: boolean
    isCancelled: boolean
    isConfirmed: boolean
    result?: T
}

export function registerDialog(options: RegisterDialogOptions) {
    if (current == null)
        current = {
            options: []
        }

    current.options.push(options)

    return () => {
        const ind = current.options.findIndex((x: BTUseDialogOption) => x === options)
        current.options.splice(ind, 1)
    }
}



export interface UseDialogItemsOptions extends ListProps<any, any, any> {
    cancelText?: string
    confirmText?: string

    /**whether to show raw object/string in line items */
    height?: string
    isRaw?: boolean
    itemActionTitle?: string
    itemActionFilter?: string
    itemActionFunction?: Function | undefined
    itemActionPrefix?: string
    itemActionProp?: string
    itemActionTruncate?: boolean

    itemSubtitle?: string
    itemSubtitleFilter?: string
    itemSubtitleFunction?: Function | undefined
    itemSubtitlePrefix?: string
    itemSubtitleProp?: string
    itemSubtitleTruncate?: boolean
    
    itemTitle?: string
    itemTitleFilter?: string
    itemTitleFunction?: Function | undefined
    itemTitlePrefix?: string
    itemTitleProp?: string
    itemTitleTruncate?: boolean

    itemValue?: string
    lines?: 'one' | 'two' | 'three'
    maxWidth?: string
    onDisabled?: (item: any) => boolean
    /**defaults to single */
    selectMode?: 'single' | 'multi'
    selected?: any[]
    selector?: (item: any) => string
    subtitle?: string
    text?: string
    title?: string
}

export function useDialogSelect<T>(options: UseDialogItemsOptions): Promise<DialogReturn<T>> {
    const d = current?.options.find(x => x.dialogType == 'items')

    if (d == null)
        return Promise.resolve<DialogReturn<T>>({
            isError: true,
            isCancelled: false,
            isConfirmed: false,
            result: undefined
        })
        
    return new Promise((resolve) => {
        d.open(options, resolve)
    })
}

export interface UseDialogDateOptions extends ListProps<any, any, any> {
    cancelText?: string
    confirmText?: string

    /**whether to show raw object/string in line items */
    height?: string
    dateFrom?: string
    dateRules?: Function | unknown[]
    format?: string
    fromNow?: boolean
    horizontal?: boolean
    onSelect?: (item: any) => void
    range?: boolean
    startingDate?: any
    useTime?: boolean
    maxWidth?: string
    subtitle?: string
    text?: string
    title?: string
}

export function useDialogDate<T>(options: UseDialogDateOptions): Promise<DialogReturn<T>> {
    const d = current?.options.find(x => x.dialogType == 'date')

    if (d == null)
        return Promise.resolve<DialogReturn<T>>({
            isError: true,
            isCancelled: false,
            isConfirmed: false,
            result: undefined
        })
        
    return new Promise((resolve) => {
        d.open(options, resolve)
    })
}

export interface UseDialogNumberOptions {
    buttonClass?: string
    buttonHeight?: string
    cancelText?: string
    confirmText?: string
    height?: string
    maxWidth?: string
    prefix?: string
    showDecimal?: boolean
    showNegative?: boolean
    startValue?: number
    subtitle?: string
    text?: string
    title?: string
}

export function useDialogNumber(options: UseDialogNumberOptions): Promise<DialogReturn<number>> {
    const d = current?.options.find(x => x.dialogType == 'number')

    if (d == null)
        return Promise.resolve<DialogReturn<number>>({
            isError: true,
            isCancelled: false,
            isConfirmed: false,
            result: undefined
        })
        
    return new Promise((resolve) => {
        d.open(options, resolve)
    })
}


export interface UseDialogStringOptions {
    cancelText?: string
    confirmText?: string
    height?: string
    maxWidth?: string
    rules?: any[],
    startValue?: string
    subtitle?: string
    text?: string
    title?: string
}

export function useDialogString(options: UseDialogStringOptions): Promise<DialogReturn<string>> {
    const d = current?.options.find(x => x.dialogType == 'string')

    if (d == null)
        return Promise.resolve<DialogReturn<string>>({
            isError: true,
            isCancelled: false,
            isConfirmed: false,
            result: undefined
        })
        
    return new Promise((resolve) => {
        d.open(options, resolve)
    })
}