<template>
    <v-card v-if="cField != null"
        class="ma-1 pa-1" 
        flat
        :ripple="false">
        <div v-if="!isNullOrEmpty(cField.description)" class="text-body-2 pa-1 py-2">{{ cField.description }}</div>
        <div v-if="cField.type == 'info'">
            <div v-if="isNullOrEmpty(cField.description)" class="text-grey">[Select and write text in description]</div>
        </div>
        <div v-else-if="cField.type == 'short-text' || cField.type == 'email' || cField.type == 'phone'">
            <v-text-field
                class="py-2"
                :label="cField.label"
                :placeholder="cField.placeholder"
                :readonly="!isEditing"
                :rules="rules"
                variant="outlined"
                v-model="value" />
        </div>
        <div v-else-if="cField.type == 'long-text'">
            <v-textarea
                class="py-2"
                :label="cField.label"
                :placeholder="cField.placeholder"
                lines="three"
                :readonly="!isEditing"
                :rules="rules"
                variant="outlined"
                v-model="value" />
        </div>
        <div v-else-if="cField.type == 'number'">
            <v-text-field
                class="py-2"
                :label="cField.label"
                :placeholder="cField.placeholder"
                :readonly="!isEditing"
                :rules="rules"
                type="number"
                variant="outlined"
                v-model="value" />
        </div>
        <div v-else-if="cField.type == 'checkbox'">
            <v-checkbox
                class="py-2"
                :label="cField.label"
                :readonly="!isEditing"
                :rules="rules"
                v-model="value" />
        </div>
        <div v-else-if="cField.type == 'date'">
            <bt-field-date
                colClass="px-0 ma-0 py-2"
                :isEditing="isEditing"
                :label="cField.label"
                v-model="value" />
        </div>
        <div v-else-if="cField.type == 'button'">
            <v-btn
                :append-icon="!cField.isSubmitButton && !isNullOrEmpty(cField.url) ? '$open-in-new' : undefined"
                @click="buttonPress"
                color="primary"
                :disabled="!isEditing"
                :text="cField.label" />
        </div>
    </v-card>
</template>

<script setup lang="ts">
    import { AFormField } from '../composables/forms.ts'
    import { computed, onMounted, ref, watch } from 'vue'
    import { isNullOrEmpty } from '../composables/helpers.ts'

    const emits = defineEmits(['update:modelValue', 'onSubmit'])
    const props = defineProps<{
        data?: any
        color?: string
        field: AFormField
        isEditing?: boolean
    }>()

    const value = computed({
        get() {
            if (props.data != null && cField.value?.prop != null)
                return props.data[cField.value.prop]

            return undefined
        },
        set(value) {
            if (props.data != null && cField.value?.prop != null)
                props.data[cField.value.prop] = value
        }
    })
    const cField = ref<AFormField | undefined>()
    const rules = computed(() => {
        var r = []

        if (cField.value?.isRequired == true)
            r.push((v: any) => !!v || 'Required')

        if (cField.value?.type == 'email')
            r.push((v: any) => isNullOrEmpty(v) || /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(v) || 'Invalid Email')

        return r
    })

    function buttonPress() {
        if (cField.value != null) {
            if (cField.value.isSubmitButton)
                emits('onSubmit')
            else if (!isNullOrEmpty(cField.value.url))
                window.open(cField.value.url, '_blank')
        }
    }

    watch(() => props.field, v => {
        console.log('field changed')
        cField.value = v
    })

    onMounted(() => {
        cField.value = props.field
    })

</script>