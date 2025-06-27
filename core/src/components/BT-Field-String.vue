<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item v-if="!cIsEditing && viewVariant == 'list-item'" density="compact" v-bind="$attrs">
            <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
            <v-list-item-title>
                <span v-if="prefix != null || useCurrency" class="mr-1">{{ prefix ?? '$' }}</span>
                {{ value }}
            </v-list-item-title>
        </v-list-item>
        <v-text-field
            v-else
            v-bind="$attrs"
            :hide-details="cRules == null"
            :label="label"
            :prefix="prefix ?? (useCurrency ? '$' : undefined)"
            :readonly="!cIsEditing"
            :rules="cRules"
            :variant="cIsEditing ? editVariant : viewVariant"
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
        label?: string
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
    const viewVariant = inject<any>('viewVariant', 'list-item')
    const editVariant = inject('editVariant', 'outlined')
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