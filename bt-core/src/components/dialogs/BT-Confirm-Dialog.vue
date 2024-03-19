<template>
    <v-dialog v-model="show">
        <div>
            <v-card :max-width="maxWidth ?? '400'" :min-width="minWidth" :title="title" class="mx-auto">
                <v-card-text>
                    <div class="text-h6">{{ msg }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="cancel">{{ cancelText ?? 'No' }}</v-btn>
                    <v-btn @click="confirm">{{ confirmText ?? 'Yes' }}</v-btn>
                </v-card-actions>
            </v-card>
        </div>
    </v-dialog>
</template>
  
<script setup lang="ts">
import { onMounted } from 'vue';
    import { type ConfirmDialogProps } from '@/composables/dialogs'
    

    const props = withDefaults(defineProps<ConfirmDialogProps>(), {
        cancelValue: false,
        confirmValue: true,
        startIncludeDetails: false
    })

    // const props = defineProps(['cancelText', 'confirmText', 'msg', 'minWidth', 'title'])
    
    const emit = defineEmits(['confirm', 'cancel'])

    let show = false

    function cancel() {
        show = false
        emit('cancel', props.cancelValue)
    }

    function confirm() {
        show = false
        emit('confirm', props.confirmValue)
    }

    onMounted(() => {
        show = true
    })

</script>