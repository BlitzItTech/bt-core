<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item class="ma-0 pa-0">
            <v-list-item-subtitle v-if="label != null">{{ label }}</v-list-item-subtitle>
            <v-list-item-title>
                <bt-entity
                    v-bind="$attrs"
                    :isSingle="true" />
            </v-list-item-title>
        </v-list-item>
    </v-col>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        isMobile?: boolean
        label?: string
        lg?: string | boolean
        md?: string | boolean
        sm?: string | boolean
    }

    const props = withDefaults(defineProps<FieldProps>(), {
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const emit = defineEmits(['update:modelValue'])

    const mIsMobile = inject('isMobile', () => ref(false), true)
    
    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
    
</script>