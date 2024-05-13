<template>
    <v-navigation-drawer
        v-if="isLoggedIn"
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
                                <v-icon>{{ state.drawerStick ? 'mdi-pin-off' : 'mdi-pin' }}</v-icon>
                            </v-btn>
                        </v-row>
                    </template>
                </v-list-item>
                <slot name="top-list">
                   
                </slot>
            </v-list>

            <slot name="middle-list">
                <v-list nav>
                    <BT-Nav-Menu-Item
                        v-for="(item, index) in navItems"
                        :key="index"
                        :item="item" />
                </v-list>
            </slot>
        </slot>
        <template #append>
            <slot name="bottom-list">
                <v-list v-if="isLoggedIn" class="ma-0 pa-0">
                    <v-list-item
                        class="bg-primary"
                        prepend-icon="mdi-logout"
                        title="Logout"
                        @click="() => logout()" />
                </v-list>
            </slot>
        </template>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import BTNavMenuItem from './BT-Nav-Menu-Item.vue'
import { useCosmetics } from '../composables/cosmetics.ts'
import { useNavigation } from '../composables/navigation.ts'
import { useAuth } from '../composables/auth.ts'
import { computed } from 'vue'

interface SidebarProps {
    // greeting?: string
    iconSrc?: string
    title?: string
}

defineProps<SidebarProps>()
const { state, toggleDrawerStick } = useCosmetics()
const { isLoggedIn, logout } = useAuth()
const navigation = useNavigation()

const navItems = computed(() => navigation.navigationItems.filter(x => x.isInNavMenu !== false && navigation.backgroundName.value == x.background));

</script>