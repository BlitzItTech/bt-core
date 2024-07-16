<template>
    <bt-blade
        bladeBasic
        :bladeName="bladeName"
        :bladeStartShowing="bladeStartShowing"
        :density="density"
        :errorMsg="ui.errorMsg.value"
        :flat="flat"
        hideSubtoolbar
        :hideToolbar="hideToolbar"
        :label="mLabel"
        :loadingMsg="ui.loadingMsg.value"
        :preset="preset"
        :variant="variant">
        <template #blade-toolbar-right>
            <v-slide-y-transition group>
                <v-btn v-if="mCanSave && ui.isSaveable.value && (ui.isChanged.value || ui.mode.value == 'new')" @click="save(false)" icon="$content-save" :size="mSize" title="Save" key="1" variant="text" />
                <v-btn v-if="!mHideRefresh" icon="$refresh" @click="ui.refresh({ deepRefresh: true })" :size="mSize" title="Refresh" key="2" variant="text" />
                <v-btn v-if="mCanEdit && ui.isEditable.value" :icon="ui.mode.value == 'edit' ? '$pencil-off' : '$pencil'" @click="ui.toggleMode" :size="mSize" :disabled="!auth.canEdit(nav)" title="Edit" key="3" variant="text" />
                <v-btn v-if="mCanDelete && ui.isDeletable.value" icon="$delete" @click="ui.deleteItem(ui.asyncItem.value)" :size="mSize" :disabled="!auth.canEdit(nav)" title="Delete" key="4" variant="text" />
                <v-btn v-if="mCanRestore && ui.isRestorable.value" icon="$eraser-variant" :size="mSize" :disabled="!auth.canEdit(nav)" title="Restore" key="5" variant="text" />
            </v-slide-y-transition>
        </template>
        
        <template #content="{ isMobile, bladeData }">
            <slot name="body" 
                :bladeData="bladeData"
                :density="density" 
                :isEditing="ui.isEditing.value" 
                :isMobile="isMobile" 
                :item="ui.asyncItem.value" 
                :mode="ui.mode.value" 
                :size="mSize"
                :style="contentStyle">
                <div v-if="ui.asyncItem.value == null && !ui.isLoading.value" :style="contentStyle">
                    <slot name="notFound" :bladeData="bladeData" :refresh="ui.refresh" :density="density" :isEditing="ui.isEditing.value" :isMobile="isMobile" :mode="ui.mode.value" :size="mSize"></slot>
                </div>
                <v-card v-else-if="ui.asyncItem.value != null" :flat="flat" :style="contentStyle">
                    <v-card-text class="pa-0">
                        <v-form ref="form">
                            <slot
                                :bladeData="bladeData"
                                :density="density" 
                                :isEditing="ui.isEditing.value" 
                                :isMobile="isMobile" 
                                :item="ui.asyncItem.value" 
                                :mode="ui.mode.value" 
                                name="default"
                                :size="mSize"></slot>
                        </v-form>
                    </v-card-text>
                    <v-card-actions v-if="mCanSave">
                        <v-spacer />
                        <v-slide-x-transition group>
                            <v-btn v-if="mCanSave && ui.isSaveable.value && (ui.isChanged.value || ui.mode.value == 'new')" @click="save(false)" :size="mSize" class="mr-4">
                                <v-icon :size="mSize" start icon="$content-save" />Save
                            </v-btn>
                            <v-btn v-if="mCanSave && ui.isSaveable.value && (ui.isChanged.value || ui.mode.value == 'new')" @click="save(true)" :size="mSize" class="mr-4">
                                <v-icon :size="mSize" start icon="$content-save" />Save And Close
                            </v-btn>
                        </v-slide-x-transition>
                    </v-card-actions>
                </v-card>
                <slot name="bottom" :bladeData="bladeData" :item="ui.asyncItem.value" :density="density" :isEditing="ui.isEditing.value" :isMobile="isMobile" :mode="ui.mode.value" :size="mSize" />
            </slot>
        </template>
    </bt-blade>
</template>

<script setup lang="ts">
    import { type BladeDensity } from '../composables/blade.ts'
    import { ItemProps, useItem } from '../composables/item.ts'
    import { useAuth } from '../composables/auth.ts'
    import { useNavigation } from '../composables/navigation.ts'
    import { usePresets } from '../composables/presets.ts'
    import { computed, inject, provide, ref } from 'vue'

    interface PageProps extends ItemProps {
        // bladeGroup?: string
        // bladeStartShowing?: boolean
        actualHeight?: string
        actualUsedHeight?: string
        canDelete?: boolean
        canEdit?: boolean
        canRestore?: boolean
        density?: BladeDensity
        flat?: boolean
        getLabel?: (item: any) => string | undefined
        hideRefresh?: boolean
        hideToolbar?: boolean
        label?: string
        otherUsedHeight?: number
        preset?: string
    }

    const props = withDefaults(defineProps<PageProps>(), {
        canDelete: false,
        canEdit: true,
        canRestore: false,
        canSave: true,
        density: 'compact',
        eager: true,
        flat: true,
        includeDetails: true,
        isSingle: true,
        // storeMode: 'session',
        // storageMode: 'local-cache',
        trackChanges: true,
        useBladeSrc: undefined,
        useRouteSrc: undefined,
        variant: 'page'
    })

    const presets = usePresets(props.preset)
    const form = ref()
    const { findSingleDisplay } = useNavigation()
    const auth = useAuth()
    const mSize = inject('size', () => ref('small'), true)
    const ui = useItem(props)
    
    provide('isEditing', ui.isEditing)

    const mCanEdit = computed(() => (presets.canEdit as boolean ?? props.canEdit) && ui.mode.value != 'new')
    const mCanDelete = computed(() => (presets.canDelete as boolean ?? props.canDelete))
    const mCanRestore = computed(() => (presets.canRestore as boolean ?? props.canRestore))
    const mCanSave = computed(() => (presets.canSave as boolean ?? props.canSave))
    const mHideRefresh = computed(() => (presets.hideRefresh as boolean ?? props.hideRefresh))
    const mLabel = computed(() => props.label ?? (props.getLabel != null ? props.getLabel(ui.asyncItem.value) : undefined) ?? findSingleDisplay(props.nav ?? props.bladeName ?? ''))
    const contentStyle = computed(() => {
        if (props.actualHeight != null) {
            return `height: calc(${props.actualHeight})`
        }
        else if (props.actualUsedHeight != null) {
            return `height: calc(100vh - ${props.actualUsedHeight}px)`
        }
        else {
            let mUsedHeight = 207
            if (props.hideToolbar == true)
                mUsedHeight -= 48
            
            return `height: calc(100vh - ${mUsedHeight}px)`
        }
    })

    async function save(navBack: boolean) {
        const { valid } = await form.value.validate()

        if (valid) {
            await ui.saveItem(ui.asyncItem.value, { navBack })
        }
    }

</script>