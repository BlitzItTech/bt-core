//nav item needs to have a 'ignore Suspension' prop
import { useUrl } from '@/composables/urls'
import { appendUrl, deepSelect } from '@/composables/helpers'
import { ref, type Ref } from 'vue'
import { type AuthItem } from './auth'

export interface ExternalParty {
    party?: string
    property?: string
}

export interface ExternalNavigation {
    canPull?: boolean
    canPush?: boolean
    convertFunc?: Function
    name?: string
    localNavigation?: string
    localDisplayPath?: string
    localComparePath?: string
    syncComparePath?: string
    syncDisplayPath?: string
    syncIDPath?: string
}

export interface NavigationItem extends AuthItem {
    /**aliases are other names that could use this navigation item's set of permissions, etc.*/
    aliases?: string[]
    /**potentially the nav that leads to the archive */
    archiveName?: string
    /**the name of the background img to show when the route opens this nav */
    background?: string
    /**how long until locally cached data is refreshed */
    cacheExpiryHours?: number
    /**any children of this nav item */
    children?: NavigationItem[]
    /**the name that will be displayed in the navigation menu */
    displayName?: string
    /**where credentials can be found for external parties*/
    externalPartyCredentialNavigation?: string
    /**possible external parties to connect to and sync with */
    externalParties?: ExternalParty[]
    /**possible external party navigation items and how to connect/sync */
    externalNavigations?: ExternalNavigation[]
    /**will hide app bar if set to true when the route opens this nav */
    hideAppBar?: boolean
    /**will hide the nav sidebar if set to true when the route opens this nav */
    hideNavigation?: boolean
    /**will open a dialog box to confirm navigating away from this route */
    hesitate?: boolean
    /**the mdi icon that goes with this nav item.  Will show in places like the nav menu */
    icon?: string
    /**default to false. True will mean that even is account is suspended, this will still allow navigation */
    ignoreSuspension?: boolean
    /**default to true.  When false will hide from nav menu */
    isInNavMenu?: boolean
    /**the microservice the leads to the default url to obtain data from.  Defaults to 'default'. */
    microservice?: string
    /**the name of this nav item. */
    name?: string
    /**the url path on top of the base microservice url */
    path?: string
    /**permissions that are required for this navItem.  All these permissions must be met. */
    permissions?: string[]
    /**default to true.  When false will allow universal access regardless of permission */
    requiresAuth?: boolean
    /**the name of the route to access individual items */
    singleName?: string
    /**this nav item is restricted to these subscriptions.  So the user needs to have at least one of these subscription codes. */
    subscriptions?: string[]
    /**this nav item is preferred in this subscription codes. */
    subFilters?: string[]
}

const appBar = ref(true)
const appNavigation = ref(false)
const backgroundName: Ref<string | undefined> = ref()
const hesitate = ref(false)
let removeHesitateListener: any = null

export interface BTNavigation {
    showAppBar: Ref<boolean>
    showAppNavigation: Ref<boolean>
    backgroundName: Ref<string | undefined>
    hesitate: Ref<boolean>
    navigationItems: NavigationItem[],
    findArchiveName: (navName?: string) => string | undefined
    findCacheHours: (navName?: string) => number
    findDisplay: (navName?: string) => string | undefined
    findIcon: (navName?: string) => string | undefined
    findItem: (navName?: string | NavigationItem) => NavigationItem | null
    findStoreName: (navName?: string) => string
    findPath: (navName?: string) => string | undefined
    findSingleDisplay: (navName?: string) => string | undefined
    updateNavigationProperties: (navName?: string | NavigationItem) => void
}

interface UseNavigationOptions {
    defaultCacheExpiryHours?: number
    navItems?: NavigationItem[]
}

export function createNavigation(options: UseNavigationOptions): BTNavigation {
    const cacheExpiryHours = options.defaultCacheExpiryHours ?? 7
    const navigationList = options.navItems ?? []

    function findArchiveName(navName?: string): string | undefined {
        return findItem(navName)?.archiveName
    }

    function findCacheHours(navName?: string): number {
        return findItem(navName)?.cacheExpiryHours ?? cacheExpiryHours
    }

    function findDisplay(navName?: string): string | undefined {
        return findItem(navName)?.displayName
    }

    function findIcon(navName?: string): string | undefined {
        return findItem(navName)?.icon
    }

    function findItem(navName?: string | NavigationItem) {
        if (navName == null) return null
        if (typeof navName != 'string') return navName

        const items = deepSelect(navigationList, (x: NavigationItem) => x.children) as NavigationItem[]

        return items.find(navItem => navItem.name == navName ||
            navItem.singleName == navName ||
            navItem.aliases?.some(y => y == navName)) ?? null
    }

    /**defaults to microservice of default */
    function findPath(navName?: string) {
        const navItem = findItem(navName)
        if (navItem == null) return undefined

        let vPath = useUrl(navItem.microservice ?? 'default') ?? ''

        if (navItem.path != null)
            vPath = appendUrl(vPath, navItem.path)

        if (vPath?.endsWith('/'))
            vPath = vPath.slice(0, vPath.length - 1)

        return vPath
    }

    /**finds display name and attempts to remove plural suffixes */
    function findSingleDisplay(navName?: string): string | undefined {
        const item = findItem(navName)

        if (item?.singleName != null)
            return item.singleName

        const displayName = item?.displayName

        if (displayName == null) return undefined

        if (displayName.endsWith('ies'))
            return displayName.slice(0, displayName.length - 3)

        if (displayName.endsWith('es'))
            return displayName.slice(0, displayName.length - 2)

        if (displayName.endsWith('s'))
            return displayName.slice(0, displayName.length - 1)

        return displayName
    }

    function findStoreName(navName?: string) {
        const navItem = findItem(navName)
        return navItem?.name ?? navItem?.singleName ?? 'store'
    }

    /**updates background, navigation sidebar, and app bar settings */
    function updateNavigationProperties(navName?: string | NavigationItem) {
        if (navName == null) return

        const item = typeof navName == 'string' ? findItem(navName) : navName

        backgroundName.value = item?.background
        appNavigation.value = item?.hideNavigation !== true
        appBar.value = item?.hideAppBar !== true

        if (removeHesitateListener != null)
            removeHesitateListener()

        hesitate.value = item?.hesitate === true

        if (hesitate.value)
            removeHesitateListener = window.addEventListener('beforeunload', e => {
                e.preventDefault()
            })
    }

    return {
        showAppBar: appBar,
        showAppNavigation: appNavigation,
        backgroundName,
        hesitate,
        navigationItems: navigationList,
        findArchiveName,
        findCacheHours,
        findDisplay,
        findIcon,
        findItem,
        findStoreName,
        findPath,
        findSingleDisplay,
        updateNavigationProperties
    }
}
