<template>
    <v-container class="ma-0 pa-0 mt-3">
        <slot name="display" :value="val">
            <v-text-field
                color="transparent"
                :disabled="disableTextField"
                hide-details
                tile
                v-model="val" />
        </slot>

        <v-row class="ma-0 pa-0">
            <v-col v-for="(button, bInd) in buttons"
                class="ma-0 pa-0"
                :cols="button.cols"
                :key="bInd">
                <v-btn
                    @click="add(button.num)"
                    class="text-h6"
                    :class="buttonClass"
                    color="transparent"
                    :height="buttonHeight"
                    :icon="button.icon"
                    :text="button.num?.toString() ?? button.text"
                    tile
                    width="100%" />
            </v-col>
            <v-col v-if="showOk" class="ma-0 pa-0">
                <v-slide-x-transition hide-on-leave>
                    <v-btn 
                        v-if="canDo"
                        class="text-h6"
                        :class="buttonClass"
                        color="transparent"
                        :disabled="showAddRemove"
                        :height="buttonHeight"
                        icon="$check"
                        tile @click="() => ok(true)"
                        width="100%" />
                </v-slide-x-transition>
            </v-col>
        </v-row>
        <v-slide-y-reverse-transition hide-on-leave>
            <v-row v-if="canDo && showAddRemove" class="ma-0 pa-0">
                <v-col cols="6" class="ma-0 pa-0">
                    <v-btn 
                        @click="emitToRemove"
                        class="text-h6"
                        :class="buttonClass"
                        color="error"
                        :height="buttonHeight"
                        tile
                        width="100%">Remove</v-btn>
                </v-col>
                <v-col cols="6" class="ma-0 pa-0">
                    <v-btn
                        @click="emitToAdd"
                        class="text-h6"
                        :class="buttonClass"
                        color="success"
                        :height="buttonHeight"
                        tile
                        width="100%">Add</v-btn>
                </v-col>
            </v-row>
        </v-slide-y-reverse-transition>
    </v-container>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'

    interface NumpadProps {
        buttonClass?: string
        buttonHeight?: string
        canNegate?: boolean
        clearOnOk?: boolean
        currentValue?: number
        disableTextField?: boolean
        modelValue?: number
        showAddRemove?: boolean
        showDecimal?: boolean
        showOk?: boolean
        showNegative?: boolean
        startingValue?: number
    }

    const props = withDefaults(defineProps<NumpadProps>(), {
        buttonHeight: '75',
        showAddRemove: false,
        showDecimal: false,
        showOk: false,
        showNegative: false
    })

    const emit = defineEmits(['change','update:modelValue','update:currentValue'])
    const val = ref<string>('')
    const canDo = computed(() => val.value != null && val.value.length > 0 && !Number.isNaN(val.value))
    const resNum = computed(() => {
        const r = props.showDecimal == false ? Number.parseInt(val.value) : Number.parseFloat(val.value)
        return isNaN(r) ? undefined : r
    })

    interface Button {
        cols?: number | string
        icon?: string
        num?: number | string
        text?: string
    }

    const lastLineCols = ref<number>(4)
    const buttons = computed<Button[]>(() => {
        const bList: Button[] = [
            { cols: 4, num: 1 },
            { cols: 4, num: 2 },
            { cols: 4, num: 3 },
            { cols: 4, num: 4 },
            { cols: 4, num: 5 },
            { cols: 4, num: 6 },
            { cols: 4, num: 7 },
            { cols: 4, num: 8 },
            { cols: 4, num: 9 }]

        const lastLine: Button[] = [{ cols: 'auto', num: undefined, icon: '$backspace' }]
        
        if (props.showNegative)
            lastLine.push({ cols: 'auto', num: '-' })

        if (props.showDecimal)
            lastLine.push({ cols: 'auto', num: '.' })

        lastLine.push({ cols: '4', num: 0 })

        let total = lastLine.length
        if (props.showOk !== false)
            total++

        const cols = Math.floor(12 / total)
        lastLineCols.value = cols

        lastLine.forEach(l => { l.cols = cols })

        bList.push(...lastLine)

        return bList
    })

    function add(num?: number | string) {
        if (num != null) {
            if (num == '-') {
                if (!val.value.startsWith('-'))
                    val.value = `${num}${val.value}`
                else
                    val.value = val.value.substring(1)
            }
            else if (!(num == '.' && val.value.includes('.'))) {
                val.value = `${val.value ?? ''}${num}`
            }
        }
        else {
            if (val.value.length == 1)
                val.value = ''
            else
                val.value = val.value.substring(0, val.value.length - 1)
        }

        emit('update:currentValue', resNum.value)
    }

    function emitToAdd() {
        if (resNum.value != null) {
            emit('change', resNum.value)
            if (props.clearOnOk == true)
                val.value = ''
        }
    }

    function emitToRemove() {
        if (resNum.value != null) {
            emit('change', 0 - resNum.value);
            if (props.clearOnOk == true)
                val.value = ''
        }
    }

    function ok(doAdd: boolean) {
        if (resNum.value != null) {
            const emitNum = doAdd ? resNum.value : (0 - resNum.value)
            emit('change', emitNum)
            emit('update:modelValue', emitNum)
            if (props.clearOnOk == true)
                val.value = ''
        }
    }

    watch(() => props.modelValue, (v: number | undefined) => {
        val.value = v?.toString() ?? ''
    })

    watch(() => props.startingValue, (v: number | undefined) => {
        val.value = v?.toString() ?? ''
    })

    val.value = props.modelValue?.toString() ?? props.startingValue?.toString() ?? ''

</script>