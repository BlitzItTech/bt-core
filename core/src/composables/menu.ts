import type { Ref, ComputedRef } from 'vue'
import { ref, computed } from 'vue'
import { RouteRecordNormalized, useRouter } from 'vue-router'
import { firstBy } from 'thenby'
import { useNavigation } from './navigation.ts'
import { useAuth } from './auth.ts'
import { isLengthyArray } from './helpers.ts'

export interface MenuGroup {
    displayName: string
    icon?: string
    isGroup?: boolean
    items?: MenuGroup[]
    permissions?: string[]
    requiresAuth?: boolean
    sortNumber?: number
    subscriptions?: string[],
    subFilters?: string[] | 'All',
    routeName?: any
}

export interface CreateMenuOptions {
    default?: string
    groups?: MenuGroup[]
    /**whether to read from vue routes or just purely the given groups */
    useRoutes?: boolean
}

export interface BTCreateMenu {
    /**filter to only these groups */
    currentGroup: Ref<string | undefined>
    /**filter to only menu items with this subscription view */
    currentView: Ref<string | undefined>
    groupOptions: Ref<MenuGroup[]>
    /**whether to read from vue routes or just purely the given groups */
    useRoutes?: boolean
}

export interface BTMenu extends BTCreateMenu {
    sidebarNavItems: ComputedRef<MenuGroup[]>
}

let current: BTCreateMenu

export function createMenu(options?: CreateMenuOptions): BTCreateMenu {
    const currentGroup = ref<string | undefined>(options?.default) // ?? 'Admin')
    const currentView = ref<string | undefined>()
    const groups = ref<MenuGroup[]>(options?.groups ?? [])

    current = {
        currentGroup,
        currentView,
        groupOptions: groups,
        useRoutes: options?.useRoutes
    }

    return current
}

export function useMenu(): BTMenu {
    const router = useRouter()
    const navigation = useNavigation()
    const auth = useAuth()
    let routes = router.getRoutes()

    return {
        ...current,
        sidebarNavItems: computed(() => {
            routes = routes.filter(z => z.meta != null && z.meta.menuGroup != null)

            let groupItems: MenuGroup[] = []

            routes.forEach((route: RouteRecordNormalized) => {
                const optionMeta = current.groupOptions.value.find(z => z.displayName == route.meta.menuGroup)
                const navMeta = navigation.findItem(route.meta.nav as string | undefined)
                const routeMeta = route.meta

                let existingGroup = groupItems.find(z => z.displayName == routeMeta.menuGroup)
                if (existingGroup == null) {
                    existingGroup = {
                        displayName: routeMeta.menuGroup as string,
                        icon: optionMeta?.icon ?? routeMeta?.icon as string | undefined ?? navMeta?.icon,
                        isGroup: true,
                        items: [],
                        routeName: '',
                        sortNumber: optionMeta?.sortNumber
                    }

                    groupItems.push(existingGroup)
                }

                let subOptions: string[] = []
                if (routeMeta.subFilters != null) {
                    if (Array.isArray(routeMeta.subFilters))
                        subOptions = routeMeta.subFilters
                    else
                        subOptions = [routeMeta.subFilters as string]
                }
                
                if (navMeta?.subFilters != null && !isLengthyArray(subOptions)) {
                    subOptions = Array.isArray(navMeta.subFilters) ? navMeta.subFilters : [navMeta.subFilters]
                }
                
                if (current.currentView.value == null || !isLengthyArray(subOptions) || subOptions.some((subOption: string) => subOption == 'All' || current.currentView.value == subOption)) {
                    existingGroup.items?.push({
                        displayName: routeMeta?.displayName as string ?? navigation.findDisplay(navMeta ?? undefined),
                        icon: routeMeta?.icon as string ?? navigation.findIcon(navMeta ?? undefined),
                        permissions: routeMeta?.permissions as string[] ?? navMeta?.permissions ?? [],
                        requiresAuth: routeMeta?.requiresAuth !== false,
                        subscriptions: routeMeta?.subscriptions as string[] ?? navMeta?.subscriptions ?? [],
                        subFilters: subOptions, //routeMeta?.subFilters as string[] ?? navMeta?.subFilters ?? [],
                        routeName: route.name as string
                    })
                }
            })

            groupItems.forEach((grp: MenuGroup) => {
                grp.items = grp.items?.filter(z => !z.requiresAuth || auth.doShow(z.subscriptions, z.permissions, 'view')).sort(firstBy(z => z.displayName))
            })

            groupItems.sort(firstBy(x => x.sortNumber ?? x.displayName))

            if (current.currentGroup.value != null) {
                return groupItems.find(z => z.displayName == current.currentGroup.value)?.items ?? []
            }
            else {
                return groupItems.filter(z => !z.requiresAuth || auth.doShow(z.subscriptions, z.permissions, 'view'))
            }
        })
    }
}