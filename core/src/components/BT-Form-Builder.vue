<template>
    <div v-if="schema != null">
        <v-dialog
            fullscreen
            :retain-focus="false"
            transition="dialog-bottom-transition"
            v-model="dialog">
            <v-card>
                <v-container
                    class="pa-0"
                    fluid
                    :style="backStyle">
                    <v-toolbar color="primary">
                        <v-btn icon="$close" @click="dialog = false" />
                            <div v-if="title != null">
                                <div class="text-h6">{{ title }}</div>
                                <div v-if="schema.title != null" class="text-caption">
                                    {{ schema.title }}
                                </div>
                            </div>
                            <v-spacer />
                            <v-toolbar-items>
                                <v-btn
                                    @click="applyAndClose"
                                    text="Done"/>
                            </v-toolbar-items>
                    </v-toolbar>
                    
                    <div class="d-flex">
                        <v-container 
                            @click.stop="clearCurrent" 
                            style="height: calc(100vh - 64px)" 
                            :style="`background-color: ${schema.bgColor}`"
                            class="overflow-y-auto pa-0">
                            <v-toolbar v-if="schema.useLogoSrc && !isNullOrEmpty(schema.logoSrc)"
                                :style="`background-color: ${schema.bgColor}`">
                                <v-spacer />
                                <div class="mr-6">
                                    <bt-avatar :src="schema.logoSrc" />
                                </div>
                            </v-toolbar>
                            <v-list bg-color="transparent">
                                <v-slide-y-transition group hide-on-leave>
                                    <template v-for="(item, index) in schema.slides" :key="index">
                                        <slot 
                                            :name="`${item.name}-builder`"
                                            :slide="item">
                                            <div @click.stop="selectSlide(item)">
                                                <v-hover>
                                                    <template #default="{ isHovering, props }">
                                                        <v-card 
                                                            class="mx-1 my-6 pt-2 pb-5" 
                                                            :class="currentSlide === item ? 'text-primary' : undefined"
                                                            :ripple="false"
                                                            variant="outlined"
                                                            v-bind="props">
                                                            <div class="d-flex align-center">
                                                                <div style="min-height: 65px; min-width: 32px;" class="ml-2">
                                                                    <v-slide-x-transition>
                                                                        <div v-if="isHovering" key="2" class="d-flex flex-column">
                                                                            <v-btn
                                                                                @click="moveSlideUp(index)"
                                                                                class="ma-0 pa-0"
                                                                                :disabled="index == 0 || !isEditing"
                                                                                icon="$menu-up"
                                                                                size="x-small"
                                                                                variant="text" />
                                                                            <v-btn
                                                                                @click="moveSlideDown(index)"
                                                                                class="ma-0 pa-0"
                                                                                :disabled="index >= (schema.slides.length - 1) || !isEditing"
                                                                                icon="$menu-down"
                                                                                size="x-small"
                                                                                variant="text" />
                                                                        </div>
                                                                    </v-slide-x-transition>
                                                                </div>
                                                                <v-card-title>{{ item.name }}</v-card-title>
                                                                <v-spacer />
                                                                <v-slide-x-reverse-transition>
                                                                    <v-btn
                                                                        v-if="item?.canDelete !== false && isHovering"
                                                                        class="ma-0 mr-2 pa-0 text-error"
                                                                        @click.stop="removeSlide(item.name)"
                                                                        icon="$delete"
                                                                        variant="text" />
                                                                </v-slide-x-reverse-transition>
                                                            </div>
                                                            <div v-if="isLengthyArray(item.fields)" class="mx-4">
                                                                <drop-list :items="item.fields"
                                                                    @reorder="(ev: any) => ev.apply(item.fields)">
                                                                    <template #item="d">
                                                                        <drag :data="d.item" :delay="250" :key="d.index">
                                                                            <template #default>
                                                                                <div @click.stop="selectField(item, d.item)">
                                                                                    <BTFormField
                                                                                        :class="currentField === d.item ? 'elevation-23' : undefined"
                                                                                        :field="d.item"
                                                                                        :variant="fieldVariant" />
                                                                                </div>
                                                                            </template>
                                                                        </drag>
                                                                    </template>
                                                                    <template #feedback="{ data }">
                                                                        <v-skeleton-loader
                                                                            type="list-item-avatar-three-line"
                                                                            :key="data.id" />
                                                                    </template>
                                                                </drop-list>
                                                            </div>
                                                            <div v-if="item.canEdit !== false" class="d-flex flex-align">
                                                                <v-menu z-index="2500">
                                                                    <template #activator="{ props }">
                                                                        <v-btn
                                                                            class="mx-auto"
                                                                            :color="schema.btnColor"
                                                                            prepend-icon="$plus"
                                                                            text="Add Field"
                                                                            v-bind="props" />
                                                                    </template>
                                                                    <v-card>
                                                                        <v-row no-gutters>
                                                                            <v-col v-for="(comp, ind) in Fields" :key="ind"
                                                                                cols="6"
                                                                                md="4">
                                                                                <v-card
                                                                                    class="ma-1"
                                                                                    @click="addFieldToSlide(comp, item)"
                                                                                    :color="schema.btnColor"
                                                                                    :prepend-icon="comp.icon"
                                                                                    :subtitle="comp.description"
                                                                                    :title="comp.label" />
                                                                            </v-col>
                                                                        </v-row>
                                                                    </v-card>
                                                                </v-menu>
                                                            </div>
                                                        </v-card>
                                                    </template>
                                                </v-hover>
                                            </div>
                                        </slot>
                                    </template>
                                </v-slide-y-transition>
                            </v-list>
                            <div class="text-center ma-2">
                                <v-btn
                                    @click.stop="addSlide"
                                    :color="schema.btnColor"
                                    prepend-icon="$card-plus-outline"
                                    text="Add Slide" />
                            </div>
                        </v-container>
                        <v-card 
                            class="overflow-y-auto"
                            width="400"
                            style="height: calc(100vh - 64px)"
                            tile>
                            <v-toolbar>
                                <v-btn v-if="currentSlide != null || currentField != null"
                                    icon="$close"
                                    @click.stop="clearCurrent" />
                                <v-icon 
                                    v-else
                                    class="mx-3"
                                    icon="$cog" />
                                <div>
                                    <div class="text-h6">
                                        <span v-if="currentField != null">Field</span>
                                        <span v-else-if="currentSlide != null">Slide</span>
                                        <span v-else>Form</span>
                                    </div>
                                    <div class="text-caption">
                                        <span v-if="currentField != null">{{ currentField.type }}</span>
                                        <span v-else-if="currentSlide != null">{{ currentSlide.name }}</span>
                                        <span v-else>Properties</span>
                                    </div>
                                </div>
                                <v-spacer />
                                <v-toolbar-items>
                                    <v-btn
                                        v-if="currentField != null || currentSlide != null"
                                        :disabled="currentSlide?.canDelete == false"
                                        class="text-error"
                                        @click.stop="removeCurrent"
                                        icon="$delete" />
                                </v-toolbar-items>
                            </v-toolbar>
                            <div v-if="currentField != null">
                                <v-text-field
                                    v-if="isLabelType"
                                    hide-details
                                    label="Label"
                                    v-model="currentField.label" />
                                <v-textarea
                                    auto-grow
                                    hide-details
                                    label="Description"
                                    lines="three"
                                    v-model="currentField.description" />
                                <v-text-field
                                    v-if="isPlaceholderType"
                                    hide-details
                                    label="Placeholder"
                                    v-model="currentField.placeholder" />
                                <v-text-field
                                    v-if="isPropType"
                                    :readonly="currentSlide?.canEdit == false"
                                    label="Field Property"
                                    :rules="fieldPropRules"
                                    v-model="currentField.prop" />
                                <v-text-field
                                    v-if="currentField.type == 'button'"
                                    label="URL to navigate to"
                                    v-model="currentField.url" />
                                <v-switch
                                    v-if="isRequiredType"
                                    :color="currentField.isRequired ? 'primary' : undefined"
                                    inset
                                    :label="currentField.isRequired ? 'Required' : 'Not Required'"
                                    :readonly="currentSlide?.canEdit === false"
                                    v-model="currentField.isRequired" />
                                <v-switch
                                    v-if="currentField.type == 'button'"
                                    :color="currentField.isSubmitButton ? 'primary' : undefined"
                                    inset
                                    label="Submit On Click"
                                    :readonly="currentSlide?.canEdit === false"
                                    v-model="currentField.isSubmitButton" />
                            </div>
                            <div v-else-if="currentSlide != null">
                                <v-text-field
                                    :canEdit="currentSlide.canEdit !== false"
                                    label="Slide Name"
                                    :readonly="currentSlide?.canEdit === false"
                                    v-model="currentSlide.name" />
                            </div>
                            <div v-else>
                                <v-text-field
                                    disabled
                                    hide-details
                                    label="Version"
                                    v-model="schema.version" />
                                <v-text-field
                                    hide-details
                                    label="Form Title"
                                    v-model="schema.title" />
                                <v-select
                                    hide-details
                                    label="Form Variant"
                                    :items="['basic','half-and-half', 'single-page']"
                                    v-model="schema.variant" />

                                <v-switch
                                    :color="schema.useLogoSrc ? 'primary' : undefined"
                                    hide-details
                                    inset
                                    label="Show My Logo"
                                    v-model="schema.useLogoSrc" />

                                <v-switch
                                    :color="schema.useBgSrc ? 'primary' : undefined"
                                    hide-details
                                    inset
                                    label="Use Background Image"
                                    v-model="schema.useBgSrc" />

                                <v-list-subheader 
                                    v-if="schema.useBgSrc && imgProps != null"
                                    class="ml-2">Background Image</v-list-subheader>

                                <v-slide-x-transition hide-on-leave>
                                    <div
                                        v-if="schema.useBgSrc && imgProps != null"
                                        class="text-center">
                                        <BTImageSelect
                                            v-bind="imgProps"
                                            :src="schema.bgSrc" />
                                    </div>
                                </v-slide-x-transition>
                                

                                <v-list-subheader class="ml-2">Background Color</v-list-subheader>
                                <v-color-picker 
                                    width="100%"
                                    v-model="schema.bgColor" />

                                <v-list-subheader class="ml-2">Button Color</v-list-subheader>
                                <v-color-picker 
                                    width="100%"
                                    v-model="schema.btnColor" />
                            </div>
                        </v-card>
                    </div>
                </v-container>
            </v-card>
        </v-dialog>
        <BT-Form
            :actualUsedHeight="actualUsedHeight"
            :canSubmit="false"
            :data="formData"
            isEditing
            :onGetSchema="onGetSchema"
            :schema="schema">
            <template #form-toolbar-right>
                <div class="d-flex align-center py-1 mx-2">
                    <v-menu>
                        <template #activator="{ props }">
                            <v-btn
                                icon="$view-carousel"
                                size="x-small"
                                title="Form Variant"
                                v-bind="props" />
                        </template>
                        <v-list>
                            <v-list-subheader>Form Variant</v-list-subheader>
                            <v-list-item
                                @click.stop="schema.variant = 'basic'"
                                :active="schema.variant == 'basic'"
                                title="Basic" />
                            <v-list-item
                                @click.stop="schema.variant = 'single-page'"
                                :active="schema.variant == 'single-page'"
                                title="Single Page" />
                            <v-list-item
                                @click.stop="schema.variant = 'half-and-half'"
                                :active="schema.variant == 'half-and-half'"
                                title="Half And Half" />
                        </v-list>
                    </v-menu>
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <v-btn
                                class="ml-1"
                                icon="$palette"
                                size="x-small"
                                title="Background Color"
                                v-bind="props" />
                        </template>
                        <v-card>
                            <v-list-subheader class="ml-2">Background Color</v-list-subheader>
                            <v-color-picker 
                                @update:modelValue="applyAndClose"
                                width="250"
                                v-model="schema.bgColor" />
                        </v-card>
                    </v-menu>
                    <v-menu :close-on-content-click="false">
                        <template #activator="{ props }">
                            <v-btn
                                class="ml-1"
                                icon="$palette"
                                size="x-small"
                                title="Button Color"
                                v-bind="props" />
                        </template>
                        <v-card>
                            <v-list-subheader class="ml-2">Button Color</v-list-subheader>
                            <v-color-picker 
                                @update:modelValue="applyAndClose"
                                width="250"
                                v-model="schema.btnColor" />
                        </v-card>
                    </v-menu>
                    <v-btn
                        class="ml-1"
                        icon="$printer"
                        size="x-small" />
                    <v-btn
                        @click="openDialog"
                        class="ml-1"
                        icon="$pencil"
                        size="x-small"
                        title="Edit Template" />
                    <v-btn
                        class="ml-1"
                        icon="$view-list"
                        size="x-small" />
                </div>
            </template>

            <template v-for="f in schema.slides.flatMap(x => x.fields)" :key="f.prop" v-slot:[`${f.prop}`]="fieldProps">
                <slot
                    :name="f.prop"
                    v-bind="fieldProps">
                </slot>
            </template>

            <template v-for="slide in schema.slides" :key="slide.name" v-slot:[`${slide.name}`]="slotProps">
                <slot 
                    :name="slide.name"
                    v-bind="slotProps">
                </slot>
            </template>
        </BT-Form>
    </div>
</template>

<script setup lang="ts">
    import { isLengthyArray, isNullOrEmpty } from 'bt-core-app'
    import { Drag, DropList } from 'vue-easy-dnd'
    import BTFormField from './BT-Form-Field.vue'
    import BTForm from './BT-Form.vue'
    import { computed, onMounted, ref, watch } from 'vue'
    import { type AForm, Fields, useForms } from '../composables/forms.ts'
    import BTImageSelect from './BT-Image-Select.vue'

    const emits = defineEmits(['update:modelValue'])

    const props = withDefaults(defineProps<{
        actualUsedHeight?: number
        getBackgroundUrl: () => string
        getLogoUrl: () => string
        imgProps?: any
        isEditing?: boolean
        openToggle?: boolean
        modelValue?: string
        onGetSchema?: (schema: AForm) => AForm
        refreshToggle?: boolean
        title?: string
    }>(), {
        title: 'Form Builder'
    })

    const dialog = ref(false)
    const formData = ref<any>({})

    const {
        addFieldToSlide,
        addSlide,
        clearCurrent,
        currentField,
        currentSlide,
        fieldPropRules,
        isLabelType,
        isPlaceholderType,
        isPropType,
        isRequiredType,
        loadSchema,
        moveSlideDown,
        moveSlideUp,
        removeCurrent,
        removeSlide,
        schema,
        schemaString,
        selectField,
        selectSlide
    } = useForms({
        onGetSchema: props.onGetSchema
    })
  
    const backStyle = computed(() => {
        let bg = schema.value?.bgSrc
        if (schema.value?.useBgSrc == true && bg != null)
            return `background: url("${bg}") no-repeat top center fixed; -webkit-background-size: cover; -moz-background-size: cover; background-size: cover; -o-background-size: cover; min-height: 100%;`
        
        return undefined
    })

    const fieldVariant = computed(() => {
        if (schema.value == null)
            return undefined

        if (schema.value.variant == 'basic' || schema.value.variant == 'single-page')
            return 'text'
        else if (schema.value.variant == 'half-and-half')
            return 'tonal'

        return undefined
    })
    
    async function applyAndClose() {
        emits('update:modelValue', schemaString.value)
        dialog.value = false
    }

    function openDialog() {
        dialog.value = true
    }

    function setUrls(schema?: AForm) {
        if (schema == null)
            return

        if (isNullOrEmpty(schema.logoSrc) && props.getLogoUrl != null)
            schema.logoSrc = props.getLogoUrl()

        if (isNullOrEmpty(schema.bgSrc) && props.getBackgroundUrl != null)
            schema.bgSrc = props.getBackgroundUrl()
    }
    
    watch(() => props.openToggle, () => {
        dialog.value = true
    })

    watch(() => props.modelValue, v => {
        loadSchema(v)
        setUrls(schema.value)
    })



    onMounted(() => {
        loadSchema(props.modelValue)
        setUrls(schema.value)
    })

</script>