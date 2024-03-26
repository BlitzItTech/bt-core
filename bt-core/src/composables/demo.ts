import { ref } from 'vue'

const isDemoing = ref(false)

export function useDemo() {

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