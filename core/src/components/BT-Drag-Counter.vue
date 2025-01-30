<template>
    <v-btn
        v-bind="$attrs"
        :class="centerOfParent ? 'center-of-parent' : ''"
        :icon="icon"
        :size="size"
        @mousedown.stop="dragStart"
        @touchstart.stop="dragStart">
        <v-icon :icon="icon" :size="iconSize" />
        <v-slide-y-transition>
            <span v-if="showDetails" style="position: absolute; bottom: 130%;">
                <span v-if="showDetails" class="mr-1" key="2">({{ multiplierValue }})</span>
                <span v-if="showDetails" key="3">{{ draggingValue }}</span>
            </span>
        </v-slide-y-transition>
    </v-btn>
</template>

<script setup lang="ts">
    import { useEventListener, watchDebounced } from '@vueuse/core';
    import { PointerOrTouchEvent } from '../composables/resizable.ts'
    import { ref, watch } from 'vue'
    import { firstBy } from 'thenby';
    
    interface CounterMath {
        /**when over or under this number */
        yLevelLessThan: number
        /**multiply the next x movement by this amount */
        xDifTrigger: number
        /**how much to adjust when x dif is triggered */
        valOnTrigger: number
        /**what label to show when triggered */
        txt: string
    }

    interface CounterProps {
        applyOnEnd?: boolean
        centerOfParent?: boolean
        /**milliseconds before kicking into action */
        delay?: number
        icon?: string
        iconSize?: string
        mathOptions?: CounterMath[]
        min?: number
        max?: number
        modelValue?: number
        size?: string
        /**if x passes this distance to max - defaults to 250px */
        toMaxDistance?: number
        /**if x passed distance in this time then go straight to max - defaults to 250ms */
        toMaxSpeed?: number
        /**whether to use the toMax options - defaults to true */
        useMaxer?: boolean
    }

    const props = withDefaults(defineProps<CounterProps>(), {
        centerOfParent: false,
        delay: 200,
        icon: '$fingerprint',
        iconSize: 'x-large',
        size: 'x-small',
        toMaxDistance: 250,
        toMaxSpeed: 250,
        useMaxer: true
    })
    const emit = defineEmits(['update:modelValue', 'change', 'dragging', 'startDragging', 'stopDragging'])

    const draggingValue = ref(0)
    const multiplierValue = ref('x1')
    const isDragging = ref(false)
    const isPressed = ref(false)
    const showDetails = ref(false)

    let lastX = 0
    let startedOn: number | undefined = undefined
    let startedAt: number | undefined = undefined

    let moveListeners: Function[] = []
    let startingPointerPosition = { x: 0, y: 0 }

    let mathOptions = props.mathOptions ?? [
        { yLevelLessThan: 25, xDifTrigger: 40, valOnTrigger: 1, txt: 'x1' },
        { yLevelLessThan: 50, xDifTrigger: 30, valOnTrigger: 1, txt: 'x2' },
        { yLevelLessThan: 75, xDifTrigger: 20, valOnTrigger: 1, txt: 'x3' },
        { yLevelLessThan: 100, xDifTrigger: 10, valOnTrigger: 1, txt: 'x4' },
        { yLevelLessThan: 300, xDifTrigger: 10, valOnTrigger: 10, txt: 'x10' },
        { yLevelLessThan: 400, xDifTrigger: 1, valOnTrigger: 10, txt: 'x50' },
        { yLevelLessThan: 4000, xDifTrigger: 1, valOnTrigger: 100, txt: 'x100' }
    ]

    mathOptions = mathOptions.sort(firstBy((x: CounterMath) => x.yLevelLessThan, 'asc'))

    watch(isDragging, (v) => {
        if (v)
            emit('startDragging')
        else
            emit('stopDragging')
    })

    function turnOnDrag() {
        moveListeners.push(useEventListener('mousemove', adjust))
        moveListeners.push(useEventListener('touchmove', adjust))
        isDragging.value = true
        showDetails.value = true
        draggingValue.value = props.modelValue ?? 0
        multiplierValue.value = 'x1'
        lastX = startingPointerPosition.x
    }

    function dragStart(e: PointerOrTouchEvent) {
        isPressed.value = true

        const isTouch = e.type === 'touchstart' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e

        startingPointerPosition = { x: evtData.clientX, y: evtData.clientY }

        moveListeners.push(useEventListener('mouseup', dragStop))
        moveListeners.push(useEventListener('touchend', dragStop))

        const del = props.delay ?? 0
        if (del <= 0) {
            // moveListeners.push(useEventListener('mousemove', adjust))
            // moveListeners.push(useEventListener('touchmove', adjust))
            turnOnDrag()
        }
        else {
            setTimeout(() => {
                if (isPressed.value) {
                    // moveListeners.push(useEventListener('mousemove', adjust))
                    // moveListeners.push(useEventListener('touchmove', adjust))
                    turnOnDrag()
                }
            }, del)
        }

        e.preventDefault()
        e.stopPropagation()
    }

    function dragStop() {
        isDragging.value = false
        isPressed.value = false

        moveListeners.forEach(m => { m() })
        moveListeners.length = 0

        //emit model value update
        if (props.applyOnEnd) {
            emit('update:modelValue', draggingValue.value)
            emit('change')
        }

        startedOn = undefined
        startedAt = undefined
    }

    function adjust(e: any) {
        const isTouch = e.type == 'touchmove' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e

        startingPointerPosition ??= {
            x: evtData.clientX,
            y: evtData.clientY
        }

        if (isDragging.value) {
            //see whether to max straight away
            startedOn ??= e.timeStamp
            startedAt ??= evtData.clientX

            if (props.max != null && props.useMaxer && 
                ((e.timeStamp - startedOn!) < props.toMaxSpeed) &&
                ((evtData.clientX - startedAt!) > props.toMaxDistance)) {
                //max out
                if (draggingValue.value < props.max) {
                    multiplierValue.value = 'MAX'
                    draggingValue.value = props.max

                    if (props.applyOnEnd != true) {
                        emit('update:modelValue', draggingValue.value)
                        emit('change')
                    }
                        

                    emit('dragging')
                }
            }
            else {
                //find the y trigger value
                let xDif = evtData.clientX - lastX

                if (xDif > 0 && multiplierValue.value == 'MAX') {
                    //do nothing cause already maxxed
                    return
                }
                else {
                    let yLevel = evtData.clientY - startingPointerPosition.y
                    yLevel = yLevel < 0 ? 0 - yLevel : yLevel

                    //find the first to match
                    const mathOption = mathOptions.find(x => yLevel < x.yLevelLessThan)

                    if (mathOption != null) {
                        multiplierValue.value = mathOption.txt
                        let trigger = mathOption.xDifTrigger
                        let incVal = mathOption.valOnTrigger

                        if (xDif > trigger || xDif < (0 - trigger)) {
                            //do something
                            lastX = evtData.clientX
                            let newVal = draggingValue.value + (xDif > trigger ? incVal : (0 - incVal))

                            if (props.max != null && newVal > props.max)
                                newVal = props.max

                            if (props.min != null && newVal < props.min)
                                newVal = props.min

                            if (draggingValue.value != newVal) {
                                draggingValue.value = newVal
                                
                                if (props.applyOnEnd != true) {
                                    emit('update:modelValue', draggingValue.value)
                                    emit('change')
                                }
                                    

                                emit('dragging')
                            }
                        }
                    }
                }
            }
        }
    }

    watchDebounced(isDragging, v => {
        if (!v)
            showDetails.value = false
    }, { debounce: 1000 })

</script>

<style scoped>
    .center-of-parent {
        position: absolute;
        left: 50%;
        opacity: 0.5;
        top: 50%;
        transform: translate(-50%, -50%);
    }
</style>