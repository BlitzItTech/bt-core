import { ComputedRef, ref, Ref } from "vue"
import { BladeMode } from "./blade.ts"


export interface StepOption<T> {
    getLabel?: (options: GetLabelOptions<T>) => string | undefined
    hideActions?: boolean
    ignoreHistory?: boolean
    label?: string
    onCanFinish?: (options: StepCanOptions<T>) => boolean
    onCanMoveNext?: (options: StepCanOptions<T>) => boolean
    onCanSave?: (options: StepCanOptions<T>) => boolean
    onCanSkip?: (options: StepCanOptions<T>) => boolean
    onMoveInto?: (options: StepMoveToThisOptions<T>) => number | string | undefined
    onMoveNext?: (options: StepMoveToNextOptions<T>) => number | string | undefined
    onSaveMoveNext?: boolean | number
    name?: string
}

export interface GetLabelOptions<T> {
    item: T
    meta: any
}

export interface StepCanOptions<T> {
    isChanged: boolean
    item: T
    meta: any
    mode: BladeMode
}

export interface StepMoveToNextOptions<T> {
    item: T
    meta: any
    mode: BladeMode
    next: number
}

export interface StepMoveToThisOptions<T> {
    item: T
    meta: any
    mode: BladeMode
    from: number
    thisStep: number
}

export interface BTSteps<T> {
    canFinish: ComputedRef<boolean>
    canMoveBack: ComputedRef<boolean>
    canMoveNext: ComputedRef<boolean>
    canRestart: ComputedRef<boolean>
    canSave: ComputedRef<boolean>
    canSkip: ComputedRef<boolean>
    currentItem: Ref<T | undefined>
    currentMeta: Ref<any>
    currentStepData: ComputedRef<StepOption<T> | undefined>
    isChanged: Ref<boolean>
    lastStep: ComputedRef<number>
    mode: Ref<BladeMode>
    navBack: () => void
    navTo: (panelIndex: number) => void
    navToName: (stepName?: string) => void
    newItem: () => Promise<void>
    nextStep: () => void
    save: () => Promise<void>
    skip: () => void
    stepOptions?: StepOption<any>[]
}

export interface BTStepsStore<T> {
    id: string,
    data: Ref<BTSteps<T> | undefined>
    watchers: number
}

let currentSets: Record<string, BTStepsStore<any>> = {}

export function useSteps<T>(id: string, options?: BTSteps<T>): BTStepsStore<T> {
    let steps: BTStepsStore<T> = currentSets[id]

    if (steps != null) {
        steps.watchers++

        if (steps.data.value == null && options != null)
            steps.data.value = options

        return steps
    }

    const data: Ref<BTSteps<T> | undefined> = ref<BTSteps<T> | undefined>()
    
    data.value = options

    currentSets[id] = {
        data,
        id,
        watchers: 1
    }
    
    return currentSets[id]
}

export function releaseSteps(id: string) {
    var steps = currentSets[id]

    if (steps != null) {
        if (steps.watchers <= 1)
            delete currentSets[id]
        else
            steps.watchers--
    }
}

// export function useSteps<T>(id: string): BTStepsStore<T> {
//     return currentSets[id]
// }