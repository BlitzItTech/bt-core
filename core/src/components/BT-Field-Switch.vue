<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item density="compact">
            <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
            <template #append>
                <v-switch
                    hide-details
                    inset
                    v-bind="$attrs"
                    :readonly="!cIsEditing"
                    :variant="cIsEditing ? editVariant : viewVariant"
                    v-model="value" />
            </template>
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
        isEditing?: boolean
        isMobile?: boolean
        label?: string
        lg?: string | boolean
        md?: string | boolean
        modelValue: any
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
    const viewVariant = inject<any>('viewVariant', 'underlined')
    const editVariant = inject('editVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>