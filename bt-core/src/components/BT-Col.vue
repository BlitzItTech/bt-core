<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols"
        :class="noGutters ? 'px-0' : ''">
        <slot></slot>
    </v-col>
</template>

<script setup lang="ts">
    import { computed, inject, ref } from 'vue'

    interface ColProps {
        cols?: string | boolean
        isMobile?: boolean
        lg?: string | boolean
        md?: string | boolean
        sm?: string | boolean
        noGutters?: boolean
    }
    
    const props = withDefaults(defineProps<ColProps>(), {
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const mIsMobile = inject('isMobile', () => ref(false), true)

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>