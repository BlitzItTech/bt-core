<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-text-field
            v-bind="$attrs"
            :hide-details="!rules"
            :prefix="useCurrency ? '$' : undefined"
            :readonly="!cIsEditing"
            :rules="rules"
            :variant="cIsEditing ? editVariant : variant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
// import { type BladeDensity } from '../types'
import { computed, inject, ref } from 'vue'
// import { useFilters } from '@/composables/filters'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        horizontal?: boolean
        isEditing?: boolean
        isMobile?: boolean
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
        rules?: any
        sm?: string | boolean
        useCurrency?: boolean
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
    const variant = inject('fieldVariant', 'underlined')
    const editVariant = inject('fieldEditVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
    // const str: Ref<any> = ref(undefined)

    // watch(props.modelValue, (v) => { str.value = v })

    // function update(v: any) {
    //     emit('update:modelValue', v)
    //     emit('change', v)
    // }

</script>