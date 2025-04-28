<template>
    <v-chip-group>
        <v-chip
            v-for="(tag, ind) in tags"
            :key="ind"
            :size="size">
            {{ tag }}
        </v-chip>
    </v-chip-group>
</template>

<script setup lang="ts">
import { computed } from 'vue';

    const props = defineProps<{
        chipProps?: any
        modelValue: any
        size?: string
    }>()

    const tags = computed(() => {
        if (props.modelValue == null)
            return []

        if (typeof props.modelValue == 'string') {
            return props.modelValue.split(',')
        }
        else
            return props.modelValue
    })
</script>