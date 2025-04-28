<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-text-field
            v-bind="$attrs"
            :hide-details="cRules == null"
            :prefix="prefix ?? (useCurrency ? '$' : undefined)"
            :readonly="!cIsEditing"
            :rules="cRules"
            :variant="cIsEditing ? editVariant : variant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
    import { TestEmailValid, TestRequired } from '../composables/rules.ts'
    import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        horizontal?: boolean
        isEditing?: boolean
        isEmail?: boolean
        isMobile?: boolean
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
        prefix?: string
        required?: boolean
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
    const cRules = computed(() => {
        var r = [
            ...(props.rules ?? []),
        ]

        if (props.isEmail !== false)
            r.push(TestEmailValid)

        if (props.required)
            r.push(TestRequired)

        return r.length > 0 ? r : undefined
    })

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>