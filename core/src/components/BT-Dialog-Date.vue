<template>
    <v-dialog
        :max-width="dateOptions.maxWidth"
        v-model="showDialog">
        <template #default>
            <v-card
                :subtitle="dateOptions.subtitle"
                :text="dateOptions.text"
                :title="dateOptions.title">
                <template #default>
                    <bt-date
                        :dateFrom="dateOptions.dateFrom"
                        :dateRules="dateOptions.dateRules"
                        :format="dateOptions.format"
                        :fromNow="dateOptions.fromNow"
                        :horizontal="dateOptions.horizontal"
                        :range="dateOptions.range"
                        :startingDate="dateOptions.startingDate"
                        :useTime="dateOptions.useTime"
                        v-model="mSelected" />
                </template>
                <template #actions>
                    <v-btn @click="() => cancelDialog()" :text="dateOptions.cancelText" />
                    <v-btn @click="() => confirmDialog()" :text="dateOptions.confirmText" />
                </template>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import { DialogResolve, DialogReturn, registerDialog, UseDialogDateOptions } from '../composables/dialog-items.ts'
    import { onUnmounted, ref } from 'vue'
    
    const showDialog = ref(false)
    const dateOptions = ref<UseDialogDateOptions>({})
    const mSelected = ref<any>()
    
    let resolveDialog: (value: DialogReturn<any> | PromiseLike<DialogReturn<any>>) => void

    const removeDialogOption = registerDialog({
        dialogType: 'date',
        open: (options: UseDialogDateOptions, resolve: DialogResolve<any>) => {
            options.format ??= 'ccc dd/LL/yyyy',
            options.height ??= '65vh'
            options.maxWidth ??= '300px' //((options.range && options.useTime) ? '500px' : '350px')
            options.cancelText ??= 'Cancel'
            options.confirmText ??= 'Confirm'
            options.range ??= false
            dateOptions.value = options
            
            showDialog.value = true
            resolveDialog = resolve

            mSelected.value = options.startingDate
        }
    })

    function confirmDialog() {
        console.log(mSelected.value)
        if (resolveDialog != null) {
            resolveDialog({
                isCancelled: false,
                isConfirmed: true,
                isError: false,
                result: mSelected.value // dateOptions.value.range !== false ? (isArrayOfLength(mSelected.value, 0) ? undefined : mSelected.value) : mSelected.value //(isLengthyArray(mSelected.value) ? mSelected.value[0] : undefined)
            })
        }

        showDialog.value = false
    }

    function cancelDialog() {
        if (resolveDialog != null)
            resolveDialog({
                isCancelled: true,
                isConfirmed: false,
                isError: false
            })

        showDialog.value = false
    }

    onUnmounted(() => {
        removeDialogOption()
    })

</script>