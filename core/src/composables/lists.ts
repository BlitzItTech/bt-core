import { Ref, ref } from "vue"
import { ListProps } from "./list.ts"

interface ListUpdate {
    nav: string,
    loaded: boolean
}

export interface UseListsOptions {
    onAllLoaded: () => void
}

export function useLists(options: UseListsOptions) {
    const waiters: Ref<ListUpdate[]> = ref([])
    const isLoading = ref(false)

    function check() {
        if (waiters.value.every(w => w.loaded)) {
            options.onAllLoaded()
            isLoading.value = false
        }
    }

    function registerList(listOptions: ListProps<any, any, any>) {
        const waiter = {
            nav: listOptions.nav ?? listOptions.bladeName ?? '',
            loaded: false
        }

        waiters.value.push(waiter)
        isLoading.value = true

        if (listOptions.onFinished == null) {
            listOptions.onFinished = () => { 
                waiter.loaded = true
                check()
            }
        }
        else {
            const original = listOptions.onFinished
            listOptions.onFinished = () => {
                waiter.loaded = true
                check()
                original()
            }
        }

        return listOptions
    }

    return {
        loading: isLoading,
        registerList
    }
}