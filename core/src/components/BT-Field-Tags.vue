<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-combobox
            v-bind="$attrs"
            chips
            :closableChips="cIsEditing"
            multiple
            :readonly="!cIsEditing"
            :variant="cIsEditing ? editVariant : variant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { isLengthyArray } from '../composables/helpers.ts'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        isArray?: boolean
        isEditing?: boolean
        isMobile?: boolean
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

    const emit = defineEmits(['update:modelValue'])

    const value = computed({
        get() {
            if (props.isArray)
                return props.modelValue
            else
                return props.modelValue?.split(',')
        },
        set(value) {
            if (props.isArray)
                emit('update:modelValue', value)
            else
                emit('update:modelValue', isLengthyArray(value) ? value!.toString() : null)
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