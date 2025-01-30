<template>
    <v-dialog
        :max-width="listOptions.maxWidth"
        v-model="showDialog">
        <template #default>
            <v-card
                :subtitle="listOptions.subtitle"
                :text="listOptions.text"
                :title="listOptions.title">
                <template #default>
                    <div class="d-flex align-center">
                        <v-text-field
                            v-if="isLengthyArray(listOptions.searchProps)"
                            autofocus
                            hide-details
                            placeholder="Search"
                            v-model="ui.searchString.value">
                            <template #append-inner>
                                <v-btn
                                    @click.stop="ui.refresh({ deepRefresh: true })"
                                    icon="$refresh"
                                    title="Refresh list"
                                    variant="text" />
                            </template>
                        </v-text-field>
                        <v-spacer
                            v-if="!isLengthyArray(listOptions.searchProps)" />
                        <v-btn
                            v-if="!isLengthyArray(listOptions.searchProps)"
                            @click.stop="ui.refresh({ deepRefresh: true })"
                            icon="$refresh"
                            title="Refresh list"
                            variant="text" />
                    </div>
                    <v-list
                        @click:select="selectItem"
                        :height="listOptions.height"
                        :lines="listOptions.lines"
                        open-strategy="multiple"
                        :select-strategy="listOptions.selectMode == 'multi' ? 'classic' : 'single-independent'"
                        v-model:selected="mSelected">
                        <v-slide-y-transition group hide-on-leave>
                            <template v-for="fItem in ui.filteredItems.value" :key="`${fItem.id ?? getValue(fItem, listOptions.itemValue)}-table-list-item`">
                                <v-list-item :value="getValue(fItem, listOptions.itemValue)" :disabled="listOptions.onDisabled!(fItem)">
                                    <v-list-item-title v-if="itemTitleOptions != null">
                                        <bt-header-option :option="itemTitleOptions" :data="fItem" />
                                    </v-list-item-title>
                                    <v-list-item-subtitle v-if="itemSubtitleOptions != null">
                                        <bt-header-option :option="itemSubtitleOptions" :data="fItem" />
                                    </v-list-item-subtitle>
                                    <template v-if="itemActionOptions != null" #append>
                                        <bt-header-option :option="itemActionOptions" :data="fItem" />
                                    </template>
                                </v-list-item>
                            </template>
                        </v-slide-y-transition>
                    </v-list>
                    <bt-loader :loadingMsg="ui.loadingMsg.value" />
                </template>
                <template #actions>
                    <v-btn @click="() => cancelDialog()" :text="listOptions.cancelText" />
                    <v-btn @click="() => confirmDialog()" :text="listOptions.confirmText" />
                </template>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useNested } from '../composables/nested.ts'
    import { DialogResolve, DialogReturn, registerDialog, UseDialogItemsOptions } from '../composables/dialog-items.ts'
    import { computed, onUnmounted, ref } from 'vue'
    import { TableColumn, useList } from '../composables/list.ts'
    import { StoreGetAllReturn } from '../composables/stores.ts'
    import { isArrayOfLength, isLengthyArray } from '../composables/helpers.ts'

    const showDialog = ref(false)
    const listOptions = ref<UseDialogItemsOptions>({})
    const mSelected = ref<any[]>([])
    const { getValue } = useNested()
    let resolveDialog: (value: DialogReturn<any> | PromiseLike<DialogReturn<any>>) => void
    let ui = useList(listOptions.value)

    const itemTitleOptions = computed<TableColumn>(() => {
        return {
            itemText: listOptions.value.itemTitle,
            prefix: listOptions.value.itemTitlePrefix,
            textFilter: listOptions.value.itemTitleFilter,
            textFunction: listOptions.value.itemTitleFunction,
            truncate: listOptions.value.itemTitleTruncate,
            value: listOptions.value.itemTitleProp ?? listOptions.value.itemTitle
        }
    })

    const itemSubtitleOptions = computed<TableColumn | undefined>(() => {
        let e = {
            itemText: listOptions.value.itemSubtitle,
            prefix: listOptions.value.itemSubtitlePrefix,
            textFilter: listOptions.value.itemSubtitleFilter,
            textFunction: listOptions.value.itemSubtitleFunction,
            truncate: listOptions.value.itemSubtitleTruncate,
            value: listOptions.value.itemSubtitleProp ?? listOptions.value.itemSubtitle
        }

        return (e.itemText != null || e.textFilter != null || e.textFunction != null || e.value != null) ? e : undefined
    })

    const itemActionOptions = computed<TableColumn | undefined>(() => {
        let e = {
            itemText: listOptions.value.itemActionTitle,
            prefix: listOptions.value.itemActionPrefix,
            textFilter: listOptions.value.itemActionFilter,
            textFunction: listOptions.value.itemActionFunction,
            truncate: listOptions.value.itemActionTruncate,
            value: listOptions.value.itemActionProp ?? listOptions.value.itemActionTitle
        }

        return (e.itemText != null || e.textFilter != null || e.textFunction != null || e.value != null) ? e : undefined
    })

    const removeDialogOption = registerDialog({
        dialogType: 'items',
        open: (options: UseDialogItemsOptions, resolve: DialogResolve<any>) => {
            options.height ??= '65vh'
            options.maxWidth ??= '350px'
            options.cancelText ??= 'Cancel'
            options.confirmText ??= 'Confirm'
            options.onDisabled ??= () => false
            listOptions.value = options
            const selector = options.selector ?? ((item: any) => item.id)
            options.onGetSuccessAsync = async (gRes: StoreGetAllReturn<any>) => {
                if (options.selected != null) {
                    if (Array.isArray(options.selected)) {
                        mSelected.value = gRes.data.filter(x => options.selected?.some(s => selector(s) == selector(x) ))
                    }
                    else {
                        const e = gRes.data.filter(x => selector(x) == selector(options.selected))
                        if (e != null)
                            mSelected.value = [e]
                    }
                }
                else {
                    mSelected.value = []
                }

                return gRes
            }

            ui = useList(options, undefined, { isNotSetup: true })
            ui.refresh()
            showDialog.value = true
            resolveDialog = resolve
        }
    })

    function selectItem(data: any) {
        if (listOptions.value.selectMode == 'single') {
            if (resolveDialog != null) {
                resolveDialog({
                    isCancelled: false,
                    isConfirmed: true,
                    isError: false,
                    result: data.value == true ? data.id : undefined
                })
            }

            showDialog.value = false
        }
    }

    function confirmDialog() {
        if (resolveDialog != null) {
            resolveDialog({
                isCancelled: false,
                isConfirmed: true,
                isError: false,
                result: listOptions.value.selectMode == 'single' ? (isArrayOfLength(mSelected.value, 0) ? undefined : mSelected.value) : mSelected.value
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