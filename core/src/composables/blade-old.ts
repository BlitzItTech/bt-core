// import { type ComponentPublicInstance, type Ref, ref, watch, onMounted } from "vue"
// import { useResizeObserver } from "@vueuse/core"
// import { useDraggable } from "./draggable.ts"
// import { useResizable } from './resizable.ts'
// // import { useId } from "./id.ts"
// import { GetOptions } from "./actions.ts"

// export type BladeDensity = 'default' | 'comfortable' | 'compact'

// /**
//     Inline: merges toolbars | much more compact | hides navigation
//     Page: shows navigation and page settings
//     Blade: shows blade minimize, maximize, close, and pins as a column
//     Free-moving: show blade as draggable and resizable with minimize, maximize, and close and pinning
//  */
// // export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline'
// export type BladeVariant = 'page' | 'blade' | 'freestyle' | 'inline' | 'pane'

// export type BladeMode = 'new' | 'view' | 'edit'

// export interface UseBladeOptions extends UseBladeEventOptions {
//     blade?: Ref<ComponentPublicInstance | null>
//     defaultVariant?: BladeVariant
//     handle?: Ref<ComponentPublicInstance | null>
//     mobileBreakpoint?: number
// }

// export interface BTBlade extends BTBladeEvents<GetOptions> {
//     isMobile: Ref<boolean>
//     variant: Ref<BladeVariant>
// }

// export function useBlade(options?: UseBladeOptions): BTBlade {
//     const blade = options?.blade ?? ref(null)
//     const handle = options?.handle ?? ref(null)
//     const isMobile = ref(false)
//     const breakpoint = options?.mobileBreakpoint ?? 500
//     const variant: Ref<BladeVariant> = ref(options?.defaultVariant ?? 'page')

//     const { turnResizingOff, turnResizingOn } = useResizable(blade)
//     const { turnDraggableOff, turnDraggableOn } = useDraggable(blade, handle)
//     const ui = useBladeEvents(options)

//     useResizeObserver(blade, (entries) => {
//         const entry = entries[0]
//         const { width } = entry.contentRect
//         isMobile.value = width < (breakpoint)
//     })

//     function refreshVariant(newVariant: BladeVariant) {
//         turnDraggableOff()

//         //assume variant is changing
//         if (newVariant == 'page') {
//             turnResizingOff(newVariant)
//             // hideNavigation.value = bladeProps.hideNavigation ?? false
//         }
//         else if (newVariant == 'blade') {
//             // turnResizingOff()
//             // turnResizingOn(['l', 'r'], newVariant)
//             turnResizingOn(['r'], newVariant)
//         }
//         else if (newVariant == 'freestyle') {
//             turnResizingOff()
//             turnResizingOn(undefined, newVariant)
//             turnDraggableOn()
//         }
//         else if (newVariant == 'inline') {
//             turnResizingOff()
//         }
//     }

//     watch(variant, (newV) => refreshVariant(newV))

//     onMounted(() => {
//         refreshVariant(variant.value)
//     })

//     return {
//         isMobile,
//         variant,
//         ...ui
//     }
// }

// export interface UseBladeEventOptions {
//     bladeGroup?: string
//     /**a custom name for just this blade */
//     bladeName?: string
//     bladeStartShowing?: boolean
//     /**whether to include full functionality */
//     bladeBasic?: boolean
//     onClose?: () => void
//     onOpen?: (data: BladeData) => void
//     onUpdate?: (data: BladeData) => void
// }

// export interface BTBladeEvents<T extends GetOptions> {
//     blades: Ref<BladeData[]>
//     bladeData: BladeData
//     closeBlade: (options?: CloseBladeOptions) => void
//     // show: Ref<boolean>
//     updateBlade: (data: UpdateBladeData<T>) => void
// }

// export interface BladeData {
//     // bladeID: string
//     bladeName: string
//     bladeGroup: string
//     data: any
//     show: boolean
// }

// export interface InternalBladeData extends BladeData {
//     onClose?: () => void
//     onOpen?: (data: BladeData) => void
//     onUpdate?: (data: BladeData) => void
// }

// export interface UpdateBladeData<T extends GetOptions> {
//     // bladeID?: string
//     bladeName?: string
//     data?: T
// }

// export interface CloseBladeOptions {
//     mode?: 'remove' | 'hide'
//     // bladeID?: string
//     bladeName?: string
// }

// const blades = ref<InternalBladeData[]>([])

// export function useBladeEvents<T extends GetOptions>(options?: UseBladeEventOptions): BTBladeEvents<T> {
//     // const bladeID = useId()
//     const bladeBasic = options?.bladeBasic == true
//     const bladeName = options?.bladeName
//     const groupName = options?.bladeGroup ?? 'default'
//     const bladeData = ref<InternalBladeData>()

//     if (bladeName != null) {
//         const existingInd = findBladeIndex(bladeName)
//         if (existingInd < 0) {
//             bladeData.value = {
//                 // bladeID,
//                 bladeName,
//                 bladeGroup: groupName,
//                 data: {},
//                 onClose: () => {
//                     if (options?.onClose != null)
//                         options.onClose()

                    
//                 },
//                 onOpen: options?.onOpen,
//                 onUpdate: options?.onUpdate,
//                 show: options?.bladeStartShowing === true
//             }
    
//             if (!bladeBasic)
//                 blades.value.push(bladeData.value)
//         }
//         else {
//             bladeData.value = blades.value[existingInd]
//         }
//     }
    
//     function findBladeIndex(bladeName: string) {
//         return blades.value.findIndex(blade => blade.bladeGroup == groupName && blade.bladeName == bladeName)
//     }

//     function close(cOptions?: CloseBladeOptions) {
//         if (cOptions?.bladeName == null)
//             return

//         const mode = cOptions?.mode ?? 'remove'
//         const ind = findBladeIndex(cOptions?.bladeName)
//         if (ind >= 0) {
//             const bladeData = blades.value[ind]
//             if (mode == 'remove')
//                 bladeData.data = {}

//             bladeData.show = false

//             console.log('s')
//             console.log(bladeData)
//             if (bladeData.onClose != null)
//                 bladeData.onClose()
//         }
//     }

//     function update(updateOptions: UpdateBladeData<T>) {
//         if (updateOptions.bladeName == null)
//             return

//         const ind = findBladeIndex(updateOptions.bladeName)

//         if (ind >= 0) {
//             const data = blades.value[ind]
//             data.data = updateOptions.data

//             if (!data.show) {
//                 //create as new
//                 if (data.onOpen != null)
//                     data.onOpen(data)
//             }
//             else if (data.onUpdate != null) {
//                 data.onUpdate(data)
//             }

//             data.show = true
//         }
//     }

//     return {
//         blades,
//         bladeData: bladeData.value ?? {
//             bladeName: '',
//             bladeGroup: '',
//             data: {},
//             show: false
//         },
//         closeBlade: close,
//         updateBlade: update
//     }
// }