<template>
    <v-dialog
        :max-width="dialogType == 'number' ? numberOptions.maxWidth : stringOptions.maxWidth"
        v-model="showDialog">
        <template #default>
            <v-card
                v-if="dialogType == 'number'"
                :subtitle="numberOptions.subtitle"
                :text="numberOptions.text"
                :title="numberOptions.title">
                <template #default>
                    <div class="text-h4 text-center py-4" style="height: 75px;">
                        {{ numberOptions.prefix }}{{ val }}
                    </div>
                    <v-row class="ma-0 pa-0 mb-4">
                        <v-col v-for="(button, bInd) in buttons"
                            class="ma-0 pa-0"
                            :cols="button.cols"
                            :key="bInd">
                            <v-btn
                                @click="add(button.num)"
                                :class="numberOptions.buttonClass"
                                :disabled="button.disabled"
                                :height="numberOptions.buttonHeight"
                                :icon="button.icon"
                                :text="button.num?.toString() ?? button.text"
                                tile
                                width="100%" />
                        </v-col>
                    </v-row>
                </template>
                <template #actions>
                    <v-btn 
                        @click="() => cancelDialog()"
                        :text="numberOptions.cancelText" />
                    <v-spacer />
                    <v-btn 
                        @click="() => confirmDialog()"
                        :disabled="!canDo"
                        :text="numberOptions.confirmText" />
                </template>
            </v-card>
            <v-card
                v-else-if="dialogType == 'string'"
                :subtitle="stringOptions.subtitle"
                :text="stringOptions.text"
                :title="stringOptions.title">
                <template #default>
                    <v-text-field
                        v-model="strVal"
                        :rules="stringOptions.rules" />
                </template>
                <template #actions>
                    <v-btn 
                        @click="() => cancelDialog()"
                        :text="stringOptions.cancelText" />
                    <v-spacer />
                    <v-btn 
                        @click="() => confirmDialog()"
                        :disabled="!strCanDo"
                        :text="stringOptions.confirmText" />
                </template>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import { isLengthyArray, isNullOrEmpty } from '../composables/helpers.ts';
    import { DialogResolve, DialogReturn, registerDialog, UseDialogNumberOptions, UseDialogStringOptions } from '../composables/dialog-items.ts'
    import { computed, onUnmounted, ref } from 'vue'

    const showDialog = ref(false)
    const numberOptions = ref<UseDialogNumberOptions>({})
    const stringOptions = ref<UseDialogStringOptions>({})
    const dialogType = ref<'number' | 'string'>('number')

    const val = ref<string>('')
    const strVal = ref<string>('')
    const canDo = computed(() => val.value != null && val.value.length > 0 && !Number.isNaN(val.value))
    const strCanDo = computed(() => {
        if (isNullOrEmpty(strVal.value))
            return false

        if (isLengthyArray(stringOptions.value.rules)) {
            let rStr: string | undefined = undefined
            stringOptions.value.rules?.forEach(rule => {
                let res = rule(strVal.value)
                if (typeof(res) == 'string')
                    rStr = res
            })

            if (rStr != null)
                return false
        }
        
        return true
    })
    
    const resNum = computed(() => {
        const r = numberOptions.value.showDecimal == false ? Number.parseInt(val.value) : Number.parseFloat(val.value)
        return isNaN(r) ? undefined : r
    })

    interface Button {
        cols?: number | string
        disabled?: boolean
        icon?: string
        num?: number | string
        text?: string
    }

    const buttons = computed<Button[]>(() => {
        const bList: Button[] = [
            { cols: 4, num: 1 },
            { cols: 4, num: 2 },
            { cols: 4, num: 3 },
            { cols: 4, num: 4 },
            { cols: 4, num: 5 },
            { cols: 4, num: 6 },
            { cols: 4, num: 7 },
            { cols: 4, num: 8 },
            { cols: 4, num: 9 },
            { cols: 4, num: undefined, icon: '$backspace', disabled: isNullOrEmpty(val.value) },
            { cols: 4, num: 0 },
            { cols: 2, num: '-', disabled: numberOptions.value.showNegative == false },
            { cols: 2, num: '.', disabled: numberOptions.value.showDecimal == false }
        ]

        return bList
    })

    let resolveDialog: (value: DialogReturn<number> | PromiseLike<DialogReturn<number>>) => void
    let strResolveDialog: (value: DialogReturn<string> | PromiseLike<DialogReturn<string>>) => void

    const removeDialogOption = registerDialog({
        dialogType: 'number',
        open: (options: UseDialogNumberOptions, resolve: DialogResolve<any>) => {
            options.buttonClass ??= 'text-h6'
            options.buttonHeight ??= '75'
            options.height ??= '65vh'
            options.maxWidth ??= '350px'
            options.cancelText ??= 'Cancel'
            options.confirmText ??= 'Confirm'
            options.showDecimal ??= false
            options.showNegative ??= false
            numberOptions.value = options

            dialogType.value = 'number'
            val.value = options.startValue?.toString() ?? ''

            showDialog.value = true
            resolveDialog = resolve
        }
    })

    const strRemoveDialogOption = registerDialog({
        dialogType: 'string',
        open: (options: UseDialogStringOptions, resolve: DialogResolve<any>) => {
            options.height ??= '65vh'
            options.maxWidth ??= '350px'
            options.cancelText ??= 'Cancel'
            options.confirmText ??= 'Confirm'
            stringOptions.value = options

            dialogType.value = 'string'
            strVal.value = options.startValue ?? ''

            showDialog.value = true
            strResolveDialog = resolve
        }
    })

    function confirmDialog() {
        if (dialogType.value == 'number') {
            if (resolveDialog != null) {
                resolveDialog({
                    isCancelled: false,
                    isConfirmed: true,
                    isError: false,
                    result: resNum.value
                    //result: listOptions.value.selectMode == 'single' ? (isArrayOfLength(mSelected.value, 0) ? undefined : mSelected.value) : mSelected.value
                })
            }
        }
        else if (dialogType.value == 'string') {
            if (strResolveDialog != null) {
                strResolveDialog({
                    isCancelled: false,
                    isConfirmed: true,
                    isError: false,
                    result: strVal.value
                })
            }
        }

        showDialog.value = false
    }

    function cancelDialog() {
        if (dialogType.value == 'number') {
            if (resolveDialog != null)
                resolveDialog({
                    isCancelled: true,
                    isConfirmed: false,
                    isError: false
                })
        }
        else if (dialogType.value == 'string') {
            if (strResolveDialog != null)
                strResolveDialog({
                    isCancelled: true,
                    isConfirmed: false,
                    isError: false
                })
        }

        showDialog.value = false
    }

    function add(num?: number | string) {
        if (num != null) {
            if (num == '-') {
                if (!val.value.startsWith('-'))
                    val.value = `${num}${val.value}`
                else
                    val.value = val.value.substring(1)
            }
            else if (!(num == '.' && val.value.includes('.'))) {
                val.value = `${val.value ?? ''}${num}`
            }
        }
        else {
            if (val.value.length == 1)
                val.value = ''
            else
                val.value = val.value.substring(0, val.value.length - 1)
        }
    }

    onUnmounted(() => {
        removeDialogOption()
        strRemoveDialogOption()
    })

</script>