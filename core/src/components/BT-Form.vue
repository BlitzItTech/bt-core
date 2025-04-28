<template>
    <v-container v-if="schema != null && v == 'basic'" 
        class="ma-0 pa-0"
        fluid
        :style="backStyle">
        <v-container>
            <v-card class="w-100" :style="`background-color: ${schema.bgColor}`">
                <v-window v-model="currentSlide">
                    <v-window-item v-for="(slide, ind) in schema.slides" :key="ind">
                        <v-form>
                            <template #default="{ isValid }">
                                <v-toolbar v-if="hideHeader !== true"
                                    :style="`background-color: ${schema.bgColor}`">
                                    <slot name="form-toolbar">
                                        <slot name="form-toolbar-left"></slot>
                                        <v-btn icon="$chevron-left" @click="currentSlide--" :disabled="currentSlide == 0" variant="text" />
                                        <v-btn icon="$chevron-right" @click="currentSlide++" :disabled="!isValid.value || currentSlide >= (schema.slides.length - 1)" variant="text" />
                                        <div class="text-h6 ml-3">{{ label ?? schema.title }}</div>
                                        <v-spacer />
                                        <slot name="form-toolbar-right"></slot>
                                        <v-slide-x-transition>
                                            <v-btn
                                                v-if="isChanged && canSaveProgress !== false"
                                                @click.stop="saveProgress"
                                                class="mr-4"
                                                prepend-icon="$content-save"
                                                size="small"
                                                text="Save"
                                                variant="outlined" />
                                        </v-slide-x-transition>
                                        <div v-if="mLogoUrl != null" class="d-flex justify-center mr-6">
                                            <bt-avatar
                                                v-if="mLogoUrl != null"
                                                :src="mLogoUrl" />
                                        </div>
                                    </slot>
                                </v-toolbar>
                                <div :style="useScroll ? colStyle : undefined">
                                    <bt-error :errorMsg="errorMsg" />
                                    <bt-loader :loadingMsg="loadingMsg" />
                                    <slot 
                                        :data="data"
                                        :name="slide.name"
                                        :slide="slide">
                                        <div v-for="(field, fieldInd) in slide.fields" :key="fieldInd">
                                            <slot 
                                                :name="field.prop"
                                                :data="data"
                                                :field="field"
                                                variant="text">
                                                <BTFormField
                                                    :data="data"
                                                    :field="field"
                                                    :isEditing="mIsEditing"
                                                    variant="text" />
                                            </slot>
                                        </div>
                                    </slot>
                                    <div class="d-flex align-center">
                                        <v-slide-y-reverse-transition group hide-on-leave>
                                            <v-btn
                                                v-if="currentSlide != 0"
                                                @click="currentSlide--"
                                                class="ma-4"
                                                :color="schema.btnColor"
                                                key="1"
                                                text="Back" />
                                        </v-slide-y-reverse-transition>
                                        <v-spacer />
                                        <v-slide-y-reverse-transition group hide-on-leave>
                                            <v-btn
                                                v-if="currentSlide < (schema.slides.length - 1)"
                                                @click="currentSlide++"
                                                class="ma-4"
                                                :color="schema.btnColor"
                                                :disabled="!isValid.value"
                                                key="1"
                                                text="Next" />
                                            <v-btn
                                                v-else-if="isEditing && canSubmit && !isSubmitted && currentSlide >= (schema.slides.length - 1)"
                                                @click="submitForm"
                                                class="ma-4"
                                                :color="schema.btnColor"
                                                :disabled="!isValid.value"
                                                key="2"
                                                text="Submit" />
                                        </v-slide-y-reverse-transition>
                                    </div>
                                </div>
                            </template>
                        </v-form>
                    </v-window-item>
                    <v-window-item>
                        <v-toolbar v-if="hideHeader !== true" color="transparent">
                            <v-btn icon="$chevron-left" @click="currentSlide--" :disabled="currentSlide == 0" variant="text" />
                            <div class="text-h6 ml-3">{{ label ?? schema.title }}</div>
                            <v-spacer />
                            <div v-if="mLogoUrl != null" class="d-flex justify-center mr-6">
                                <bt-avatar
                                    v-if="mLogoUrl != null"
                                    :src="mLogoUrl" />
                            </div>
                        </v-toolbar>
                        <div :style="useScroll ? colStyle : undefined" class="d-flex flex-column align-center justify-center">
                            Done!  Thankyou.
                        </div>
                    </v-window-item>
                </v-window>
            </v-card>
        </v-container>
    </v-container>
    <v-container v-else-if="schema != null && v == 'single-page'"
        class="ma-0 pa-0"
        fluid
        :style="backStyle">
        <v-container>
            <v-form>
                <template #default="{ isValid }">
                    <v-card class="w-100" :style="`background-color: ${schema.bgColor}`">
                        <v-toolbar v-if="hideHeader !== true"
                            :style="`background-color: ${schema.bgColor}`">
                            <slot name="form-toolbar">
                                <slot name="form-toolbar-left"></slot>
                                <v-btn icon="$chevron-left" @click="currentSlide--" :disabled="currentSlide == 0" variant="text" />
                                <v-btn icon="$chevron-right" @click="currentSlide++" :disabled="!isValid.value || currentSlide >= (schema.slides.length - 1)" variant="text" />
                                <div class="text-h6 ml-3">{{ label ?? schema.title }}</div>
                                <v-spacer />
                                <slot name="form-toolbar-right"></slot>
                                <v-slide-x-transition>
                                    <v-btn
                                        v-if="isChanged && canSaveProgress !== false"
                                        @click.stop="saveProgress"
                                        class="mr-4"
                                        prepend-icon="$content-save"
                                        size="small"
                                        text="Save"
                                        variant="outlined" />
                                </v-slide-x-transition>
                                <div v-if="mLogoUrl != null" class="d-flex justify-center mr-6">
                                    <bt-avatar
                                        v-if="mLogoUrl != null"
                                        :src="mLogoUrl" />
                                </div>
                            </slot>
                        </v-toolbar>
                        <div :style="useScroll ? colStyle : undefined">
                            <bt-error :errorMsg="errorMsg" />
                            <bt-loader :loadingMsg="loadingMsg" />
                            <div v-for="(slide, ind) in schema.slides" :key="ind">
                                <div v-if="!isNullOrEmpty(slide.name)" class="d-flex align-center ma-4">
                                    <v-divider style="max-width: 50px;" />
                                    <div class="mx-4 text-no-wrap">{{ slide.name }}</div>
                                    <v-divider />
                                </div>
                                <slot 
                                    :data="data"
                                    :name="slide.name"
                                    :slide="slide">
                                    <div v-for="(field, fieldInd) in slide.fields" :key="fieldInd">
                                        <slot
                                            :name="field.prop"
                                            :data="data"
                                            :field="field"
                                            variant="text">
                                            <BTFormField
                                                :data="data"
                                                :field="field"
                                                :isEditing="mIsEditing"
                                                variant="text" />
                                        </slot>
                                    </div>
                                </slot>
                            </div>
                            <div v-if="isEditing && canSubmit" class="d-flex">
                                <v-spacer />
                                <v-btn
                                    v-if="!isSubmitted"
                                    @click="submitForm"
                                    class="ma-4"
                                    :color="schema.btnColor"
                                    :disabled="!isValid.value"
                                    text="Submit" />
                                <div v-else class="ma-4">
                                    Done. Thankyou!
                                </div>
                            </div>
                        </div>
                    </v-card>
                </template>
            </v-form>
        </v-container>
    </v-container>
    <v-container
        v-else-if="schema != null && v == 'half-and-half'"
        class="pa-0 ma-0"
        fluid
        :style="backStyle">
        <v-col class="pa-0" cols="12" md="6">
            <v-card class="w-100" :style="`background-color: ${schema.bgColor}`" tile>
                <v-window v-model="currentSlide">
                    <v-window-item v-for="(slide, ind) in schema.slides" :key="ind">
                        <v-form>
                            <template #default="{ isValid }">
                                <v-toolbar v-if="hideHeader !== true"
                                    :style="`background-color: ${schema.bgColor}`">
                                    <slot name="form-toolbar">
                                        <slot name="form-toolbar-left"></slot>
                                        <v-btn icon="$chevron-left" @click="currentSlide--" :disabled="currentSlide == 0" variant="text" />
                                        <v-btn icon="$chevron-right" @click="currentSlide++" :disabled="!isValid.value || currentSlide >= (schema.slides.length - 1)" variant="text" />
                                        <div class="text-h6 ml-3">{{ label ?? schema.title }}</div>
                                        <v-spacer />
                                        <slot name="form-toolbar-right"></slot>
                                        <v-slide-x-transition>
                                            <v-btn
                                                v-if="isChanged && canSaveProgress !== false"
                                                @click.stop="saveProgress"
                                                class="mr-4"
                                                prepend-icon="$content-save"
                                                size="small"
                                                text="Save"
                                                variant="outlined" />
                                        </v-slide-x-transition>
                                        <div v-if="mLogoUrl != null" class="d-flex justify-center mr-6">
                                            <bt-avatar
                                                v-if="mLogoUrl != null"
                                                :src="mLogoUrl" />
                                        </div>
                                    </slot>
                                </v-toolbar>
                                <div :style="useScroll ? colStyle : undefined">
                                    <bt-error :errorMsg="errorMsg" />
                                    <v-col class="pa-0 mx-auto" cols="12" lg="6">
                                        <slot
                                            :data="data"
                                            :name="slide.name"
                                            :slide="slide">
                                            <div v-for="(field, fieldInd) in slide.fields" :key="fieldInd">
                                                <slot
                                                    :name="field.prop"
                                                    :data="data"
                                                    :field="field"
                                                    variant="tonal">
                                                    <BTFormField
                                                        :data="data"
                                                        :field="field"
                                                        :isEditing="mIsEditing"
                                                        variant="tonal" />
                                                </slot>
                                            </div>
                                        </slot>
                                        <div class="d-flex align-center">
                                            <v-slide-y-reverse-transition group hide-on-leave>
                                                <v-btn
                                                    v-if="currentSlide != 0"
                                                    @click="currentSlide--"
                                                    class="ma-4"
                                                    :color="schema.btnColor"
                                                    key="1"
                                                    text="Back" />
                                            </v-slide-y-reverse-transition>
                                            <v-spacer />
                                            <v-slide-y-reverse-transition group hide-on-leave>
                                                <v-btn
                                                    v-if="currentSlide < (schema.slides.length - 1)"
                                                    @click="currentSlide++"
                                                    class="ma-4"
                                                    :color="schema.btnColor"
                                                    :disabled="!isValid.value"
                                                    key="1"
                                                    text="Next" />
                                                <v-btn
                                                    v-else-if="isEditing && canSubmit && !isSubmitted && currentSlide >= (schema.slides.length - 1)"
                                                    @click="submitForm"
                                                    class="ma-4"
                                                    :color="schema.btnColor"
                                                    :disabled="!isValid.value"
                                                    key="2"
                                                    text="Submit" />
                                            </v-slide-y-reverse-transition>
                                        </div>
                                    </v-col>
                                </div>
                            </template>
                        </v-form>
                    </v-window-item>
                    <v-window-item>
                        <v-toolbar v-if="hideHeader !== true" color="transparent">
                            <v-btn icon="$chevron-left" @click="currentSlide--" :disabled="currentSlide == 0" variant="text" />
                            <div class="text-h6 ml-3">{{ label ?? schema.title }}</div>
                            <v-spacer />
                            <div v-if="mLogoUrl != null" class="d-flex justify-center mr-6">
                                <bt-avatar
                                    v-if="mLogoUrl != null"
                                    :src="mLogoUrl" />
                            </div>
                        </v-toolbar>
                        <div :style="useScroll ? colStyle : undefined" class="d-flex flex-column align-center justify-center">
                            Done!  Thankyou.
                        </div>
                    </v-window-item>
                </v-window>
            </v-card>
        </v-col>
        <bt-loader :loadingMsg="loadingMsg" />
    </v-container>
</template>

<script setup lang="ts">
    import BTFormField from './BT-Form-Field.vue'
    import { AFormVariant, type AForm } from '../composables/forms.ts'
    import { computed, onMounted, ref, watch } from 'vue'
    import { isNullOrEmpty } from '../composables/helpers.ts'
    import { useResponsiveStyle } from '../composables/heights.ts'

    const props = withDefaults(defineProps<{
        actualUsedHeight?: number
        backgroundUrl?: string
        canSaveProgress?: boolean
        canSubmit?: boolean
        hideHeader?: boolean
        isEditing?: boolean
        data: any
        label?: string
        logoUrl?: string
        onSaveAsync?: () => Promise<string | undefined>
        onSubmitAsync?: () => Promise<string | undefined>
        resetToggle?: boolean
        schema: AForm
        useBackgroundUrl?: boolean
        useLogoUrl?: boolean
        useScroll?: boolean
        variant?: AFormVariant
    }>(), {
        actualUsedHeight: 0,
        canSubmit: true,
        useBackgroundUrl: true,
        useLogoUrl: true,
        useScroll: true
    })

    const backStyle = computed(() => {
        let bg = props.backgroundUrl ?? props.schema.bgSrc
        if (bg != null && props.useBackgroundUrl)
            return `background: url("${bg}") no-repeat top center fixed; -webkit-background-size: cover; -moz-background-size: cover; background-size: cover; -o-background-size: cover; min-height: 100%;`
        
        return undefined
    })

    const snapshotJSON = ref<string | undefined>()
    const dataJSON = computed<string | undefined>(() => JSON.stringify(props.data))
    const isChanged = computed(() => dataJSON.value != snapshotJSON.value)

    const { style: colStyle } = useResponsiveStyle({
        getUsedHeight() {
            var r = 64 + props.actualUsedHeight + (v.value == 'half-and-half' ? 0 : 32) // (props.actualUsedHeight ?? 0) + (props.hideHeader == true ? 0 : 64)
            console.log(r)
            return r
        },
        overflow: true
    })

    const v = computed(() => props.variant ?? props.schema.variant ?? 'basic')

    const currentSlide = ref(0)
    const errorMsg = ref<string | undefined>()
    const isSubmitted = ref(false)
    const loadingMsg = ref<string | undefined>()
    const mIsEditing = computed(() => props.isEditing && !isSubmitted.value)
    const mLogoUrl = computed(() => {
        if (props.useLogoUrl)
            return props.logoUrl ?? props.schema.logoSrc

        return undefined
    })

    async function saveProgress() {
        loadingMsg.value = 'Saving Progress'
        errorMsg.value = props.onSaveAsync != null ? (await props.onSaveAsync()) : undefined
        loadingMsg.value = undefined
        snapshotJSON.value = JSON.stringify(props.data)
    }

    async function submitForm() {
        loadingMsg.value = 'Submitting'
        errorMsg.value = props.onSubmitAsync != null ? (await props.onSubmitAsync()) : undefined
        loadingMsg.value = undefined
        currentSlide.value++
        isSubmitted.value = true
    }

    watch(() => props.data, (v) => {
        snapshotJSON.value = JSON.stringify(v)
    }, { deep: false })

    onMounted(() => {
        snapshotJSON.value = JSON.stringify(props.data)
    })
</script>