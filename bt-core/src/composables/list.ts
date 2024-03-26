

type OnCanSelectItem = (item: any) => boolean
type OnSelectItem = (item: any) => void

export interface TableColumn {
    align?: 'start' | 'end' | 'center'
    hide?: boolean
    itemText?: string
    level?: number
    maxWidth?: string
    minWidth?: string
    prefix?: string
    suffix?: string
    textFilter?: string
    textFunction?: Function
    title?: string
    value?: string
}

export interface ListEvents {
    (e: 'change', item: any): void
    (e: 'deleted', item: any): void
    (e: 'input', item: any): void
    (e: 'select', item: any): void
    (e: 'mouse-over-item', item: any): void
}

export interface ListProps {

}

export interface UseListOptions {

}

export function useList(props: ListProps, emit?: ListEvents, options?: UseListOptions) {
    
}