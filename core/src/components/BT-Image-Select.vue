<template>
    <div class="mx-auto">
        <v-dialog
            v-if="canEdit"
            v-model="modal"
            :max-width="maxDialogWidth"
            :min-width="minDialogWidth"
            :width="dialogWidth">
            <template #activator="{ props }">
                    <v-btn
                        @click="open"
                        class="mx-auto pa-1"
                        :color="color"
                        :height="height + 35"
                        :width="width + 15"
                        v-bind="props">
                        <v-hover v-slot="{ isHovering, props }">
                            <v-container class="pa-0 ma-0" v-bind="props">
                                <div v-if="!isNullOrEmpty(label)" class="my-1">{{ label }}</div>
                                <v-img
                                    :height="height"
                                    :src="url"
                                    :width="width">
                                    <template #placeholder>
                                        <div class="d-flex flex-column align-center">
                                            <v-icon :size="mSize - 15">{{ placeholderIcon }}</v-icon>
                                            <p>Upload Image</p>
                                        </div>
                                    </template>
                                </v-img>
                                
                                <v-overlay 
                                    v-if="isHovering"
                                    class="align-center justify-center"
                                    :opacity="0.75"
                                    v-model="showO"
                                    contained>
                                    <div class="text-white">
                                        <v-icon start>$pencil</v-icon>Edit Image
                                    </div>
                                </v-overlay>
                                
                            </v-container>
                        </v-hover>
                    </v-btn>
            </template>
            <v-card
                class="text-center"
                :loading="actionLoadingMsg != null"
                width="100%">
                <v-card-title>Image Editor</v-card-title>
                <v-card-text>
                    <VuePictureCropper
                        :boxStyle="{
                            height: '100%',
                            margin: 'auto',
                            width: '100%'
                        }"
                        :img="imgData"
                        :options="{
                            aspectRatio: 1,
                            cropBoxResizable: false,
                            dragMode: 'move',
                            viewMode: 1
                        }"
                        :presetMode="{
                            height: imageHeight,
                            mode: 'fixedSize',
                            width: imageWidth
                        }" />
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        @click="open"
                        color="primary"
                        prepend-icon="$pencil"
                        :text="selectedFile != null ? 'Change Image' : 'Select Image'" />
                    <v-spacer />
                    <v-btn
                        @click="save"
                        color="primary"
                        :disabled="selectedFile == null && imageData == null"
                        prepend-icon="$content-save"
                        text="Save" />
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-container v-else>
            <v-img :src="url" :height="height" :width="width">
                <template #placeholder>
                    <v-icon :size="size">{{ placeholderIcon }}</v-icon>
                </template>
            </v-img>
        </v-container>
    </div>
</template>

<script setup lang="ts">
    import VuePictureCropper, { cropper } from 'vue-picture-cropper'
    import { computed, ref } from 'vue'
    import { isNullOrEmpty } from '../composables/helpers.ts'
    import { useActions } from '../composables/actions.ts'
    import { useFileDialog } from '@vueuse/core'

    interface ImgProps {
        additionalURL?: string
        canEdit?: boolean
        color?: string
        dialogWidth?: string
        height?: number
        id?: string
        imageHeight?: number
        imageWidth?: number
        label?: string
        maxDialogWidth?: string | number
        minDialogWidth?: string | number
        nav?: string
        placeholderIcon?: string
        proxyID?: string
        size?: string
        src?: string
        width?: number
    }

    const emit = defineEmits(['uploaded'])

    const props = withDefaults(defineProps<ImgProps>(), {
        canEdit: true,
        dialogWidth: 'auto',
        maxDialogWidth: 600,
        minDialogWidth: 100,
        height: 100,
        imageHeight: 256,
        imageWidth: 256,
        placeholderIcon: '$cube-outline',
        size: '100',
        width: 100
    })

    const showO = ref(true)

    const imageData = ref<any>()
    const mSize = computed(() => Number.parseInt(props.size))
    const modal = ref(false)
    const { actionLoadingMsg, apiUpload } = useActions()
    const selectedFile = ref<File>()
    const imgData = ref<string>()
    const cacheData = ref<string>(new Date().getTime().toString())
    const url = computed(() => `${props.src}?${cacheData.value}`)

    const { onChange, open } = useFileDialog({
        accept: 'image/*'
    })

    onChange((files) => {
        imgData.value = ''

        if (files != null && files.length > 0)
            selectedFile.value = files[0]
        else
            selectedFile.value = undefined

        if (selectedFile.value != null) {
            const reader = new FileReader()
            reader.readAsDataURL(selectedFile.value)
            reader.onload = () => {
                imgData.value = String(reader.result)
            }
        }
    })

    async function save() {
        if (!cropper) return

        try {
            const blob = await cropper.getBlob()

            await apiUpload({
                additionalUrl: props.additionalURL,
                data: blob,
                id: props.id,
                nav: props.nav,
                proxyID: props.proxyID
            })

            cacheData.value = new Date().getTime().toString()

            emit('uploaded')
            modal.value = false
        }
        catch {
            modal.value = false
        }
    }

</script>