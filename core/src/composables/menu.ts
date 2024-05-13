import type { Ref, ComputedRef } from 'vue'
import { ref, computed } from 'vue'
import { RouteRecordNormalized, useRouter } from 'vue-router'
import { firstBy } from 'thenby'
import { useNavigation } from './navigation.ts'
import { useAuth } from './auth.ts'

export interface MenuGroup {
    displayName: string
    icon?: string
    isGroup?: boolean
    items?: MenuGroup[]
    permissions?: string[]
    requiresAuth?: boolean
    sortNumber?: number
    subscriptions?: string[],
    subFilters?: string[],
    routeName?: string
}

export interface CreateMenuOptions {
    default?: string
    groups?: MenuGroup[]
    /**whether to read from vue routes or just purely the given groups */
    useRoutes?: boolean
}

export interface BTCreateMenu {
    currentGroup: Ref<string | undefined>
    groupOptions: Ref<MenuGroup[]>
    /**whether to read from vue routes or just purely the given groups */
    useRoutes?: boolean
}

export interface BTUseMenu extends BTCreateMenu {
    sidebarNavItems: ComputedRef<MenuGroup[]>
}

let current: BTCreateMenu

export function createMenu(options?: CreateMenuOptions): BTCreateMenu {
    const currentGroup = ref<string | undefined>(options?.default ?? 'Admin')
    const groups = ref<MenuGroup[]>(options?.groups ?? [])

    current = {
        currentGroup,
        groupOptions: groups,
        useRoutes: options?.useRoutes
    }

    return current
}

export function useMenu(): BTUseMenu {
    const router = useRouter()
    const navigation = useNavigation()
    const auth = useAuth()
    let routes = router.getRoutes()

    return {
        ...current,
        sidebarNavItems: computed(() => {
            routes = routes.filter(z => z.meta != null && z.meta.menuGroup != null)

            const groupItems: MenuGroup[] = []

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
                        items: []
                    }

                    groupItems.push(existingGroup)
                }

                existingGroup.items?.push({
                    displayName: routeMeta?.displayName as string ?? navigation.findDisplay(navMeta ?? undefined),
                    icon: routeMeta?.icon as string ?? navigation.findIcon(navMeta ?? undefined),
                    permissions: routeMeta?.permissions as string[] ?? navMeta?.permissions ?? [],
                    requiresAuth: routeMeta?.requiresAuth !== false,
                    subscriptions: routeMeta?.subscriptions as string[] ?? navMeta?.subscriptions ?? [],
                    subFilters: routeMeta?.subFilters as string[] ?? navMeta?.subFilters ?? [],
                    routeName: route.name as string
                })
            })

            groupItems.forEach((grp: MenuGroup) => {
                grp.items = grp.items?.filter(z => !z.requiresAuth || auth.doShow(z.subscriptions, z.permissions, 'view')).sort(firstBy(z => z.displayName))
            })

            if (current.currentGroup.value != null) {
                return groupItems.find(z => z.displayName == current.currentGroup.value)?.items ?? []
            }
            else {
                return groupItems.filter(z => !z.requiresAuth || auth.doShow(z.subscriptions, z.permissions, 'view'))
            }
        })
    }
}