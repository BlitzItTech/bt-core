<template>
    <v-col
        :lg="mLg"
        :md="mMd"
        :sm="mSm"
        :cols="cols">
        <v-list-item>
            <v-list-item-subtitle>{{ label }}</v-list-item-subtitle>
            <v-list-item-title>
                <v-row dense>
                    <span v-if="useAutomation || useAutomationDaily || useAutomationLarge" class="mx-1">{{ automation }}</span>
                    <span v-if="useGuide || useGuideList" class="mx-1">{{ guide }}</span>
                    <span v-if="useTrigger || useScheduledTrigger || useTriggerList" class="mx-1">{{ trigger }}</span>
                    <span v-if="useCustom || useCustomList" class="mx-1">{{ custom }}</span>
                </v-row>
                
            </v-list-item-title>
            <template #append>
                <v-row dense>
                    <v-col>
                        <v-menu v-if="useAutomation || useAutomationDaily || useAutomationLarge">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" :disabled="!cIsEditing" :size="mSize" append-icon="mdi-menu-down" title="Automation">{{ automation ?? 'select' }}</v-btn>
                            </template>
                            <v-list 
                                :items="automationOptions"
                                item-title="text"
                                return-object
                                select-strategy="single-independent"
                                v-model:selected="automationValue" />
                        </v-menu>
                    </v-col>
                    
                    <v-col>
                        <v-menu v-if="useGuideList">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" :disabled="!cIsEditing" :size="mSize" append-icon="mdi-menu-down" title="Guide">{{ guide ?? 'select' }}</v-btn>
                            </template>
                            <v-list 
                                :items="guideOptions"
                                item-title="text"
                                return-object
                                select-strategy="single-independent"
                                v-model:selected="guideListValue" />
                        </v-menu>
                    </v-col>

                    <v-col>
                        <v-btn-toggle
                            v-if="useGuide"
                            v-bind="$attrs"
                            v-model="guideValue"
                            color="primary"
                            :disabled="!cIsEditing"
                            title="Guide">
                            <v-btn v-for="(opt, ind) in guideOptions"
                                :key="ind"
                                :icon="opt.icon"
                                :size="mSize"
                                :text="opt.text" />
                        </v-btn-toggle>
                    </v-col>

                    <v-col>
                        <v-menu v-if="useTriggerList">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" :disabled="!cIsEditing" append-icon="mdi-menu-down" title="Trigger">{{ trigger ?? 'select' }}</v-btn>
                            </template>
                            <v-list 
                                :items="triggerOptions"
                                item-title="text"
                                return-object
                                select-strategy="single-independent"
                                v-model:selected="triggerListValue" />
                        </v-menu>
                    </v-col>

                    <v-col>
                        <v-btn-toggle
                            v-if="useTrigger"
                            v-bind="$attrs"
                            v-model="triggerValue"
                            color="primary"
                            :disabled="!cIsEditing"
                            title="Trigger">
                            <v-btn v-for="(opt, ind) in triggerOptions"
                                :key="ind"
                                :icon="opt.icon"
                                :size="mSize"
                                :text="opt.text" />
                        </v-btn-toggle>
                    </v-col>

                    <v-col>
                        <v-menu v-if="useCustomList">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" :disabled="!cIsEditing" append-icon="mdi-menu-down">{{ custom ?? 'select' }}</v-btn>
                            </template>
                            <v-list 
                                :items="customOptions"
                                item-title="text"
                                return-object
                                select-strategy="single-independent"
                                v-model:selected="customListValue" />
                        </v-menu>
                    </v-col>

                    <v-col>
                        <v-btn-toggle
                            v-if="useCustom"
                            v-bind="$attrs"
                            v-model="customValue"
                            color="primary"
                            :disabled="!cIsEditing">
                            <v-btn v-for="(opt, ind) in customOptions"
                                :key="ind"
                                :icon="opt.icon"
                                :size="mSize"
                                :text="opt.text" />
                        </v-btn-toggle>
                    </v-col>
                </v-row>
            </template>
        </v-list-item>
    </v-col>
</template>

<script setup lang="ts">
import { type BladeDensity } from '../types.ts'
import { computed, inject, ref, type Ref } from 'vue'

    defineOptions({
        inheritAttrs: false
    })

    interface Option {
        text?: string
        value?: string
        icon?: string
    }

    interface FieldProps {
        automation?: any
        cols?: string | boolean
        custom?: any
        density?: BladeDensity
        guide?: any
        isEditing?: boolean
        isMobile?: boolean
        label: any
        lg?: string | boolean
        md?: string | boolean
        sm?: string | boolean
        options?: Option[]
        trigger?: any
        useAutomation?: boolean
        useAutomationDaily?: boolean
        useAutomationLarge?: boolean
        useCustom?: boolean
        useCustomList?: boolean
        useGuide?: boolean
        useGuideList?: boolean
        useScheduledTrigger?: boolean
        useTrigger?: boolean
        useTriggerList?: boolean
    }

    const props = withDefaults(defineProps<FieldProps>(), {
        isEditing: undefined,
        cols: '12',
        lg: false,
        md: false,
        sm: '6'
    })

    const mSize = inject('size', () => ref('small'), true)

    const emit = defineEmits(['update:automation', 'update:custom', 'update:guide', 'update:trigger'])
    let automationOptions: Ref<Option[]> = ref([])
    let customOptions: Ref<Option[]> = ref(props.options ?? [])
    let guideOptions: Ref<Option[]> = ref([])
    let triggerOptions: Ref<Option[]> = ref([])
    
    if (props.useScheduledTrigger) {
        triggerOptions.value = [
            { text: 'Manual', value: 'Manual', icon: 'mdi-account' },
            { text: 'Auto', value: 'Auto', icon: 'mdi-robot' },
            { text: 'Scheduled', value: 'Scheduled', icon: 'mdi-calendar' }
        ]
    }

    if (props.useTrigger) {
        triggerOptions.value = [
            { text: 'Manual', value: 'Manual', icon: 'mdi-account' },
            { text: 'Auto', value: 'Auto', icon: 'mdi-robot' },
        ]
    }

    if (props.useGuide) {
        guideOptions.value = [
            { text: 'Global', value: 'Settings', icon: 'mdi-earth' }, 
            { text: 'Individual', value: 'Agreements', icon: 'mdi-account-circle-outline' }
        ]
    }

    if (props.useAutomation) {
        automationOptions.value = [
            { text: 'Off', value: 'Off' },
            { text: 'Hourly', value: 'Hourly' },
            { text: '3 Hourly', value: 'EveryThreeHours' },
            { text: '12 Hourly', value: 'EveryTwelveHours' },
            { text: 'Daily', value: 'Daily' },
            { text: 'Weekly', value: 'Weekly' }
        ]
    }

    if (props.useAutomationDaily) {
        automationOptions.value = [
            { text: 'Off', value: 'Off' },
            { text: 'Daily', value: 'Daily' }
        ]
    }

    if (props.useAutomationLarge) {
        automationOptions.value = [
            { text: 'Off', value: 'Off' },
            { text: 'Daily', value: 'Daily' },
            { text: 'Weekly', value: 'Weekly' },
            { text: 'Monthly', value: 'Monthly' },
            { text: 'Yearly', value: 'Yearly' }
        ]
    }

    const automationValue = computed({
        get() {
            const v = props.automation != null ? automationOptions.value.find((x: any) => (x.value ?? x.text) == props.automation) : []
            return v ? [v] : []
        },
        set(value) {
            const v = (value?.length > 0 ? value[0] : undefined) as Option | undefined
            emit('update:automation', v?.value ?? v?.text ?? null)
        }
    })

    const customListValue = computed({
        get() {
            return props.custom != null ? customOptions.value.filter((x: any) => (x.value ?? x.text) == props.automation) : []
            // const v = props.custom != null ? customOptions.value.find((x: any) => (x.value ?? x.text) == props.automation) : []
            // return v ? [v] : []
        },
        set(value) {
            const v = (value?.length > 0 ? value[0] : undefined) as Option | undefined
            emit('update:custom', v?.value ?? v?.text ?? null)
        }
    })

    const customValue = computed({
        get() {
            return props.custom != null ? customOptions.value.findIndex((x: any) => (x.value ?? x.text) == props.custom) : null
        },
        set(value) {
            emit('update:custom', (value == null || value < 0) ? null : (customOptions.value[value].value ?? customOptions.value[value].text))
        }
    })

    const guideListValue = computed({
        get() {
            const v = props.guide != null ? guideOptions.value.find((x: any) => (x.value ?? x.text) == props.guide) : []
            return v ? [v] : []
        },
        set(value) {
            const v = (value?.length > 0 ? value[0] : undefined) as Option | undefined
            emit('update:guide', v?.value ?? v?.text ?? null)
        }
    })

    const guideValue = computed({
        get() {
            return props.guide != null ? guideOptions.value.findIndex((x: any) => (x.value ?? x.text) == props.guide) : null
        },
        set(value) {
            emit('update:guide', (value == null || value < 0) ? null : (guideOptions.value[value].value ?? guideOptions.value[value].text))
        }
    })

    const triggerListValue = computed({
        get() {
            const v = props.trigger != null ? triggerOptions.value.find((x: any) => (x.value ?? x.text) == props.trigger) : []
            return v ? [v] : []
        },
        set(value) {
            const v = (value?.length > 0 ? value[0] : undefined) as Option | undefined
            emit('update:trigger', v?.value ?? v?.text ?? null)
        }
    })

    const triggerValue = computed({
        get() {
            return props.trigger != null ? triggerOptions.value.findIndex((x: any) => (x.value ?? x.text) == props.trigger) : null
        },
        set(value) {
            emit('update:trigger', (value == null || value < 0) ? null : (triggerOptions.value[value].value ?? triggerOptions.value[value].text))
        }
    })

    const mIsEditing = inject('isEditing', () => ref(false), true)

    const cIsEditing = computed(() => props.isEditing ?? mIsEditing.value)
    const mIsMobile = inject('isMobile', () => ref(false), true)
    
    const mLg = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.lg)
    const mMd = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.md)
    const mSm = computed(() => (props.isMobile ?? mIsMobile.value) ? false : props.sm)
    
</script>