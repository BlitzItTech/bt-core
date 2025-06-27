<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item v-if="!cIsEditing && viewVariant == 'list-item'" 
            density="compact" 
            v-bind="$attrs">
            <!-- <v-list-item-subtitle>{{ label }}</v-list-item-subtitle> -->
            <!-- <v-list-item-title>{{ value }}</v-list-item-title> -->
            <template #default>
                <v-list-item-subtitle class="mb-2">{{ label }}</v-list-item-subtitle>
                {{ value }}
            </template>
        </v-list-item>
        <v-textarea
            v-else
            v-bind="$attrs"
            :label="label"
            :readonly="!cIsEditing"
            :rules="rules"
            :variant="cIsEditing ? editVariant : viewVariant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
// import { type BladeDensity } from '@/composables/blade'
import { computed, inject, ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        horizontal?: boolean
        isEditing?: boolean
        isMobile?: boolean
        label: any
        lg?: string | boolean
        md?: string | boolean
        // mode?: 'view' | 'edit' | 'new'
        modelValue: any
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
    const viewVariant = inject<any>('viewVariant', 'underlined')
    const editVariant = inject('editVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>