import { type ComponentPublicInstance, type Ref, ref, watch, onMounted } from "vue"
import { useResizeObserver } from "@vueuse/core"
import { useDraggable } from "./draggable.ts"
import { useResizable } from './resizable.ts'
// import { useSpring } from 'vue-use-spring'
// import { useId } from "./id.ts"
import { GetOptions } from "./actions.ts"

export type BladeDensity = 'default' | 'comfortable' | 'compact'

/**
    Inline: merges toolbars | much more compact | hides navigation
    Page: shows navigation and page settings
    Blade: shows blade minimize, maximize, close, and pins as a column
    Free-moving: show blade as draggable and resizable with minimize, maximize, and close and pinning
 */
// export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline'
export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline' | 'pane' | 'pure' | 'dialog'

export type BladeMode = 'new' | 'view' | 'edit'

export interface UseBladeOptions {
    blade?: Ref<ComponentPublicInstance | null>
    bladeGroup?: string
    /**a custom name for just this blade */
    bladeName?: string
    bladeStartShowing?: boolean
    /**whether to include full functionality */
    bladeBasic?: boolean
    handle?: Ref<ComponentPublicInstance | null>
    mobileBreakpoint?: number
    onClose?: () => void
    // onOpen?: (data: BladeData) => void
    onUpdate?: (data: BladeData) => void
    variant?: BladeVariant
}

export interface BTBlade<T extends GetOptions<any, any>> {
    blades: Ref<BladeData[]>
    bladeData: BladeData
    // bladeStyle: ComputedRef<string>,
    closeBlade: (options?: CloseBladeOptions) => void
    // show: Ref<boolean>
    isMobile: Ref<boolean>
    updateBlade: (data: UpdateBladeData<T>) => void
    variant: Ref<BladeVariant>
}

const blades = ref<InternalBladeData[]>([])

export function useBlade<T, TReturn>(options?: UseBladeOptions): BTBlade<GetOptions<T,TReturn>> {
    const blade = options?.blade ?? ref(null)
    const bladeBasic = options?.bladeBasic == true
    const bladeData = ref<InternalBladeData>()
    const bladeName = options?.bladeName
    const breakpoint = options?.mobileBreakpoint ?? 500
    const groupName = options?.bladeGroup ?? 'default'
    const handle = options?.handle ?? ref(null)
    const isMobile = ref(false)
    // let lastWidth: number = 400
    // const position = useSpring({ width: 400 })
    const variant: Ref<BladeVariant> = ref(options?.variant ?? 'page')

    const { turnResizingOff, turnResizingOn } = useResizable(blade)
    const { turnDraggableOff, turnDraggableOn } = useDraggable(blade, handle)

    // function updateBladeStyle(bladeData: BladeData) {
    //     console.log(bladeData)
    // }

    function close(cOptions?: CloseBladeOptions) {
        if (cOptions?.bladeName == null)
            return

        const mode = cOptions?.mode ?? 'remove'
        const ind = findBladeIndex(cOptions?.bladeName)
        if (ind >= 0) {
            const bladeData = blades.value[ind]
            if (mode == 'remove')
                bladeData.data = {}

            bladeData.show = false
            // position.width = 0

            // if (blade.value != null)
            //     lastWidth = parseInt(window.getComputedStyle(blade.value.$el).getPropertyValue('width')) ?? undefined

            // console.log('lastWidth')
            // console.log(lastWidth)

            bladeData.closeFunctions.forEach(c => {
                c()
            })
        }
    }
    
    function findBladeIndex(bladeName: string) {
        return blades.value.findIndex(blade => blade.bladeGroup == groupName && blade.bladeName == bladeName)
    }

    function update(updateOptions: UpdateBladeData<GetOptions<T, TReturn>>) {
        // console.log('updating')
        // console.log(updateOptions)
        if (updateOptions.bladeName == null)
            return

        const ind = findBladeIndex(updateOptions.bladeName)
        if (ind >= 0) {
            const bladeData = blades.value[ind]
            bladeData.data = updateOptions.data

            bladeData.show = true
            // position.width = lastWidth

            bladeData.updateFunctions.forEach(u => {
                u(bladeData)
            })

            // updateBladeStyle(bladeData)
        }
    }

    useResizeObserver(blade, (entries) => {
        const entry = entries[0]
        const { width } = entry.contentRect
        isMobile.value = width < (breakpoint)
    })

    function refreshVariant(newVariant: BladeVariant) {
        turnDraggableOff()

        //assume variant is changing
        if (newVariant == 'page') {
            turnResizingOff(newVariant)
            // hideNavigation.value = bladeProps.hideNavigation ?? false
        }
        else if (newVariant == 'blade') {
            // turnResizingOff()
            // turnResizingOn(['l', 'r'], newVariant)
            turnResizingOn(['r'], newVariant)
        }
        else if (newVariant == 'freestyle') {
            turnResizingOff()
            turnResizingOn(undefined, newVariant)
            turnDraggableOn()
        }
        else if (newVariant == 'inline') {
            turnResizingOff()
        }
    }

    if (bladeName != null) {
        const existingInd = findBladeIndex(bladeName)
        if (existingInd < 0) {
            bladeData.value = {
                bladeName,
                bladeGroup: groupName,
                // bladeStyle: '',
                // bladeVariant: variant.value, //options?.variant ?? 'page',
                closeFunctions: [],
                updateFunctions: [],
                data: {},
                show: options?.bladeStartShowing === true
            }
    
            if (!bladeBasic)
                blades.value.push(bladeData.value)
        }
        else {
            bladeData.value = blades.value[existingInd]
        }

        if (options?.onClose != null)
            bladeData.value.closeFunctions.push(options.onClose)

        if (options?.onUpdate != null)
            bladeData.value.updateFunctions.push(options.onUpdate)
    }

    watch(variant, (newV) => refreshVariant(newV))

    onMounted(() => {
        refreshVariant(variant.value)
    })

    return {
        blades,
        bladeData: bladeData.value ?? {
            bladeName: '',
            bladeGroup: '',
            // bladeStyle: '',
            // bladeVariant: variant.value,
            data: {},
            show: false
        },
        closeBlade: close,
        isMobile,
        updateBlade: update,
        variant
    }
}

export interface BladeData {
    // bladeID: string
    bladeName: string
    bladeGroup: string
    // bladeStyle: string
    // bladeVariant: BladeVariant
    data: any
    show: boolean
}

export interface InternalBladeData extends BladeData {
    closeFunctions: Array<() => void>,
    // openFunctions: Array<(data: BladeData) => void>,
    updateFunctions: Array<(data: BladeData) => void>,
    // onClose?: () => void
    // onOpen?: (data: BladeData) => void
    // onUpdate?: (data: BladeData) => void
}

export interface UpdateBladeData<T extends GetOptions<any, any>> {
    // bladeID?: string
    bladeName?: string
    data?: T
}

export interface CloseBladeOptions {
    mode?: 'remove' | 'hide'
    // bladeID?: string
    bladeName?: string
}