<template>
    <div>
        <v-btn v-if="!hideButton && !show"
            @click.stop="open"
            v-bind="$attrs" />
        <v-overlay
            @click:outside="() => stopCameraFeed()"
            v-model="show"
            z-index="1001">
            <template #default>
                <v-card
                    class="pa-0 ma-0 d-flex align-center justify-center"
                    :color="color"
                    :style="cardStyle">
                    <slot name="top"></slot>
                    <v-slide-x-transition>
                        <video v-if="currentData == null"
                            ref="videoEl"
                            style="height: 100vh; width: 100vw;"></video>
                        <img v-else
                            cover
                            :src="currentData"
                            style="max-height: 100vh; max-width: 100vw;" />
                    </v-slide-x-transition>
                    <canvas style="display: none;" ref="canva"></canvas>
                    <v-card
                        class="d-flex flex-column align-center justify-center"
                        color="primary"
                        style="position: fixed; opacity: 0.75; right: 0;"
                        width="60">
                        <v-slide-x-reverse-transition hide-on-leave group>
                            <v-btn
                                v-if="currentData == null"
                                class="my-3"
                                @click="cancel"
                                icon="$close"
                                key="1"
                                variant="tonal" />
                            <v-btn
                                v-if="currentData != null"
                                class="my-3"
                                @click="open"
                                icon="$close"
                                key="2"
                                variant="tonal" />
                            <v-btn
                                v-if="currentData == null"
                                class="text-error my-3"
                                @click="takePhoto"
                                icon="$circle"
                                key="3"
                                variant="tonal" />
                            <v-btn
                                v-if="currentData != null"
                                class="my-3"
                                @click="apply"
                                icon="$check"
                                key="4"
                                variant="tonal" />
                            <v-btn
                                v-if="currentData == null"
                                class="my-3"
                                @click="switchCamera"
                                :disabled="isLoading || videoDevices.length < 2"
                                icon="$camera-flip"
                                variant="tonal" />
                        </v-slide-x-reverse-transition>
                    </v-card>
                    <v-overlay :value="mIsLoading" class="text-center" z-index="1002">
                        <v-progress-circular indeterminate size="32" />
                        <p>Loading Image</p>
                    </v-overlay>
                </v-card>
            </template>
        </v-overlay>
    </div>
</template>

<script setup lang="ts">
    import { computed, onUnmounted, ref, watch } from 'vue'
    import { isLengthyArray } from '../composables/helpers.ts'

    interface CameraProps {
        color?: string
        fullscreen?: boolean
        hideButton?: boolean
        openToggle?: boolean
        usedHeight?: number
    }

    const emit = defineEmits(['cancel','change','close','open','update:modelValue'])

    const props = withDefaults(defineProps<CameraProps>(), {
        fullscreen: true,
        hideButton: false,
        usedHeight: 0
    })

    const canva = ref<HTMLCanvasElement | null>(null)
    const facingMode = ref<'environment' | 'user'>('environment')
    const isLoading = ref<boolean>(true)
    const mediaStream = ref<MediaStream>()
    const videoEl = ref<HTMLVideoElement | null>(null)
    const videoDevices = ref<MediaDeviceInfo[]>([])

    const cardStyle = computed(() => {
        if (props.fullscreen == true)
            return `height: calc(100vh - ${props.usedHeight}px); width: 100%;`

        return ''
    })

    const currentData = ref<string | undefined>()
    const show = ref(false)

    const mIsLoading = computed(() => {
        if (isLoading.value)
            return true

        if (currentData.value == null) {
            return mediaStream.value == null
        }

        return isLoading.value 
    })

    watch(() => props.openToggle, async () => {
        await open()
    })

    function stopCameraFeed() {
        const tracks = mediaStream.value?.getVideoTracks();

        if (isLengthyArray(tracks)) {
            tracks?.forEach(x => x.stop())
        }
    }

    async function startCameraFeed(mode: 'user' | 'environment') {
        if (videoEl.value == null)
            return

        facingMode.value = mode
        mediaStream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode }
        })

        videoEl.value.srcObject = mediaStream.value

        await videoEl.value.play()
    }

    async function switchCamera() {
        isLoading.value = true
        
        stopCameraFeed()

        await startCameraFeed(facingMode.value == 'environment' ? 'user' : 'environment')

        isLoading.value = false
    }

    function takePhoto() {
        if (videoEl.value == null || canva.value == null)
            return

        canva.value.width = videoEl.value.videoWidth
        canva.value.height = videoEl.value.videoHeight

        let ctx = canva.value.getContext('2d')

        if (ctx == null)
            return

        ctx.save()

        ctx.drawImage(videoEl.value, 0, 0)

        ctx.restore()

        currentData.value = canva.value.toDataURL('image/png')

        stopCameraFeed()
    }

    function apply() {
        stopCameraFeed()
        emit('update:modelValue', currentData.value)
        emit('change', currentData.value)
        emit('close')
        show.value = false
    }

    function cancel() {
        stopCameraFeed()
        emit('cancel')
        emit('close')
        show.value = false
    }

    /**clears and opens */
    async function open() {
        isLoading.value = true
        show.value = true
        currentData.value = undefined

        //load original?
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices.value = devices.filter((d) => d.kind === "videoinput");

        await startCameraFeed(videoDevices.value.length == 1 ? 'user' : 'environment')

        emit('open')
        
        isLoading.value = false
    }

    onUnmounted(() => {
        stopCameraFeed()
    })

</script>