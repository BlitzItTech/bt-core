<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item v-if="!cIsEditing && viewVariant == 'list-item'" density="compact" v-bind="$attrs">
            <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
            <v-list-item-title>
                <BTTags
                    chipProps
                    v-model="value" />
            </v-list-item-title>
        </v-list-item>
        <v-combobox
            v-else
            v-bind="$attrs"
            chips
            :closableChips="cIsEditing"
            :label="label"
            multiple
            :readonly="!cIsEditing"
            :variant="cIsEditing ? editVariant : viewVariant"
            v-model="value" />
    </v-col>
</template>

<script setup lang="ts">
    import { computed, inject, ref } from 'vue'
    import { isLengthyArray } from '../composables/helpers.ts'
    import BTTags from '../components/BT-Tags.vue'

    defineOptions({
        inheritAttrs: false
    })

    interface FieldProps {
        cols?: string | boolean
        isArray?: boolean
        isEditing?: boolean
        isMobile?: boolean
        label?: string
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
    const viewVariant = inject<any>('viewVariant', 'underlined')
    const editVariant = inject('editVariant', 'outlined')

    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
</script>