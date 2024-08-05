import { useConfirm } from 'vuetify-use-dialog'
import BTBladeItems from '../components/BT-Blade-Items.vue'
import BTDate from '../components/BT-Date.vue'
import BTNumber from '../components/BT-Number.vue'
import { TableColumn } from './list.ts'

export interface UseSelectItemOptions {
    itemText?: string
    itemValue?: string
    items?: any[]
    nav?: string
    params?: any
    required?: boolean
    searchProps?: string[]
    showSearch?: boolean
    textFunction?: Function
    title?: string
}

export function useSelectItem() {
    const createConfirm = useConfirm()
    return async (options: UseSelectItemOptions) => {
        let res: any

        const resolve = (item: any) => {
            res = item
        }

        const headers: TableColumn[] = []

        if (options.itemText != null || options.itemValue != null) {
            headers.push({
                level: 1,
                searchable: true,
                textFunction: options.textFunction,
                value: options.itemText ?? options.itemValue,
            })
        }
        
        const isConfirmed = await createConfirm({
            cardProps: {
                class: 'ma-0 pa-0'
            },
            contentComponent: BTBladeItems,
            contentComponentProps: {
                actualHeight: '350px',
                canAdd: false,
                canDelete: false,
                canSearch: true,
                flat: true,
                headers: [{ value: options.itemText, level: 1, searchable: true, textFunction: options.textFunction }],
                items: options.items,
                modelValue: res,
                nav: options.nav,
                onSelect: resolve,
                params: options.params,
                searchProps: options.searchProps,
                showListOnly: true,
                showSearch: options.showSearch,
                variant: 'inline',
                useServerPagination: false
            },
            dialogProps: {
                maxHeight: '600',
                width: '450',
                persistent: options.required ?? false
            },
            title: options.title ?? 'Select Item'
        })

        if (!isConfirmed)
            return

        if (res != null && options.itemValue != null) {
            return res[options.itemValue]
        }

        return res
    }
}


export interface UseSelectDateOptions {
    dateFrom?: string
    format?: string
    fromNow?: boolean
    range?: boolean
    required?: boolean
    title?: string
    useTime?: boolean
}

export function useSelectDate() {
    const createConfirm = useConfirm()

    return async (options: UseSelectDateOptions) => {
        let res: any

        const resolve = (item: any) => {
            res = item
        }
        
        const isConfirmed = await createConfirm({
            contentComponent: BTDate,
            contentComponentProps: {
                ...options,
                onSelect: resolve
            },
            dialogProps: {
                maxHeight: '600',
                maxWidth: '350',
                persistent: options.required ?? false
            },
            title: options.title ?? 'Select Date'
        })

        if (!isConfirmed)
            return

        return res
    }
}

export interface UseSelectNumberOptions {
    max?: number
    min?: number
    required?: boolean,
    title?: string
}

export function useSelectNumber() {
    const createConfirm = useConfirm()

    return async (options?: UseSelectNumberOptions) => {
        let res: any

        const resolve = (item: any) => {
            res = item
        }

        const isConfirmed = await createConfirm({
            contentComponent: BTNumber,
            contentComponentProps: {
                ...options,
                onSelect: resolve
            },
            dialogProps: {
                maxHeight: '250',
                maxWidth: '200',
                persistent: options?.required ?? false
            },
            title: options?.title ?? 'Select Number'
        })

        if (!isConfirmed)
            return

        return res
    }
}