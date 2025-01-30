import { useStorage } from "@vueuse/core"

export interface HelpLink {
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
    // youtubeClipID?: string
}

export interface CreateAssistantOptions {
    items: HelpLink[]
    storageKey?: string
}

export interface BTAssistant {
    doShowDialog: (routeName?: string) => boolean
    getLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    getPrimaryLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    getSecondaryLinks: (routeName?: string, tags?: string[]) => HelpLink[]
    hideDialogPermanently: (rotueName?: string) => void
}

let current: BTAssistant

export function useAssistant(): BTAssistant {
    return current
}

export function createAssistant(options?: CreateAssistantOptions): BTAssistant {
    if (current != null)
        return current

    options ??= { items: [] }

    const local = useStorage<{
        items: Record<string, boolean>
    }>(options.storageKey ?? 'assistant_dialog', {
        items: {}
    })


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

    function doShowDialog(routeName?: string) {
        if (routeName == null)
            return false

        return local.value.items[routeName] != true && 
            options!.items.some(x => {
                if (x.routeNames != null && x.routeNames.some(r => r == routeName))
                    return true

                return false
            })

    }

    current = {
        doShowDialog,
        getLinks,
        getPrimaryLinks,
        getSecondaryLinks,
        hideDialogPermanently
    }

    return current
}