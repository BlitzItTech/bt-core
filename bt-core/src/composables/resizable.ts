import { toValue, useEventListener, useParentElement } from "@vueuse/core"
import { type ComponentPublicInstance, type Ref, ref } from 'vue'
import type { Position, MaybeRefOrGetter } from "@vueuse/core"
import { copyDeep } from "@/composables/helpers"
import { type BladeVariant } from "@/types"

export type ResizeHandle = 't' | 'r' | 'b' | 'l' | 'tr' | 'br' | 'bl' | 'tl'

export interface PointerOrTouchEvent extends PointerEvent, TouchEvent { }

const allHandles: ResizeHandle[] = ['t', 'r', 'b', 'l', 'tr', 'br', 'bl', 'tl']

export interface UseResizeOptions {
    preventDefault?: MaybeRefOrGetter<boolean>
    stopPropagation?: MaybeRefOrGetter<boolean>
    // pointerTypes?: PointerType[]
    handles?: ResizeHandle[]

    /**
     * Callback when the dragging starts. Return `false` to prevent dragging.
     */
    onStart?: (position: Position, event: PointerEvent) => void | false

    /**
     * Callback during dragging.
     */
    onMove?: (position: Position, event: PointerEvent) => void

    /**
     * Callback when dragging end.
     */
    onEnd?: (position: Position, event: PointerEvent) => void

    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    handleWidth?: number
    handleZIndex?: number
}

interface ElementPosition {
    left?: number,
    top?: number,
    height?: number,
    width?: number,
    position?: string
}

export function useResizable(
    target: MaybeRefOrGetter<ComponentPublicInstance | null>,
    options: UseResizeOptions = {}) {
    let currentVariant: string | undefined = undefined
    let handleWidth = options.handleWidth ?? 12
    let handleZIndex = options.handleZIndex ?? 100
    let minWidth = options.minWidth ?? 0
    let maxWidth = options.maxWidth ?? Number.MAX_SAFE_INTEGER
    let minHeight = options.minHeight ?? 0
    let maxHeight = options.maxHeight ?? Number.MAX_SAFE_INTEGER
    let preventDefault = options.preventDefault ?? false
    let stopPropagation = options.stopPropagation ?? false

    let activeHandle: any
    let handleEls: HTMLDivElement[] = []
    const isAutoResizing = ref(false)
    let listeners: Function[] = []
    let moveListeners: Function[] = []
    const resizingIsOn: Ref<boolean> = ref(false)
    const startingPointerPosition: Ref<Position> = ref<Position>({ x: 0, y: 0 })
    let startingElementPosition: ElementPosition = { left: 0, top: 0, height: 0, width: 0, position: 'absolute' }
    let currentElementPosition: ElementPosition = { }
    let variantMemory: any = {}

    function handleEvent(e: PointerOrTouchEvent) {
        if (toValue(preventDefault))
            e.preventDefault()
        if (toValue(stopPropagation))
            e.stopPropagation()
    }

    function addHandles(el: ComponentPublicInstance, handles: ResizeHandle[]) {
        handleEls = handles.map(createHandleEl)
        handleEls.forEach(handleEl => el.$el.appendChild(handleEl))
    }

    function removeHandles(el: ComponentPublicInstance) {
        handleEls.forEach(handleEl => el.$el.removeChild(handleEl))
    }

    function createHandleEl(handle: string): HTMLDivElement { //ComponentPublicInstance {
        const handleWidthPx = handleWidth + 'px'
        const handleOffsetPx = -handleWidth / 2 + 'px'
        const handleCornerZIndex = handleZIndex + 1

        const handleEl = document.createElement('div')
        handleEl.dataset.handle = handle
        handleEl.style.position = 'absolute'
        handleEl.style.touchAction = 'none'
        handleEl.style.userSelect = 'none'
        handleEl.style.zIndex = (handle.length === 1 ? handleZIndex : handleCornerZIndex).toString()
        handleEl.style.cursor = getCursor(handle)

        if (handle.includes('t')) {
            handleEl.style.top = handleOffsetPx
            handleEl.style.height = handleWidthPx
            if (handle === 't') {
                handleEl.style.left = '0'
                handleEl.style.width = '100%'
            }
        }
        if (handle.includes('b')) {
            handleEl.style.bottom = handleOffsetPx
            handleEl.style.height = handleWidthPx
            if (handle === 'b') {
                handleEl.style.left = '0'
                handleEl.style.width = '100%'
            }
        }
        if (handle.includes('r')) {
            handleEl.style.right = handleOffsetPx
            handleEl.style.width = handleWidthPx
            if (handle === 'r') {
                handleEl.style.top = '0'
                handleEl.style.height = '100%'
            }
        }
        if (handle.includes('l')) {
            handleEl.style.left = handleOffsetPx
            handleEl.style.width = handleWidthPx
            if (handle === 'l') {
                handleEl.style.top = '0'
                handleEl.style.height = '100%'
            }
        }
        return handleEl
    }

    function start(e: PointerOrTouchEvent) {
        if (!handleEls.some(x => x == e.target)) return
        const t = toValue(target)
        if (!t) return
        const el = t.$el
        const isTouch = e.type === 'touchstart' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e

        startingPointerPosition.value.x = evtData.clientX
        startingPointerPosition.value.y = evtData.clientY

        startingElementPosition = {
            left: el.offsetLeft,
            top: el.offsetTop,
            height: parseInt(window.getComputedStyle(el).getPropertyValue('height')),
            width: parseInt(window.getComputedStyle(el).getPropertyValue('width'))
        }
        
        currentElementPosition = copyDeep(startingElementPosition)

        if (options.onStart?.(startingPointerPosition.value, e) === false) return

        let handle = e.target as HTMLElement
        
        document.documentElement.style.cursor = getCursor(handle.dataset.handle as string)
        activeHandle = handle.dataset.handle as string

        moveListeners.push(useEventListener('mousemove', move))
        moveListeners.push(useEventListener('mouseup', end))
        moveListeners.push(useEventListener('touchmove', move))
        moveListeners.push(useEventListener('touchend', end))
        
        handleEvent(e)
    }

    function move(e: any) {
        const t = toValue(target)
        if (!t) return
        const el = t.$el

        const isTouch = e.type === 'touchmove' && e.touches.length > 0
        const evtData = isTouch ? e.touches[0] : e
        let dx = evtData.clientX - startingPointerPosition.value.x
        let dy = evtData.clientY - startingPointerPosition.value.y
        const start = toValue(startingElementPosition)

        if (activeHandle.includes('t')) {
            const newHeight = Math.min(maxHeight, Math.max(minHeight, (start.height ?? 0) - dy))
            currentElementPosition.height = newHeight
            currentElementPosition.top = (start.top ?? 0) + dy
        }
        if (activeHandle.includes('b')) {
            const newHeight = Math.min(maxHeight, Math.max(minHeight, (start.height ?? 0) + dy))
            currentElementPosition.height = newHeight
        }
        if (activeHandle.includes('l')) {
            const newWidth = Math.min(maxWidth, Math.max(minWidth, (start.width ?? 0) - dx))
            currentElementPosition.width = newWidth
            currentElementPosition.left = (start.left ?? 0) + dx
        }
        if (activeHandle.includes('r')) {
            const newWidth = Math.min(maxWidth, Math.max(minWidth, (start.width ?? 0) + dx))
            currentElementPosition.width = newWidth
        }
    
        el.dispatchEvent(new CustomEvent('resize'))
        handleEvent(e)

        applyToElementStyle(currentElementPosition)
    }

    function end() {
        document.documentElement.style.cursor = ''
        activeHandle = null
        moveListeners.forEach(l => { l() })
        moveListeners.length = 0
    }

    function getCursor(handle: string) {
        const cursorDirection: any = {
            t: 'n',
            r: 'e',
            b: 's',
            l: 'w'
        }
        return (handle.split('').map(l => cursorDirection[l]).join('') + '-resize')
    }

    function restoreSize(variant?: BladeVariant | undefined) {
        const t = toValue(target)
        if (!t) return
        const el = t.$el as HTMLElement
        console.log(currentVariant)
      
        if (currentVariant !== 'page' && variant == 'page') {
            //moving back to default page settings
            const parent = useParentElement(el)
            const p = (toValue(parent) ?? null) as any
            let aimWidth = 0
            if (p != null) {
                const c = window.getComputedStyle(p)
                aimWidth = parseInt(c.getPropertyValue('width')) - p.offsetLeft
            }
            
            el.style.transition = 'width 0.5s, height 0.5s, top 0.5s, left 0.5s'
            el.offsetHeight
            isAutoResizing.value = true
            
            applyToElementStyle({
                height: undefined,
                width: aimWidth,
                top: 0,
                left: 0,
                position: undefined
            })
            
            useEventListener(el, 'transitionend', () => {
                el.style.width = 'auto'
                el.style.top = ''
                el.style.left = ''
                el.style.position = ''
                el.style.transition = ''
                isAutoResizing.value = false
            }, { once: true })
        }
        else if ((currentVariant == 'page' || t.$el.style.position !== 'absolute') && variant !== 'page') {
            //move to freestyle or blade
            el.style.transition = 'width 0.5s, height 0.5s, top 0.5s, left 0.5s'
            isAutoResizing.value = true

            startingElementPosition = {
                height: parseInt(window.getComputedStyle(el).getPropertyValue('height')),
                width: parseInt(window.getComputedStyle(el).getPropertyValue('width')),
                top: el.offsetTop,
                left: el.offsetLeft,
                position: 'absolute'
            }

            applyToElementStyle(startingElementPosition)
            el.offsetHeight
            const s = startingElementPosition

            if (variant == 'freestyle') {
                //half the size to indicate non-page variant
                currentElementPosition = {
                    height: s.height,
                    width: (s.width ?? 100) / 2,
                    top: (s.top ?? 0) + 2,
                    left: (s.left ?? 0) + 2,
                    position: 'absolute'
                }
            }
            else if (variant == 'blade') {
                currentElementPosition = {
                    height: s.height,
                    width: (s.width ?? 100) / 2,
                    top: (s.top ?? 0) + 2,
                    left: (s.left ?? 0) + 2,
                    position: 'absolute'
                }

                //flex column?
            }

            applyToElementStyle(currentElementPosition)

            useEventListener(el, 'transitionend', () => {
                el.style.transition = ''
                isAutoResizing.value = false
            }, { once: true })
        }
    }

    function applyToElementStyle(s: ElementPosition) {
        const t = toValue(target)
        if (!t) return
        const el = t.$el

        if (s.top) {
            el.style.top = `${s.top}px`
        }
        else {
            el.style.top = undefined
        }

        if (s.left) {
            el.style.left = `${s.left}px`
        }
        else {
            el.style.left = undefined
        }

        if (s.height) {
            el.style.height = `${s.height}px`
        }
        else {
            el.style.height = undefined
        }

        if (s.width) {
            el.style.width = `${s.width}px`
        }
        else {
            el.style.width = undefined
        }

        if (s.position) {
            el.style.position = `${s.position}`
        }
        else {
            el.style.position = undefined
        }

        console.log(el.style.position)
    }

    function turnResizingOn(handles?: ResizeHandle[], variant?: BladeVariant) {
        if (resizingIsOn.value) return
        const t = toValue(target)
        if (!t) return
        addHandles(t, handles ?? allHandles)
        restoreSize(variant)
        listeners.push(useEventListener(t.$el, 'mousedown', start))
        listeners.push(useEventListener(t.$el, 'touchstart', start))
        resizingIsOn.value = true
        currentVariant = variant
    }

    function turnResizingOff(variant?: BladeVariant | undefined) {
        if (!resizingIsOn.value) return
        const t = toValue(target)
        if (!t) return
        removeHandles(t)
        restoreSize(variant)
        listeners.forEach(l => { l() })
        listeners.length = 0
        resizingIsOn.value = false
    }

    return {
        resizingIsOn,
        turnResizingOn,
        turnResizingOff
    }
}