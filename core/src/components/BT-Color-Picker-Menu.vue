<template>
    <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn 
                :color="color"
                icon
                size="small"
                v-bind="props" />
        </template>

        <v-card>
            <template #default>
                <v-color-picker v-model="colorVal" />
            </template>
            <template #actions>
                <v-spacer />
                <v-btn @click="apply">Apply</v-btn>
            </template>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue'

    interface PickerProps {
        color?: string
        modelValue?: any
    }

    const props = defineProps<PickerProps>()
    const emit = defineEmits(['update:modelValue', 'change'])
    const colorVal = ref<any>(props.color)

    watch(() => props.modelValue, val => {
        colorVal.value = val
    })

    // const value = computed({
    //     get() {
    //         return props.modelValue
    //     },
    //     set(value) {
    //         emit('update:modelValue', value)
    //     }
    // })

    function apply() {
        emit('update:modelValue', colorVal.value)
        emit('change', colorVal.value)
    }
    
</script>