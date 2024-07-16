<template>
    <!-- v-if="isLoggedIn" -->
    <v-navigation-drawer
        disabled-resize-watcher
        expand-on-hover
        :rail="!state.drawerStick"
        permanent
        v-model="state.drawer">
        <slot>
            <v-list class="pt-1">
                <v-list-item nav :title="title">
                    <template #prepend>
                        <v-avatar size="36">
                            <v-img :src="iconSrc" />
                        </v-avatar>
                    </template>
                    <template #append>
                        <v-row class="mr-1">
                            <v-btn
                                @click="toggleDrawerStick"
                                flat
                                icon
                                size="small"
                                title="Pin/Unpin Menu">
                                <v-icon>{{ state.drawerStick ? '$pin-off' : '$pin' }}</v-icon>
                            </v-btn>
                        </v-row>
                    </template>
                </v-list-item>
                <slot name="top-list">
                   
                </slot>
            </v-list>

            <slot name="middle-list">
                <v-list v-if="isLoggedIn" nav>
                    <template v-for="grp in menu.sidebarNavItems.value">
                        <v-list-group v-if="grp.isGroup" :key="`${grp.displayName}a`">
                            <template #activator="{ props }">
                                <v-list-item v-bind="props" 
                                    color="primary"
                                    :prepend-icon="grp.icon"
                                    :title="grp.displayName" />
                            </template>

                            <v-list-item v-for="menuItem in grp.items" :key="menuItem.displayName"
                                color="primary"
                                :prepend-icon="menuItem.icon"
                                :title="menuItem.displayName"
                                :value="menuItem.displayName"
                                :to="{ name: menuItem.routeName }" />

                        </v-list-group>
                        <v-list-item v-else :key="`${grp.displayName}b`"
                            color="primary"
                            :prepend-icon="grp.icon"
                            :title="grp.displayName"
                            :value="grp.displayName"
                            :to="{ name: grp.routeName }" />
                    </template>
                </v-list>
            </slot>
        </slot>
        <template #append>
            <slot name="bottom-list">
                <v-list v-if="isLoggedIn" class="ma-0 pa-0">
                    <v-list-item
                        class="bg-primary"
                        nav
                        prepend-icon="$logout"
                        title="Logout"
                        @click="() => logout('/', router)" />
                </v-list>
            </slot>
        </template>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useCosmetics } from '../composables/cosmetics.ts'
import { useAuth } from '../composables/auth.ts'
import { useMenu } from '../composables/menu.ts'
import { useRouter } from 'vue-router'

interface SidebarProps {
    iconSrc?: string
    title?: string
}

defineProps<SidebarProps>()
const { state, toggleDrawerStick } = useCosmetics()
const { isLoggedIn, logout } = useAuth()
const router = useRouter()
const menu = useMenu()

</script>