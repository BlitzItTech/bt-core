<template>
    <v-window v-model="lastPanel" :style="sliderStyle">
        <v-window-item>
            <v-list>
                <v-list-item
                    v-for="setting in listItemOptions"
                    append-icon="$arrow-right"
                    @click="navTo(setting.index)"
                    :disabled="setting.disabled"
                    :key="setting.value ?? setting.title"
                    :title="setting.title" />
            </v-list>
        </v-window-item>
        <v-window-item
            v-for="(setting) in paneOptions"
            :key="setting.value ?? setting.title"
            :value="setting.index">
            <slot :name="`${setting.value}-top`">
                <v-slide-x-transition hide-on-leave>
                    <v-toolbar v-if="!hideHeader && !setting.hideHeader" density="compact" flat tile>
                        <slot :name="`${setting.value}-toolbar`"
                            :back="() => navBack()"
                            :title="setting.title">
                            <v-btn icon="$arrow-left" @click="navBack" />
                            <v-toolbar-title>{{ setting.title }}</v-toolbar-title>
                            <v-spacer />
                            <slot :name="`${setting.value}-toolbar-right`">

                            </slot>
                        </slot>
                    </v-toolbar>
                </v-slide-x-transition>
            </slot>
            <slot :name="setting.value">
                
            </slot>
        </v-window-item>
    </v-window>
</template>

<script setup lang="ts">
    import { useRoute } from 'vue-router'
    import { computed, onMounted, ref, watch } from 'vue'

    interface SliderOption {
        disabled?: boolean
        hide?: boolean
        hideHeader?: boolean
        navHistory?: boolean
        title?: string
        value: any
    }

    interface SliderData extends SliderOption {
        index: number
    }

    interface SliderProps {
        hideHeader?: boolean
        options: SliderOption[]
        modelValue?: number
        width?: number
    }

    const emit = defineEmits(['update:modelValue'])
    const props = defineProps<SliderProps>()
    const route = useRoute()
    const sliderStyle = computed(() => props.width != null ? `width: ${props.width}px` : '')
    const history = ref<number[]>([])

    watch(() => route.query, q => {
        if (q.slide != null)
            navToSlide(q.slide as string)
    })
    
    const lastPanel = computed(() => history.value.length > 0 ? history.value[history.value.length - 1] : 0)

    const paneOptions = computed<SliderData[]>(() => {
        const e = props.options ?? []
        
        return e.map((x: SliderOption | string, index: number) => {
            var r: SliderData = { value: '', index: index + 1 }

            if (typeof x == 'string') {
                r.hide = false
                r.title = x as string
                r.value = r.title.replaceAll(' ', '').toLowerCase()
            }
            else {
                var s = x as SliderOption
                r = {
                    ...s,
                    index: index + 1,
                    value: s.value ?? s.title?.replaceAll(' ', '').toLowerCase()
                }
            }

            return r
        })
    })

    const listItemOptions = computed<SliderData[]>(() => paneOptions.value.filter(x => x.hide !== true))

    function navBack() {
        history.value.pop()
        // emit('update:modelValue', -2)
    }

    function navTo(panelIndex: number) {
        if (panelIndex == 0)
            history.value = [panelIndex]
        else if (lastPanel.value != panelIndex) {
            if (history.value.length == 0)
                history.value.push(0)

            history.value.push(panelIndex)
        }
    }

    function navToSlide(slide?: string) {
        if (slide == null)
            return

        const paneData = paneOptions.value.find(x => x.value == slide)
        if (paneData != null)
            navTo(paneData.index)
    }

    watch(lastPanel, v => {
        if (v != props.modelValue)
            emit('update:modelValue', v)
    })

    watch(() => props.modelValue, v => {
        // if (v != null && lastPanel.value !== (v + 1))
        //     navTo(v + 1)
        if (v != null && lastPanel.value != v)
            navTo(v)
    })

    onMounted(() => {
        if (route?.query.slide != null) {
            navToSlide(route?.query.slide as string)
            // const paneData = paneOptions.value.find(x => x.value == route?.query.slide)
            // if (paneData != null)
            //     navTo(paneData.index)
        }
    })
</script>