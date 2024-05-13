import { type ComponentPublicInstance, type MaybeRefOrGetter, type Ref, ref, toValue } from 'vue'
import { type Position, useEventListener } from '@vueuse/core'
import { type PointerOrTouchEvent } from './resizable.ts'

export interface UseDraggableOptions {
    /**
     * Only start the dragging when click on the element directly
     *
     * @default false
     */
    // exact?: MaybeRefOrGetter<boolean>
  
    preventDefault?: MaybeRefOrGetter<boolean>
    stopPropagation?: MaybeRefOrGetter<boolean>
  
    /**
     * Whether dispatch events in capturing phase
     *
     * @default true
     */
    capture?: boolean

    /**
     * Element to attach `pointermove` and `pointerup` events to.
     *
     * @default window
     */
    draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>
  
    /**
     * Element for calculating bounds (If not set, it will use the event's target).
     *
     * @default undefined
     */
    // containerElement?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>
  
    /**
     * Handle that triggers the drag event
     *
     * @default target
     */
    handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>
  
    /**
     * Initial position of the element.
     *
     * @default { x: 0, y: 0 }
     */
    initialValue?: MaybeRefOrGetter<Position>

    onStart?: (position: Position, event: PointerEvent) => void | false
    onMove?: (position: Position, event: PointerEvent) => void
    onEnd?: (position: Position, event: PointerEvent) => void
  
    /**
     * Axis to drag on.
     *
     * @default 'both'
     */
    axis?: 'x' | 'y' | 'both'
  }

  export function useDraggable(
    target: MaybeRefOrGetter<ComponentPublicInstance | null>, //HTMLElement | SVGElement | null | undefined>,
    handle: MaybeRefOrGetter<ComponentPublicInstance | null>,
    options: UseDraggableOptions = {},
  ) {
    const {
        preventDefault = false,
        stopPropagation = false,
        axis = 'both',
    } = options

    const config = { capture: options.capture ?? true }
    let currentElementPosition = { x: 0, y: 0 }
    let startingElementPosition = { x: 0, y: 0 }
    let startingPointerPosition = { x: 0, y: 0 }

    let listeners: Function[] = []
    let moveListeners: Function[] = []
    let draggingIsOn: Ref<boolean> = ref(false)

    function handleEvent(e: PointerEvent) {
        if (toValue(preventDefault))
            e.preventDefault()
        if (toValue(stopPropagation))
            e.stopPropagation()
    }

    function start(e: PointerOrTouchEvent) {
        const t = toValue(target)
        if (!t) return
        const el = t.$el
        const isTouch = e.type === 'touchstart' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e

        startingPointerPosition = { x: evtData.clientX, y: evtData.clientY }
        
        startingElementPosition = {
            x: el.offsetLeft,
            y: el.offsetTop
        }

        currentElementPosition = {
            x: el.offsetLeft,
            y: el.offsetTop
        }

        if (options.onStart?.(startingPointerPosition, e) === false) return

        moveListeners.push(useEventListener('mousemove', move))
        moveListeners.push(useEventListener('touchmove', move))
        moveListeners.push(useEventListener('mouseup', end))
        moveListeners.push(useEventListener('touchend', end))

        handleEvent(e)
    }

    function move(e: any) {
        if (!startingPointerPosition) return

        const t = toValue(target)
        if (!t) return
        // const el = t.$el
        const isTouch = e.type === 'touchmove' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e
        let dx = evtData.clientX - startingPointerPosition.x
        let dy = evtData.clientY - startingPointerPosition.y

        if (axis === 'x' || axis === 'both')
            currentElementPosition.x = startingElementPosition.x + dx
        if (axis === 'y' || axis === 'both')
            currentElementPosition.y = startingElementPosition.y + dy

        options.onMove?.(currentElementPosition, e)

        handleEvent(e)

        applyToElementStyle(currentElementPosition)
    }

    function end(e: any) {
        document.documentElement.style.cursor = ''
        moveListeners.forEach(m => { m() })
        moveListeners.length = 0
        options.onEnd?.(currentElementPosition, e)
        handleEvent(e)
    }

    function applyToElementStyle(s: Position) {
        const t = toValue(target)
        if (!t) return
        const el = t.$el

        el.style.left = `${s.x}px`
        el.style.top = `${s.y}px`
    }

    function turnDraggableOn() {
        if (toValue(draggingIsOn)) return
        const handleT = toValue(handle)
        if (!handleT) return
        const handleEl = handleT.$el
        handleEl.style.cursor = 'move'
        
        listeners.push(useEventListener(handleEl, 'mousedown', start, config))
        listeners.push(useEventListener(handleEl, 'touchstart', start, config))
        draggingIsOn.value = true
    }

    function turnDraggableOff() {
        if (!toValue(draggingIsOn)) return
        const handleT = toValue(handle)
        if (!handleT) return
        const handleEl = handleT.$el
        handleEl.style.cursor = ''
        
        //provide new position and size?
        listeners.forEach(l => { l() })
        listeners.length = 0
        draggingIsOn.value = false
    }

    return {
        draggingIsOn,
        turnDraggableOff,
        turnDraggableOn
    }
  }