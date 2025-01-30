//nav item needs to have a 'ignore Suspension' prop
import { useDataUrl } from '../composables/urls.ts'
import { appendUrl, capitalizeWords, checkImage, deepSelect, singularize } from '../composables/helpers.ts'
import { computed, ref, type Ref } from 'vue'
import { type AuthItem } from './auth.ts'
import type { GetStorageKeyOptions, StorageMode, StoreMode } from './stores.ts'
import { RouteLocation, RouteLocationNormalized, useRouter } from 'vue-router'

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
    /**only applies if connecting to store */
    deleteStrat?: 'soft' | undefined
    /**the name that will be displayed in the navigation menu */
    displayName?: string
    /**where credentials can be found for external parties*/
    externalPartyCredentialNavigation?: string
    /**possible external parties to connect to and sync with */
    externalParties?: ExternalParty[]
    /**possible external party navigation items and how to connect/sync */
    externalNavigations?: ExternalNavigation[]
    /**custom override for getting the key to store */
    getStorageKey?: (dOptions: GetStorageKeyOptions) => string
    /**will hide app bar if set to true when the route opens this nav */
    hideAppBar?: boolean
    /**hide bottom navigation even when xs */
    hideBottomNavigation?: boolean
    /**will hide the nav sidebar if set to true when the route opens this nav */
    hideNavigation?: boolean
    /**will open a dialog box to confirm navigating away from this route */
    hesitate?: boolean
    /**how many minutes until WLU Store clears all data. Undefined means it won't happen */
    minutesToClear?: number
    /**the mdi icon that goes with this nav item.  Will show in places like the nav menu */
    icon?: string
    /**default to false. True will mean that even is account is suspended, this will still allow navigation */
    ignoreSuspension?: boolean
    /**default to true.  When false will hide from nav menu */
    isInNavMenu?: boolean
    /**default item text in lists, selects, etc. */
    itemText?: string
    /**the microservice the leads to the default url to obtain data from.  Defaults to 'default'. */
    microservice?: string
    /**the name of this nav item. */
    name?: string
    /**the url path on top of the base microservice url */
    path?: string
    /**permissions that are required for this navItem.  All these permissions must be met. */
    permissions?: string[]
    /**for PLU stores only - defining what prop to cal window */
    pluWindowProp?: string
    /**for PLU stores only - defining how many days to bunch requests in */
    pluDays?: number
    /**whether to search for list locally or server first */
    priority?: 'server' | 'local'
    /**default to true.  When false will allow universal access regardless of permission */
    requiresAuth?: boolean
    /**the name of the route to access individual items */
    singleName?: string
    /**what kind of store is needed for this api item */
    storeMode?: StoreMode
    /**what kind of storage mode is needed for this api item */
    storageMode?: StorageMode
    /**this nav item is restricted to these subscriptions.  So the user needs to have at least one of these subscription codes. */
    subscriptions?: string[]
    /**this nav item is preferred in this subscription codes. */
    subFilters?: string[] | 'All'
}

export interface BTNavigation {
    showAppBar: Ref<boolean>
    showAppNavigation: Ref<boolean>
    showBottomNavigation: Ref<boolean>
    backgroundName: Ref<string | undefined>
    backgroundURL: Ref<string | undefined>
    hesitate: Ref<boolean>
    navHistory: Ref<RouteLocation[]>
    navigationItems: NavigationItem[],
    findArchiveName: (navName?: string | NavigationItem) => string | undefined
    findCacheHours: (navName?: string | NavigationItem) => number
    findDisplay: (navName?: string | NavigationItem) => string | undefined
    findIcon: (navName?: string | NavigationItem) => string | undefined
    findItem: (navName?: string | NavigationItem) => NavigationItem | null
    findItemText: (navName?: string | NavigationItem) => string | undefined
    findStoreName: (navName?: string | NavigationItem) => string | undefined
    findPath: (navName?: string | NavigationItem) => string | undefined
    findSingleDisplay: (navName?: string | NavigationItem) => string | undefined
    updateBackgroundID: (id?: string) => void
    updateNavigationChange: (to: RouteLocationNormalized, from?: RouteLocationNormalized) => void
}

export interface UseNavigationOptions {
    defaultCacheExpiryHours?: number
    /**for overriding getting the display name */
    getDisplayName?: (navItem: NavigationItem) => string | undefined
    /**returns potential a default company id for background image */
    getDefaultBackgroundID?: () => string | undefined
    /**formulate the background url - whether external or internal */
    getBackgroundURL?: (backgroundID?: string, backgroundName?: string) => string | undefined
    navItems?: NavigationItem[]
}

let current: BTNavigation

export function useNavigation(): BTNavigation {
    return current
}

export function useNavBack() {
    const router = useRouter()
    const navigation = useNavigation()

    function navBack() {
        if (navigation.navHistory.value.length > 1) {
            navigation.navHistory.value.pop()
            const n = navigation.navHistory.value[navigation.navHistory.value.length - 1]
            navigation.navHistory.value.pop()
            if (n != null)
                router.push(n)
        }
        else {
            router.back()
        }
    }

    return {
        canNavBack: computed(() => navigation.navHistory.value.length > 1),
        navBack
    }
}

export function createNavigation(options: UseNavigationOptions): BTNavigation {
    const cacheExpiryHours = options.defaultCacheExpiryHours ?? 7
    const navHistory = ref<RouteLocation[]>([])

    const appBar = ref(true)
    const appNavigation = ref(false)
    const bottomNavigation = ref(false)

    const backgroundURL: Ref<string | undefined> = ref()
    const backgroundID: Ref<string | undefined> = ref()
    const backgroundName: Ref<string | undefined> = ref()
    const hesitate = ref(false)
    // let removeHesitateListener: any = null

    const failedBackgroundIDs: string[] = []
    const goodBackgroundIDs: string [] = []
    
    options.getDisplayName ??= (navItem: NavigationItem) => {
        if (navItem.displayName != null)
            return navItem.displayName
        if (navItem.name != null)
            return capitalizeWords(navItem.name.replaceAll('-', ' '))
        return undefined
    }

    options.getDefaultBackgroundID ??= () => undefined
    options.getBackgroundURL ??= () => undefined

    const navigationList = (options.navItems ?? []).map(x => {
        return {
            displayName: x.displayName ?? options.getDisplayName!(x),
            ...x
        }
    })

    function findArchiveName(navName?: string | NavigationItem): string | undefined {
        return findItem(navName)?.archiveName
    }

    function findCacheHours(navName?: string | NavigationItem): number {
        return findItem(navName)?.cacheExpiryHours ?? cacheExpiryHours
    }

    function findDisplay(navName?: string | NavigationItem): string | undefined {
        return findItem(navName)?.displayName
    }

    function findIcon(navName?: string | NavigationItem): string | undefined {
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

    function findItemText(navName?: string | NavigationItem): string | undefined {
        return findItem(navName)?.itemText
    }

    /**defaults to microservice of default */
    function findPath(navName?: string | NavigationItem) {
        const navItem = findItem(navName)
        if (navItem == null) return undefined

        let vPath = useDataUrl(navItem.microservice ?? 'default') ?? ''

        if (navItem.path != null)
            vPath = appendUrl(vPath, navItem.path)

        if (vPath?.endsWith('/'))
            vPath = vPath.slice(0, vPath.length - 1)

        return vPath
    }

    /**finds display name and attempts to remove plural suffixes */
    function findSingleDisplay(navName?: string | NavigationItem): string | undefined {
        const item = findItem(navName)

        if (item?.singleName != null)
            return item.singleName

        const displayName = item?.displayName

        if (displayName == null) return undefined

        return singularize(displayName)
    }

    function findStoreName(navName?: string | NavigationItem) {
        const navItem = findItem(navName)
        return navItem?.name ?? navItem?.singleName
    }

    function updateBackgroundURL() {
        let bID = backgroundID.value ?? options.getDefaultBackgroundID!()
        if (bID != null && failedBackgroundIDs.some(x => x == bID))
            bID = undefined

        backgroundID.value = bID
        backgroundURL.value = options.getBackgroundURL!(backgroundID.value, backgroundName.value)
    }

    function updateBackgroundID(id?: string) {
        if (id == null || goodBackgroundIDs.some(x => x == id)) {
            backgroundID.value = id
            updateBackgroundURL()
        }
        else if (failedBackgroundIDs.some(x => x == id)) {
            backgroundID.value = undefined
            updateBackgroundURL()
        }
        else {
            const url = options.getBackgroundURL != null ? options.getBackgroundURL(id) : undefined
            if (url != null) {
                checkImage(
                    url,
                    () => {
                        goodBackgroundIDs.push(id)
                        backgroundID.value = id
                        updateBackgroundURL()
                    },
                    () => {
                        failedBackgroundIDs.push(id)
                        backgroundID.value = undefined
                        updateBackgroundURL()
                    }
                )
            }
        }
    }

    function updateNavigationChange(to: RouteLocationNormalized, from?: RouteLocationNormalized) {

        //if moving from new blade to item blade, remove previous 'new' nav
        if (to.name == from?.name && (from?.params.id == 'new' || from?.query.id == 'new'))
            navHistory.value.pop()

        if (to.params.navIgnore !== 'true')
            navHistory.value.push(to)

        const navName = (to.meta.nav ?? to.name) as string
        const navItem = findItem(navName)

        const newBackgroundName = to.meta.background as string ?? navItem?.background

        if (newBackgroundName != backgroundName.value) {
            backgroundName.value = newBackgroundName
            if (backgroundID.value == null)
                updateBackgroundURL()
        }

        appNavigation.value = to.meta.hideNavigation !== true && navItem?.hideNavigation !== true
        bottomNavigation.value = to.meta.hideBottomNavigation !== true && navItem?.hideBottomNavigation !== true
        appBar.value = to.meta.hideAppBar !== true && navItem?.hideAppBar !== true
    }

    current = {
        showAppBar: appBar,
        showAppNavigation: appNavigation,
        showBottomNavigation: bottomNavigation,
        backgroundName,
        backgroundURL,
        hesitate,
        navigationItems: navigationList,
        findArchiveName,
        findCacheHours,
        findDisplay,
        findIcon,
        findItem,
        findItemText,
        findStoreName,
        findPath,
        findSingleDisplay,
        navHistory,
        updateBackgroundID,
        updateNavigationChange
    }

    return current
}