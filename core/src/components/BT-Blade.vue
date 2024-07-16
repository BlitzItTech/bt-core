<template>
    <v-slide-x-transition>
        <!-- v-if="variant != 'blade' || bladeUI.bladeData.show" -->
        <v-card
            :class="mBladeClass"
            :color="transparent ? 'transparent' : undefined"
            :density="density"
            :flat="ui.variant.value == 'inline' || ui.variant.value == 'pure'"
            :min-height="minHeight"
            ref="blade"
            :rounded="(ui.variant.value == 'blade') ? '2' : '0'"
            :style="mBladeStyle">
            <v-toolbar v-if="!mHideToolbar"
                color="primary"
                :density="density"
                key="1"
                ref="handle">
                <slot name="blade-toolbar">
                    <v-fade-transition hide-on-leave>
                        <v-btn
                            v-if="!mHideNavigation"
                                icon="$arrow-left"
                                key="1"
                                :size="size"
                                title="Back"
                                @click="() => navBack()" />
                    </v-fade-transition>
                    <slot name="blade-title-left"></slot>
                    <v-toolbar-title key="2">{{ label }}</v-toolbar-title>
                    
                    <slot name="blade-title-right"></slot>
                    <v-spacer key="3" />
                    <slot name="blade-toolbar-right"></slot>
                </slot>
                <!-- <v-btn
                    v-if="!mHideBladeControls && ui.variant.value == 'page'"
                    icon="$move-resize-variant"
                    key="5"
                    :size="size"
                    title="Undock"
                    @click="ui.variant.value = 'freestyle'" />
                <v-btn
                    v-else-if="!mHideBladeControls"
                    icon="$window-maximize"
                    key="6"
                    :size="size"
                    title="Maximize"
                    @click="ui.variant.value = 'page'" /> -->
                <v-btn
                    v-if="!mHideBladeControls && variant == 'blade'"
                    icon="$close"
                    key="6.1"
                    :size="size"
                    title="Close"
                    @click="() => ui.closeBlade({ bladeName })" />
                <v-menu v-if="!mHideToolbarSettings"
                    :close-on-content-click="false" 
                    :density="density"
                    key="7">
                    <template v-slot:activator="{ props }">
                        <v-btn icon="$cog" :size="size" v-bind="props" />
                    </template>
                    <v-list :density="density">
                        <slot name="bladeSettings" />
                    </v-list>
                </v-menu>
            </v-toolbar>
            <v-toolbar v-if="!mHideSubtoolbar"
                color="primary"
                :density="density"
                tile
                key="2">
                <slot name="subtoolbar" />
            </v-toolbar>
            <v-row v-if="ui.variant.value == 'inline'" no-gutters>
                <v-list-subheader>{{ label }}</v-list-subheader>
                <v-spacer />
                <slot name="blade-toolbar-right" />
            </v-row>
            <v-slide-y-transition>
                <v-alert closable title="Error" color="red-lighten-1" v-model="showError">{{ errorMsg }}</v-alert>
            </v-slide-y-transition>
            <slot name="content" :isMobile="ui.isMobile.value" :bladeData="ui.bladeData">
                <v-card-text class="ma-0 pa-0">

                </v-card-text>
            </slot>
            <v-overlay 
                v-model="isLoading"
                class="align-center justify-center text-center overlay"
                contained
                persistent>
                <v-card>
                    <v-card-text>
                        <v-progress-circular indeterminate />
                        <p>{{ loadingMsg }}</p>
                    </v-card-text>
                </v-card>
            </v-overlay>
        </v-card>
    </v-slide-x-transition>
</template>

<script setup lang="ts">
    import { type ComponentPublicInstance } from 'vue'
    import type { BladeDensity, BladeVariant, UseBladeOptions } from '../composables/blade.ts'
    import { usePresets } from '../composables/presets.ts'
    import { useBlade } from '../composables/blade.ts'
    import { useNavBack } from '../composables/navigation.ts'
    import { computed, provide, ref, watch } from 'vue'
    import { useSpring } from 'vue-use-spring'

    interface BProps extends UseBladeOptions {
        density?: BladeDensity
        errorMsg?: string
        fieldEditVariant?: string
        fieldVariant?: string
        hideBladeControls?: boolean
        hideNavigation?: boolean
        hideSubtoolbar?: boolean
        hideToolbar?: boolean
        hideToolbarSettings?: boolean
        label?: string
        loadingMsg?: string
        minHeight?: string
        preset?: string
        size?: string | number
        transparent?: boolean
        variant?: BladeVariant
        width?: string | number
    }

    const props = withDefaults(defineProps<BProps>(), {
        density: 'compact',
        hideToolbarSettings: true,
        minHeight: undefined,
        size: 'small',
        variant: 'page'
    })

    const emit = defineEmits(['close'])

    const presets = usePresets(props.preset)
    const widthIsPercent = computed(() => props.width != null && typeof props.width == 'string' && props.width.includes('%'))
    const startWidth = computed(() => {
        if (props.bladeStartShowing !== true)
            return 0

        if (props.width == null)
            return 400

        if (typeof props.width == 'number')
            return props.width

        return Number.parseInt(props.width)
    })
    
    let lastWidth: number = 400 //startWidth.value
    const position = useSpring({ width: startWidth.value })
    
    const blade = ref<ComponentPublicInstance | null>(null)
    const handle = ref<ComponentPublicInstance | null>(null)
    const { navBack } = useNavBack()
    
    const ui = useBlade({ 
        ...props,
        blade,
        handle,
        onClose: () => {
            if (blade.value != null && !widthIsPercent)
                lastWidth = parseInt(window.getComputedStyle(blade.value.$el).getPropertyValue('width'))

            position.width = 0
        },
        onUpdate: () => {
            console.log('u')
            console.log(position.width)
            console.log(widthIsPercent ? Number.parseInt(props.width as string) : lastWidth)
            if (position.width == 0)
                position.width = (widthIsPercent && props.width != null) ? Number.parseInt(props.width as string) : lastWidth
        }
    })
    
    provide('isMobile', ui.isMobile)
    provide('fieldVariant', props.fieldVariant ?? 'underlined')
    provide('fieldEditVariant', props.fieldEditVariant ?? 'outlined')

    const isLoading = computed(() => props.loadingMsg != null)
    const mHideBladeControls = computed(() => (presets.hideBladeControls as boolean ?? props.hideBladeControls) || (ui.variant.value != 'blade' && ui.variant.value != 'page'))
    const mHideNavigation = computed(() => (presets.hideNavigation as boolean ?? props.hideNavigation) || ui.variant.value == 'inline' || ui.variant.value == 'pure')
    const mHideSubtoolbar = computed(() => (presets.hideSubtoolbar as boolean ?? props.hideSubtoolbar) || ui.variant.value == 'inline' || ui.variant.value == 'pure')
    const mHideToolbar = computed(() => (presets.hideToolbar as boolean ?? props.hideToolbar) || ui.variant.value == 'inline' || ui.variant.value == 'pure')
    const mHideToolbarSettings = computed(() => (presets.hideToolbarSettings as boolean ?? props.hideToolbarSettings) || ui.variant.value == 'inline' || ui.variant.value == 'pure')
    const showError = ref(false)
    const mBladeClass = computed(() => {
        if (ui.variant.value == 'blade') {
            return ui.bladeData.show ? 'ma-1 mr-0' : 'ma-1 mr-0'
        }

        if (ui.variant.value == 'page')
            return 'ma-2 rounded'
        
        return ''
    })
    const mBladeStyle = computed(() => {
        if (ui.variant.value == 'blade') {
            if (widthIsPercent.value)
                return `width: ${position.width}%`

            return `width: ${position.width}px`
        }
        else {
            return ``
        }
    })
    // const mMinWidth = computed(() => position.width == 0 ? 0 : props.minWidth)

    watch(() => props.errorMsg, (v) => { showError.value = v != null })
    
</script>