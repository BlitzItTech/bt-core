<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <bt-select 
            v-bind="$attrs"
            :readonly="!cIsEditing"
            :fieldVariant="cIsEditing ? editVariant : variant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        // density?: BladeDensity
        horizontal?: boolean
        isEditing?: boolean
        isMobile?: boolean
        // label?: string
        lg?: string | boolean
        md?: string | boolean
        modelValue?: any
        rules?: any
        sm?: string | boolean
    }

    const props = withDefaults(defineProps<FieldProps>(), {
        isEditing: undefined,
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const emit = defineEmits(['update:modelValue', 'select'])

    const value = computed({
        get() {
            return props.modelValue
        },
        set(value) {
            emit('update:modelValue', value)
            emit('select', value)
        }
    })

    const mIsEditing = inject('isEditing', () => ref(false), true)

    const cIsEditing = computed(() => props.isEditing ?? mIsEditing.value)
    const mIsMobile = inject('isMobile', () => ref(false), true)
    const variant = inject('fieldVariant', 'underlined')
    const editVariant = inject('fieldEditVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
    
</script>