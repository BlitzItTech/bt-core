<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-checkbox
            v-bind="$attrs"
            v-model="value"
            color="primary"
            :hide-details="cRules == null"
            :label="label"
            :readonly="!cIsEditing"
            :rules="cRules" />
    </v-col>
</template>

<script setup lang="ts">
import { TestRequired } from '../composables/rules.ts'
import type { BladeDensity } from '../composables/blade.ts'
import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        density?: BladeDensity
        horizontal?: boolean
        isEditing?: boolean
        isMobile?: boolean
        label: any
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
        required?: boolean
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

    const emit = defineEmits(['update:modelValue'])

    const value = computed({
        get() {
            return props.modelValue
        },
        set(value) {
            emit('update:modelValue', value)
        }
    })

    const mIsEditing = inject('isEditing', () => ref(false), true)
    const cIsEditing = computed(() => props.isEditing ?? mIsEditing.value)
    const mIsMobile = inject('isMobile', () => ref(false), true)
    const cRules = computed(() => {
        var r = [
            ...(props.rules ?? []),
        ]

        if (props.required)
            r.push(TestRequired)

        return r.length > 0 ? r : undefined
    })

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
    
</script>