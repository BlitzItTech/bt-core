<template>
    <v-window v-model="panel" :style="sliderStyle">
        <v-window-item>
            <v-list>
                <v-list-item
                    v-for="(setting, index) in cOptions"
                    append-icon="$arrow-right"
                    @click="panel = (index + 1)"
                    :disabled="setting.disabled"
                    :key="setting.value ?? setting.title"
                    :title="setting.title" />
            </v-list>
        </v-window-item>
        <v-window-item
            v-for="(setting) in cOptions"
            :key="setting.value ?? setting.title">
            <v-slide-x-transition hide-on-leave>
                <v-toolbar v-if="!hideHeader && !setting.hideHeader" density="compact" flat tile>
                    <v-btn icon="$arrow-left" @click="panel = 0" />
                    <v-toolbar-title>{{ setting.title }}</v-toolbar-title>
                </v-toolbar>
            </v-slide-x-transition>
            <slot :name="(setting.value ?? setting.title).replaceAll(' ', '').toLowerCase()">

            </slot>
        </v-window-item>
    </v-window>
</template>

<script setup lang="ts">
    import { useRoute } from 'vue-router'
    import { computed, onMounted, ref } from 'vue'

    interface SliderOption {
        disabled?: boolean
        hideHeader?: boolean
        title?: string
        value: any
    }

    interface SliderProps {
        hideHeader?: boolean
        options: SliderOption[]
        width?: number
    }

    const props = defineProps<SliderProps>()
    const panel = ref(0)
    const route = useRoute()
    const sliderStyle = computed(() => props.width != null ? `width: ${props.width}px` : '')

    const cOptions = computed(() => {
        const e = props.options ?? []
        return e.map((x: any) => {
            if (typeof x == 'string')
                return { title: x, value: x.replaceAll(' ', '').toLowerCase() }
            else
                return { ...x, value: x.value ?? x.title.replaceAll(' ', '').toLowerCase() }
        })
    })

    onMounted(() => {
        if (route?.query.slide != null) {
            const ind = props.options.findIndex(x => x.value == route?.query.slide)
            if (ind >= 0)
                panel.value = ind + 1
        }
    })
</script>