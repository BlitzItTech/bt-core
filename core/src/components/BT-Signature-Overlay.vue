<template>
    <div>
        <v-btn v-if="!hideButton && !show"
            @click.stop="open"
            v-bind="$attrs" />
        <v-overlay
            v-model="show"
            z-index="1001">
            <template #default>
                <v-card
                    class="pa-0 ma-0 d-flex align-center justify-center"
                    :color="color"
                    :style="cardStyle">
                    <slot name="top"></slot>
                    <VueSignaturePad
                        :options="padOptions"
                        ref="signaturePad" />
                    <v-card
                        class="d-flex flex-column align-center justify-center"
                        color="primary"
                        style="position: fixed; opacity: 0.75; right: 0;"
                        width="60">
                        <v-slide-x-reverse-transition hide-on-leave group>
                            <v-btn
                                class="my-3"
                                @click="cancel"
                                icon="$close"
                                key="1"
                                variant="tonal" />
                            <v-btn
                                class="my-3"
                                @click="clear"
                                :disabled="!canEdit"
                                icon="$eraser"
                                key="3"
                                variant="tonal" />
                            <v-btn
                                class="my-3"
                                @click="apply"
                                :disabled="!canEdit"
                                icon="$check"
                                key="4"
                                variant="tonal" />
                        </v-slide-x-reverse-transition>
                    </v-card>
                    <!-- <v-bottom-navigation
                        bg-color="primary"
                        density="comfortable"
                        grow
                        name="sign">
                        <v-btn
                            @click="cancel"
                            icon="$arrow-left" />
                        <v-btn
                            @click="clear"
                            :disabled="!canEdit"
                            icon="$eraser" />
                        <v-btn
                            @click="apply"
                            :disabled="!canEdit"
                            icon="$content-save" />
                    </v-bottom-navigation> -->
                </v-card>
            </template>
        </v-overlay>
    </div>
</template>

<script setup lang="ts">
    import { VueSignaturePad } from 'vue-signature-pad'
    import { computed, ref, toValue, watch } from 'vue'
    import { useTheme } from 'vuetify';

    interface SignProps {
        canEdit?: boolean
        color?: string
        fullscreen?: boolean
        hideButton?: boolean
        lineColor?: string
        modelValue?: string
        openToggle?: boolean
        signature?: string
        transparent?: boolean
        usedHeight?: number
    }

    const emit = defineEmits(['cancel','change','close','open','update:modelValue'])

    const props = withDefaults(defineProps<SignProps>(), {
        fullscreen: true,
        hideButton: false,
        transparent: false,
        usedHeight: 0
    })

    const cardStyle = computed(() => {
        if (props.fullscreen == true)
            return `height: calc(100vh - ${props.usedHeight}px); width: 100%;`

        return ''
    })

    const currentData = ref<string | undefined>()
    const show = ref(false)
    const signaturePad = ref<any>(null)
    const theme = useTheme()
    
    const cLineColor = computed(() => {
        return props.lineColor ?? (theme.name.value == 'dark' ? 'white' : 'black')
    })

    const padOptions = computed(() => {
        return {
            penColor: cLineColor.value
        }
    })

    function loadSignature(pad?: any, data?: string) {
        if (pad != null) {
            if (data == null) {
                pad.clearSignature()
            }
            else {
                const pArr = JSON.parse(data)
                if (pArr != null && pArr.length > 0)
                    pad.fromData([{ color: cLineColor.value, points: pArr }])
            }
        }
    }
    
    watch(signaturePad, el => {
        loadSignature(el, props.modelValue ?? props.signature)
    })

    watch(() => props.openToggle, () => {
        open()
    })

    watch(() => props.modelValue, v => {
        loadSignature(toValue(signaturePad), v)
    })

    watch(() => props.signature, v => {
        loadSignature(toValue(signaturePad), v)
    })

    function apply() {
        const pad = toValue(signaturePad)
        if (pad != null && !pad.isEmpty()) {
            //apply to current data
            const data = pad.toData()
            const arr: any[] = []
            data.forEach((d: any) => {
                d.points.forEach((p: any) => {
                    arr.push({ x: p.x, y: p.y });
                })
            })

            let minX = Math.min(...arr.map(x => x.x))
            let minY = Math.min(...arr.map(x => x.y))

            if (minX > 1)
                arr.forEach(x => { x.x -= minX })

            if (minY > 1)
                arr.forEach(x => { x.y -= minY })

            currentData.value = JSON.stringify(arr)

            const oldData = props.modelValue ?? props.signature

            //emit current data
            if (oldData != currentData.value) {
                emit('update:modelValue', currentData.value)
                emit('change', currentData.value)
                emit('close')

                show.value = false
            }
        }
    }

    function cancel() {
        emit('cancel')
        emit('close')
        show.value = false
    }

    function clear() {
        const pad = toValue(signaturePad)
        if (pad != null && !pad.isEmpty()) {
            pad.clearSignature()
        }
        currentData.value = undefined
    }

    function open() {
        currentData.value = props.modelValue ?? props.signature
        show.value = true
        emit('open')
    }

</script>