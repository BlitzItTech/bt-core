// import { useStorage } from "@vueuse/core";
// import { ref } from "vue";
// import { useAuth } from "./auth.ts";

// export interface SetupMemory {
//     currentIndex: number
//     currentStepName: string
//     currentStepNames: string[]
//     showMore: boolean
// }

// export interface SetupHistoryItem {

// }

// export interface SetupHistory {
//     items: SetupHistoryItem[]
// }

// export interface UseSetupOptions<T extends SetupMemory> {
//     /**thinking companyID or churchID**/
//     credentialsUniqueProp: string
//     setupDefaults: T
//     setupName: string
//     trackParams?: boolean
// }

// export interface BTSetup {
//     addSteps: () => void
//     setupName: string
// }

// let currentOptions: BTSetup[] = []

// export function useSetup<TMemory extends SetupMemory>(options: UseSetupOptions<TMemory>): BTSetup {
//     var existing = currentOptions.find(z => z.setupName == options.setupName)
//     if (existing != null)
//         return existing

//     const { credentials } = useAuth()
//     const currentIndex = ref(0)
    
//     const memory = useStorage<TMemory>(`${credentials.value[options.credentialsUniqueProp]}-${options.setupName}-setup-data`, options.setupDefaults)
//     const history = useStorage<SetupHistory>(`${credentials.value[options.credentialsUniqueProp]}-${options.setupName}-setup-history`, {
//         items: []
//     })

//     function insertStepsAfter() {

//     }

//     function addSteps() {

//     }

//     function insertStepsNext() {

//     }

//     function moveBack() {

//     }

//     function moveNext() {

//     }

//     function removeStepIfNext() {

//     }

//     function restart() {

//     }

//     var obj: BTSetup = {
//         addSteps,
//         insertStepsAfter,
//         insertStepsNext,
//         moveBack,
//         moveNext,
//         removeStepIfNext,
//         restart,
//         setupName: options.setupName
//     }

//     currentOptions.push(obj)

//     return obj
// }