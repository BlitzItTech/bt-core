import { ref, type Ref } from 'vue'

export interface BTDemo {
    endDemo: () => void
    isDemoing: Ref<boolean>
    startDemo: () => void
}

let current: BTDemo

export function useDemo(): BTDemo {
    return current
}

export function createDemo(): BTDemo {
    const isDemoing = ref(false)

    function startDemo() {

    }

    function endDemo() {

    }

    current = {
        endDemo,
        isDemoing,
        startDemo
    }

    return current
}