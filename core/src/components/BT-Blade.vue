<template>
    <v-card
        :class="mBladeClass"
        :color="transparent ? 'transparent' : undefined"
        :density="density"
        :flat="flat ?? (ui.variant.value == 'inline' || ui.variant.value == 'pure')"
        key="1"
        :min-height="minHeight"
        ref="blade"
        :rounded="(ui.variant.value == 'blade') ? '2' : '0'"
        :style="mBladeStyle">
        a{{ width }}
        b{{ position }}
        c{{ mBladeStyle }}
        d{{ startWidth }}
        e{{ bladeStartShowing }}
        f{{ lastWidth }}
        <v-slide-y-transition hide-on-leave>
            <v-toolbar v-if="!mHideToolbar"
                :color="toolbarVariant == 'inverted' ? undefined : 'primary'"
                :density="density"
                ref="handle">
                <slot name="blade-toolbar">
                    <slot name="blade-toolbar-left"></slot>
                    <v-btn
                        v-if="!mHideNavigation"
                            icon="$arrow-left"
                            :size="size"
                            title="Back"
                            @click="() => navBackward()" />
                    <slot name="blade-title-left"></slot>
                    <v-toolbar-title v-if="label != null">{{ label }}</v-toolbar-title>
                    <slot name="blade-title-right"></slot>
                    <v-spacer />
                    <slot name="blade-toolbar-right"></slot>
                </slot>
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
                        <slot name="bladeSettings"></slot>
                    </v-list>
                </v-menu>
            </v-toolbar>
        </v-slide-y-transition>
        <v-slide-y-transition hide-on-leave>
            <v-toolbar v-if="!mHideSubtoolbar"
                :color="toolbarVariant == 'inverted' ? undefined : 'primary'"
                :density="density"
                tile>
                <slot name="subtoolbar"></slot>
            </v-toolbar>
        </v-slide-y-transition>
        <v-row v-if="!hideToolbar && (ui.variant.value == 'inline' || ui.variant.value == 'dialog')" no-gutters>
            <slot name="blade-toolbar-left"></slot>
            <v-list-subheader v-if="label != null">{{ label }}</v-list-subheader>
            <v-spacer />
            <slot name="blade-toolbar-right"></slot>
        </v-row>
        <v-slide-y-transition>
            <v-alert 
                closable 
                color="red-lighten-1"
                title="Error" 
                v-model="showError">{{ errorMsg }}</v-alert>
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
</template>

<script setup lang="ts">
    import { type ComponentPublicInstance } from 'vue'
    import type { BladeDensity, BladeVariant, UseBladeOptions } from '../composables/blade.ts'
    import { usePresets } from '../composables/presets.ts'
    import { useBlade } from '../composables/blade.ts'
    import { useNavBack } from '../composables/navigation.ts'
    import { computed, provide, ref, watch } from 'vue'
    import { useSpring } from 'vue-use-spring'
    import { useDisplay } from 'vuetify'
    import { EditVariant, useComponentConfig, ViewVariant } from '../composables/component-config.ts'

    interface BProps extends UseBladeOptions {
        density?: BladeDensity
        editVariant?: EditVariant
        errorMsg?: string
        flat?: boolean
        getNavBack?: () => void | undefined
        hideBladeControls?: boolean
        hideNavigation?: boolean
        hideSubtoolbar?: boolean
        hideToolbar?: boolean
        hideToolbarSettings?: boolean
        label?: string
        loadingMsg?: string
        minHeight?: string
        noMargins?: boolean
        preset?: string
        size?: string | number
        toolbarVariant?: 'default' | 'inverted'
        transparent?: boolean
        variant?: BladeVariant
        viewVariant?: ViewVariant
        width?: string | number
    }

    const props = withDefaults(defineProps<BProps>(), {
        bladeStartShowing: true,
        density: 'compact',
        flat: undefined,
        hideToolbarSettings: true,
        minHeight: undefined,
        noMargins: undefined,
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
    
    let lastWidth: number = 400
    const position = useSpring({ width: startWidth.value })
    const { xs } = useDisplay()
    
    const blade = ref<ComponentPublicInstance | null>(null)
    const handle = ref<ComponentPublicInstance | null>(null)
    const { navBack } = useNavBack()
    
    function navBackward() {
        var getNavBack = props.getNavBack ?? (() => undefined)
        var goBack = getNavBack() ?? navBack
        goBack()
    }

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
            if (position.width == 0)
                position.width = (widthIsPercent && props.width != null) ? Number.parseInt(props.width as string) : lastWidth
        }
    })

    const { editVariant, viewVariant } = useComponentConfig()
    
    provide('isMobile', ui.isMobile)
    provide('editVariant', props.editVariant ?? editVariant ?? 'outlined')
    provide('viewVariant', props.viewVariant ?? viewVariant ?? 'list-item')

    const isLoading = computed(() => props.loadingMsg != null)
    const mHideBladeControls = computed(() => (presets.hideBladeControls as boolean ?? props.hideBladeControls) || (ui.variant.value != 'blade' && ui.variant.value != 'page'))
    const mHideNavigation = computed(() => (presets.hideNavigation as boolean ?? props.hideNavigation) || ui.variant.value == 'inline' || ui.variant.value == 'pure' || ui.variant.value == 'dialog')
    const mNoMargins = computed(() => {
        const res = (presets.noMargins as boolean ?? props.noMargins)
        return res != null ? res : xs.value
    })
    const mHideSubtoolbar = computed(() => (presets.hideSubtoolbar as boolean ?? props.hideSubtoolbar) || ui.variant.value == 'inline' || ui.variant.value == 'pure' || ui.variant.value == 'dialog')
    const mHideToolbar = computed(() => (presets.hideToolbar as boolean ?? props.hideToolbar) || ui.variant.value == 'inline' || ui.variant.value == 'pure' || ui.variant.value == 'dialog')
    const mHideToolbarSettings = computed(() => (presets.hideToolbarSettings as boolean ?? props.hideToolbarSettings) || ui.variant.value == 'inline' || ui.variant.value == 'pure' || ui.variant.value == 'dialog')
    const showError = ref(false)
    const mBladeClass = computed(() => {
        if (mNoMargins.value)
            return ''
        
        if (ui.variant.value == 'blade') {
            return ui.bladeData.show ? 'ma-1 mr-0' : 'ma-1 mr-0'
        }

        if (ui.variant.value == 'page')
            return 'ma-2 rounded'
        
        return ''
    })
    const mBladeStyle = computed(() => {
        if (ui.variant.value == 'blade' || ui.variant.value == 'dialog') {
            if (widthIsPercent.value)
                return `width: ${position.width}%`

            return `width: ${position.width}px`
        }
        else {
            return ''
        }
    })

    watch(() => props.errorMsg, (v) => { showError.value = v != null })
    
</script>