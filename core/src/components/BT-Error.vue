<template>
    <v-slide-y-transition>
        <v-alert
            closable
            title="Error"
            color="red-lighten-1"
            v-model="showError">
            {{ errorMsg }}
        </v-alert>
    </v-slide-y-transition>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';

    const props = defineProps<{
        errorMsg?: string
    }>()

    const showError = ref(false)

    watch(() => props.errorMsg, (v) => { showError.value = v != null })
</script>