// import { openDialog } from 'vue3-promise-dialog'
import { createConfirmDialog } from 'vuejs-confirm-dialog'
import BTConfirmDialog from '@/components/dialogs/BT-Confirm-Dialog.vue'
import BTSelectDateDialog from '@/components/dialogs/BT-Select-Date-Dialog.vue'
import BTSelectDialog from '@/components/dialogs/BT-Select-Dialog.vue'
import BTTextDialog from '@/components/dialogs/BT-Text-Dialog.vue'
import { type ListProps } from '@/composables/list'

export interface ConfirmDialogProps {
    cancelText?: string
    cancelValue?: any
    confirmText?: string
    confirmValue?: any
    msg?: string
    maxWidth?: number
    minWidth?: number
    title?: string
}

export interface SelectDateProps {
    cancelText?: string
    cancelValue?: any
    confirmText?: string
    dateFrom?: string
    dateRules?: Function | unknown[]
    format?: string
    fromNow?: boolean
    height?: string
    msg?: string
    maxWidth?: number
    minWidth?: number
    range?: boolean
    required?: boolean
    requireTime?: boolean
    title?: string
    useTime?: boolean
}

export interface SelectDialogProps extends ListProps {
    cancelText?: string
    cancelValue?: any
    canUnselect?: boolean
    confirmText?: string
    height?: string
    itemSubtext?: string
    itemText?: string
    itemValue?: string
    msg?: string
    maxWidth?: number
    minWidth?: number
    multiple?: boolean
    nav?: string
    onFilter?: Function
    required?: boolean
    subtextFilter?: string
    subtextFunction?: Function
    textFilter?: string
    textFunction?: Function
    title?: string
}

export interface TextDialogProps extends ListProps {
    cancelText?: string
    confirmText?: string
    height?: string
    label?: string
    msg?: string
    maxWidth?: number
    minWidth?: number
    required?: boolean
    title?: string
    value?: any
}

const confirmDialog = createConfirmDialog(BTConfirmDialog as any)
const selectDateDialog = createConfirmDialog(BTSelectDateDialog as any)
const selectDialog = createConfirmDialog(BTSelectDialog as any)
const textDialog = createConfirmDialog(BTTextDialog as any)

export function useRequireConfirmation(action: any, props: ConfirmDialogProps, requireConfirm: boolean) {
    if (requireConfirm) {
        const { reveal, onConfirm } = createConfirmDialog(BTConfirmDialog as any, props)
        onConfirm(action)
        reveal()
    }
    else {
        action()
    }
}

export async function useConfirmAsync(text: string) {
    const { data, isCanceled } = await confirmDialog.reveal({ msg: text })
    return !isCanceled
}

/**
 * Returns undefined if cancelled
 * [] if multiple
 * Null | Obj if single
 * @param opts 
 */
export async function useSelectDialog(opts?: SelectDialogProps) {
    const { data } = await selectDialog.reveal(opts)
    return data
}

export async function useSelectDate(opts?: SelectDateProps) {
    const { data } = await selectDateDialog.reveal(opts)
    return data
}

export async function useTextDialog(opts?: TextDialogProps) {
    const { data } = await textDialog.reveal(opts)
    return data
}