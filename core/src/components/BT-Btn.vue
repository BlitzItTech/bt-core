<template>
    <v-btn
        v-bind="$attrs"
        :color="mColor"
        :disabled="!mIsEditing"
        :icon="mIcon"
        :size="mSize"
        :variant="mVariant" />
</template>

<script setup lang="ts">
    import { computed, inject, ref } from 'vue'
    import { usePresets } from '../composables/presets.ts'
    
    interface BtnProps {
        color?: string
        icon?: string
        isEditing?: boolean
        preset?: string
        size?: string,
        variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
    }

    const props = withDefaults(defineProps<BtnProps>(), {
        icon: undefined,
        isEditing: true,
        size: undefined,
        variant: undefined //'text'
    })

    const presets = usePresets(props.preset)

    const mIcon = computed(() => props.icon ?? presets.icon)
    const mColor = computed(() => props.color ?? presets.color)
    const iIsEditing = inject('isEditing', () => ref(false), true)
    const mIsEditing = computed(() => props.isEditing ?? presets.isEditing ?? iIsEditing.value)

    const iSize = inject('size', () => ref(props.size ?? 'small'), true)
    const mSize = computed(() => props.size ?? presets.size ?? iSize.value)

    const mVariant = computed(() => props.variant ?? presets.variant)
</script>