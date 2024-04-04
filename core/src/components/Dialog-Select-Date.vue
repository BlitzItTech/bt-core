<template>
    <v-dialog v-model="show">
        <div>
            <v-card
                :max-width="maxWidth ?? '400'"
                :min-width="minWidth"
                class="mx-auto"
                :title="title">
                <v-card-text class="pa-0">
                    <VueDatePicker
                        auto-apply
                        dark
                        :enable-time-picker="useTime"
                        inline
                        :is-24="false"
                        :model-auto="range"
                        :range="range"
                        :time-picker-inline="!range && useTime"
                        :timezone="credentials.timeZone"
                        utc
                        v-bind="$attrs"
                        v-model="date" />
                </v-card-text>
                <v-card-actions>
                    <v-row no-gutters>
                        <v-col cols="6">
                            <v-btn v-if="required !== true" block @click="cancel">{{ cancelText ?? 'Cancel' }}</v-btn>
                        </v-col>
                        <v-col cols="6">
                            <v-btn block @click="accept" :disabled="!canAccept">{{ confirmText ?? 'OK' }}</v-btn>
                        </v-col>
                    </v-row>
                </v-card-actions>
            </v-card>
        </div>
    </v-dialog>
</template>
  
<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue'
    import VueDatePicker from '@vuepic/vue-datepicker'
    import '@vuepic/vue-datepicker/dist/main.css'
    import { useAuth } from '../composables/auth'
    import { type SelectDateProps } from '../composables/dialogs'

    const props = withDefaults(defineProps<SelectDateProps>(), {
        cancelValue: false,
        height: '400'
    })

    const emit = defineEmits(['confirm', 'cancel'])
    const date = ref()
    const { credentials } = useAuth()

    const canAccept = computed(() => {
        return !props.required || date.value
    })

    let show = false

    function accept() {
        if (props.required && !date.value) {
            //required
            return
        }

        show = false
        emit('confirm', date.value)
    }

    // function maybeAccept(items: any) {
    //     if (!props.multiple) {
    //         if (isArrayOfLength(items, 1) || (props.canUnselect && !isLengthyArray(items))) {
    //             show = false
    //             emit('confirm', getSelectedValues(items))
    //         }
    //     }
    // }

    function cancel() {
        show = false
        emit('cancel', undefined)
    }

    onMounted(() => {
        show = true
    })

</script>