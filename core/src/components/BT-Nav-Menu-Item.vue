<template>
    <v-list-group v-if="doShowItem && relevantChildren.length > 0"
        color="accent"
        :subGroup="isSubGroup"
        fluid>
        <template #activator="{ props }">
            <v-list-item v-bind="props"
                :prepend-icon="item.icon"
                :title="item.displayName" />
        </template>
        <BT-Nav-Menu-Item 
            v-for="child in relevantChildren"
            :key="child.name"
            isSubGroup
            :item="child" />
    </v-list-group>
    <v-list-item v-else-if="doShowItem"
        color="accent"
        :prepend-icon="item.icon"
        nav
        :title="item.displayName ?? item.name"
        :to="{ name: item.name }">
    </v-list-item>
    <v-divider v-else-if="item.isDivider" />
    <div v-else>test</div>
</template>

<script setup lang="ts">
    import BTNavMenuItem from './BT-Nav-Menu-Item.vue'
    import { computed } from 'vue'
    import { useAuth } from '../composables/auth.ts'
    import { isLengthyArray } from '../composables/helpers.ts'
    import { type NavigationItem } from '../composables/navigation.ts'
    
    interface ItemProps {
        allowedSubscriptionCodes?: string[],
        isSubGroup?: boolean,
        item?: any
    }

    const props = withDefaults(defineProps<ItemProps>(), {
        allowedSubscriptionCodes: () => [],
        isSubGroup: false,
        item: null
    })

    const { doShowByNav } = useAuth()

    const relevantChildren = computed(() => {
        const l = props.item.children?.filter((x: NavigationItem) => x.isInNavMenu !== false) ?? []
        if (!isLengthyArray(props.allowedSubscriptionCodes)) {
            return l
        }

        return l.filter((navItem: NavigationItem) => !isLengthyArray(navItem.subFilters) || props.allowedSubscriptionCodes.some(code => navItem.subFilters?.some(sFilter => sFilter == code)))
    })
    
    const doShowItem = computed(() => doShowByNav(props.item, true))

</script>