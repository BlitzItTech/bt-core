<template>
    <v-card
        :height="fullscreen ? '100vh' : height"
        :width="fullscreen ? '100vw' : width">
        <slot name="top">
            <v-toolbar v-if="label != null">
                <v-toolbar-title>{{ label }}</v-toolbar-title>
                <slot name="actions" />
            </v-toolbar>
        </slot>
        <VueSignaturePad
            disabled
            :options="padOptions"
            ref="signaturePad" />
    </v-card>
</template>

<script setup lang="ts">
    import { VueSignaturePad } from 'vue-signature-pad'
    import { computed, ref, toValue, watch } from 'vue'
    import { useTheme } from 'vuetify';

    interface SignProps {
        fullscreen?: boolean
        height?: string
        label?: string
        lineColor?: string
        width?: string

        modelValue?: string
        openToggle?: boolean
        usedHeight?: number
    }

    const emit = defineEmits(['cancel','change','close','open','update:modelValue'])

    const props = withDefaults(defineProps<SignProps>(), {
        fullscreen: false,
        height: '400px',
        hideButton: false,
        transparent: false,
        width: '100%'
    })

    const signaturePad = ref<any>(null)
    const theme = useTheme()

    const actualHeight = computed(() => {
        const pad = toValue(signaturePad)
        if (pad != null)
            return pad.signaturePad.canvas.height / window.devicePixelRatio

        return undefined
    })

    const actualWidth = computed(() => {
        const pad = toValue(signaturePad)
        if (pad != null)
            return pad.signaturePad.canvas.width / window.devicePixelRatio

        return undefined
    })

    const cLineColor = computed(() => {
        return props.lineColor ?? (theme.name.value == 'dark' ? 'white' : 'black')
    })
   
    const padOptions = computed(() => {
        return {
            dotSize: 0.5,
            penColor: cLineColor.value
        }
    })
    
    watch(signaturePad, el => {
        if (el != null) {
            el?.lockSignaturePad()
            if (props.modelValue != null) {
                const pArr = JSON.parse(props.modelValue)
                if (pArr != null && pArr.length > 0) {
                    el?.fromData([{ color: cLineColor.value, points: reduceToSize(pArr)}])
                }
            }
        }
    })

    watch(() => props.modelValue, v => {
        const pad = toValue(signaturePad)
        if (pad != null) {
            if (v == null) {
                pad.clearSignature()
            }
            else {
                const pArr = JSON.parse(v)
                if (pArr != null && pArr.length > 0) {
                    pad.fromData([{ color: cLineColor.value, points: reduceToSize(pArr)}])
                    pad.lockSignaturePad()
                }
            }
        }
    })

    function reduceToSize(arr: any[]) {
        if (actualHeight.value != null && actualWidth.value != null) {
            let maxHeight = Math.max(...arr.map(x => x.y))
            let maxWidth = Math.max(...arr.map(x => x.x))

            let heightRatio = 1
            let widthRatio = 1

            if (maxHeight > actualHeight.value)
                heightRatio = actualHeight.value / maxHeight

            if (maxWidth > actualWidth.value)
                widthRatio = actualWidth.value / maxWidth

            let ratio = Math.min(heightRatio, widthRatio)

            if (ratio < 1)
                return arr.map(z => {
                    return {
                        x: z.x * ratio,
                        y: z.y * ratio
                    }
                })
        }

        return arr
    }

</script>