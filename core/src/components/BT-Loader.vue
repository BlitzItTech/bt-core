<template>
    <v-overlay 
        v-model="isLoading"
        class="align-center justify-center text-center overlay"
        contained
        persistent>
        <v-card>
            <v-card-text>
                <v-progress-circular indeterminate />
                <p>{{ loadingMsg }}</p>
            </v-card-text>
        </v-card>
    </v-overlay>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    
    const props = defineProps(['loadingMsg'])
    const isLoading = computed(() => props.loadingMsg != null)
</script>