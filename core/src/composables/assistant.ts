import { useStorage } from "@vueuse/core"
import { DateTime } from "luxon"
import { Ref, ref } from "vue"

export interface HelpLink {
    categories?: string[]
    description?: string
    icon?: string
    id: string
    isAlways?: boolean
    routeNames?: string[]
    sort?: number
    subtitle?: string
    tags?: string[]
    title?: string
    url?: string
}

export interface CreateAssistantOptions {
    firstFeedbackAfterDays?: number
    feedbackAfterDays?: number
    helpMenuRoute?: string
    hideFeedback?: boolean
    items: HelpLink[]
    storageKey?: string
}

export interface BTAssistant {
    allItems: HelpLink[]
    doShowDialog: (routeName?: string) => boolean
    getLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    getPrimaryLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    getSecondaryLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    hideDialogPermanently: (rotueName?: string) => void
    hideDialogTemporarily: () => void
    hideFeedback: Ref<boolean>
    menuRouteName?: string
    tab: Ref<number>
}

let current: BTAssistant

export function useAssistant(): BTAssistant {
    return current
}

export function createAssistant(options?: CreateAssistantOptions): BTAssistant {
    if (current != null)
        return current

    options ??= { 
        items: []
     }

    const local = useStorage<{
        feedbackTill?: string
        hideTill?: string
        items: Record<string, boolean>
    }>(options.storageKey ?? 'assistant_dialog', {
        feedbackTill: undefined,
        hideTill: undefined,
        items: {}
    })

    const reasonToShow = ref<'help' | 'feedback' | undefined>()
    const hideFeedback = ref(options?.hideFeedback == true)
    const tab = ref(0)

    function getLinks(routeName?: string, tags?: string[]) {
        return options?.items.filter(x => {
            if (x.isAlways == true)
                return true

            if (x.routeNames != null && routeName != null)
                if (x.routeNames.some(r => r == routeName))
                    return true

            if (x.tags != null && tags != null)
                if (x.tags.some(xTag => tags.some(tag => xTag == tag)))
                    return true

            return false
        }) ?? []
    }

    function getPrimaryLinks(routeName?: string, tags?: string[]) {
        return options?.items.filter(x => {
            if (x.routeNames != null && routeName != null)
                if (x.routeNames.some(r => r == routeName))
                    return true

            if (x.tags != null && tags != null)
                if (x.tags.some(xTag => tags.some(tag => xTag == tag)))
                    return true

            return false
        }) ?? []
    }

    function getSecondaryLinks(routeName?: string, tags?: string[]) {
        return options?.items.filter(x => {
            if (x.isAlways != true)
                return false

            if (x.routeNames != null && routeName != null)
                if (x.routeNames.some(r => r == routeName))
                    return false

            if (x.tags != null && tags != null)
                if (x.tags.some(xTag => tags.some(tag => xTag == tag)))
                    return false

            return true
        }) ?? []
    }

    function hideDialogPermanently(routeName?: string) {
        if (routeName != null)
            local.value.items[routeName] = true
    }

    function hideDialogTemporarily() {
        if (reasonToShow.value == 'feedback' && options?.feedbackAfterDays != null) {
            local.value.feedbackTill = DateTime.now().plus({ days: options.feedbackAfterDays }).toString()
        }
        else
            local.value.hideTill = DateTime.now().plus({ days: 3 }).toString()
    }

    function doShowDialog(routeName?: string) {
        reasonToShow.value = undefined

        if (routeName == null)
            return false

        const n = DateTime.now().toString()

        if (options?.firstFeedbackAfterDays != null || options?.feedbackAfterDays != null) {
            //check if time for feedback
            if (local.value.feedbackTill == null)
                local.value.feedbackTill = DateTime.now().plus({ days: options?.firstFeedbackAfterDays ?? options?.feedbackAfterDays }).toString()

            if (local.value.feedbackTill < n) {
                tab.value = 1
                reasonToShow.value = 'feedback'

                if (options.feedbackAfterDays != null)
                    local.value.feedbackTill = DateTime.now().plus({ days: options.feedbackAfterDays }).toString()

                return true
            }
        }

        if (local.value.hideTill != null && local.value.hideTill > n)
            return false

        var res = local.value.items[routeName] != true && 
            options!.items.some(x => {
                if (x.routeNames != null && x.routeNames.some(r => r == routeName))
                    return true

                return false
            })

        if (res) {
            tab.value = 0
            reasonToShow.value = 'help'
            return true
        }

        return false
    }

    current = {
        allItems: options.items ?? [],
        doShowDialog,
        getLinks,
        getPrimaryLinks,
        getSecondaryLinks,
        hideFeedback,
        menuRouteName: options.helpMenuRoute,
        hideDialogPermanently,
        hideDialogTemporarily,
        tab
    }

    return current
}

export function findYouTubeAvatar(url?: string) {
    if (url == null)
        return

    var split = url.split('?v=')
    if (split.length < 2)
        return

    split = split[1].split('&')
    if (split[0] != null)
        return `http://img.youtube.com/vi/${split[0]}/0.jpg`
}