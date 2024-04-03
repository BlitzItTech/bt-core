import { ref, type Ref } from 'vue'

export interface BTDemo {
    endDemo: () => void
    isDemoing: Ref<boolean>
    startDemo: () => void
}

export function createDemo(): BTDemo {
    const isDemoing = ref(false)

    function startDemo() {

    }

    function endDemo() {

    }

    return {
        endDemo,
        isDemoing,
        startDemo
    }
}