<template>
    <v-dialog v-model="show">
        <div>
            <v-card :max-width="maxWidth ?? '400'" :min-width="minWidth" :title="title" class="mx-auto">
                <v-card-text>
                    <v-text-field
                        :label="label"
                        v-model="mVal" />
                    <div class="text-h6">{{ msg }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="cancel">{{ cancelText ?? 'Cancel' }}</v-btn>
                    <v-btn @click="confirm" :disabled="!canAccept">{{ confirmText ?? 'Done' }}</v-btn>
                </v-card-actions>
            </v-card>
        </div>
    </v-dialog>
</template>
  
<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { type TextDialogProps } from '@/composables/dialogs'
    

    const props = withDefaults(defineProps<TextDialogProps>(), {
        height: '400'
    })

    const emit = defineEmits(['confirm', 'cancel'])
    
    const canAccept = computed(() => {
        return !props.required || mVal.value != null
    })

    let show = false

    const mVal = ref(props.value)

    function confirm() {
        if (props.required && mVal.value == null) {
            //required
            return
        }

        show = false
        
        emit('confirm', mVal.value)
    }

    function cancel() {
        show = false
        emit('cancel', undefined)
    }

    onMounted(() => {
        show = true
    })

</script>