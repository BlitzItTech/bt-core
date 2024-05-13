import { useConfirm } from 'vuetify-use-dialog'

export function useNotify(txt: string) {
    const createConfirm = useConfirm()
    return createConfirm({
        title: txt
    })
}