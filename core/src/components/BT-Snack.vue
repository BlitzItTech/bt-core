<template>
    <v-snackbar
        v-model="showSnack"
        :timeout="cTimeout">
        {{ modelValue }}
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';


    interface SnackProps {
        isTimed?: boolean
        modelValue?: string
        timeout?: string,
        
    }

    const props = withDefaults(defineProps<SnackProps>(), {
        isTimed: true,
        timeout: '5000'
    })

    const cTimeout = computed(() => { return props.isTimed ? props.timeout : -1 })
    const showSnack = ref(false)
    watch(() => props.modelValue, () => {
        showSnack.value = true
    })

</script>