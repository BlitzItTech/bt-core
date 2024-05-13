import { type ComponentPublicInstance, type Ref, ref, watch } from "vue"
import { useResizeObserver } from "@vueuse/core"
import { useDraggable } from "./draggable.ts"
import { useResizable } from './resizable.ts'

export type BladeDensity = 'default' | 'comfortable' | 'compact'

/**
    Inline: merges toolbars | much more compact | hides navigation
    Page: shows navigation and page settings
    Blade: shows blade minimize, maximize, close, and pins as a column
    Free-moving: show blade as draggable and resizable with minimize, maximize, and close and pinning
 */
export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline'

// export interface BladeProps {
//     bladeID?: string
//     bladeName?: string
//     mobileBreakpoint?: number
//     variant?: BladeVariant
// }

// export interface BladeEventData extends GetOptions {
//     bladeID?: string
//     bladeName?: string
// }

// export interface UseBladeReturn {
//     mode: Ref<string>
//     queryData: Ref<any>
// }

export interface UseBladeOptions {
    bladeID?: string
    bladeName?: string
    blade?: Ref<ComponentPublicInstance | null>
    defaultVariant?: BladeVariant
    handle?: Ref<ComponentPublicInstance | null>
    mobileBreakpoint?: number
}

export interface BTBlade {
    bladeData: Ref<any>
    isMobile: Ref<boolean>
    variant: Ref<BladeVariant>
}

export function useBlade(options?: UseBladeOptions): BTBlade {
    const blade = options?.blade ?? ref(null)
    const handle = options?.handle ?? ref(null)
    const isMobile = ref(false)
    const breakpoint = options?.mobileBreakpoint ?? 500
    const variant: Ref<BladeVariant> = ref(options?.defaultVariant ?? 'page')
    const bladeData = ref<any>({})

    const { turnResizingOff, turnResizingOn } = useResizable(blade)
    const { turnDraggableOff, turnDraggableOn } = useDraggable(blade, handle)

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
            turnResizingOn(['l', 'r'], newVariant)
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

    refreshVariant(variant.value)

    watch(variant, (newV) => refreshVariant(newV))

    return {
        isMobile,
        variant,
        bladeData,
    }
}

// export interface UseBladeEventsOptions {
//     bladeID?: string //can be an existing id through props or auto-generated
//     bladeName?: string
//     nav?: string

//     /**
//      * caught by blades handler
//      */
//     onClose?: OnCloseBlade,

//     /**
//      * caught by blades handler
//      */
//     onCreate?: OnCreateBlade,

//     /**
//      * this blade will be updated with this call
//      */
//     onUpdate?: OnUpdateBlade
// }

// const bladeSets: Ref<BladeEventData[]> = ref([])
// let bladeIndex: number = 0

// export function useBladeEvents(thisBladeOptions: UseBladeEventsOptions) {
//     let {
//         bladeID,
//         bladeName,
//         nav
//     } = thisBladeOptions

//     const bus = useEventBus<string>('blades')
//     const myBladeData: Ref<BladeEventData> = shallowRef({})
    
//     if (bladeID == null) {
//         //create new blade data
//         bladeIndex++
//         bladeID = bladeIndex.toString()
//     }
    
//     //find or create existing blade data
//     let bladeData = bladeSets.value.find(x => x.bladeID == bladeID)
//     if (bladeData == null) {
//         //create new blade data
//         myBladeData.value = {
//             bladeID,
//             bladeName,
//             nav
//         }

//         bladeSets.value.push(myBladeData.value)
//     }

//     function sendClose(data: BladeEventData) {
//         bus.emit('close', data)
//     }

//     function sendUpdate(data: BladeEventData) {
//         bus.emit('update', data)
//     }

//     bus.on((event: string, newBladeData: BladeEventData) => {
//         let existingBladeData = bladeSets.value.find(x => newBladeData.bladeID != null && newBladeData.bladeID == x.bladeID)
//         let isNew = false

//         if (existingBladeData == null) {
//             //create new blade data
//             bladeIndex++
//             existingBladeData = newBladeData = { bladeID: bladeIndex.toString() }
//             bladeSets.value.push(existingBladeData)
//             myBladeData.value = existingBladeData
//             isNew = true
//         }

//         if (event == 'close' && thisBladeOptions.onClose != null) {
//             thisBladeOptions.onClose(newBladeData)
//         }
//         else if (event == 'update' && thisBladeOptions.onUpdate != null) {
//             myBladeData.value = myBladeData.value = newBladeData
//             thisBladeOptions.onUpdate(myBladeData.value)
//         }
//     });

//     return {
//         bladeData: myBladeData,
//         bus,
//         sendClose,
//         sendUpdate
//     }
// }