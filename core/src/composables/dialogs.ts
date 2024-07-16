import { useConfirm } from 'vuetify-use-dialog'
import BTBladeItems from '../components/BT-Blade-Items.vue'
import BTDate from '../components/BT-Date.vue'
import BTNumber from '../components/BT-Number.vue'

// import BTBladeItems from '@/components/BT-Blade-Items.vue'
// import BTDate from '../components/BT-Date.vue'
// import BTNumber from '../components/BT-Number.vue'

export interface UseSelectItemOptions {
    itemText: string
    itemValue?: string
    nav: string
    params?: any
    required?: boolean
    searchProps?: string[]
    showSearch?: boolean
    title?: string
}

export function useSelectItem() {
    const createConfirm = useConfirm()
    return async (options: UseSelectItemOptions) => {
        let res: any

        const resolve = (item: any) => {
            res = item
        }
        
        const isConfirmed = await createConfirm({
            contentComponent: BTBladeItems,
            contentComponentProps: {
                canAdd: false,
                canDelete: false,
                canSearch: true,
                headers: [{ value: options.itemText, level: 1, searchable: true }],
                modelValue: res,
                nav: options.nav,
                onSelect: resolve,
                params: options.params,
                searchProps: options.searchProps,
                showSearch: options.showSearch,
                variant: 'inline',
                useServerPagination: false
            },
            dialogProps: {
                height: '600',
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