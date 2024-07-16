<template>
    <v-menu
        :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn 
                icon="$theme-light-dark"
                :size="size"
                title="Colors & Styles"
                v-bind="props"
                variant="text" />
        </template>

        <v-list density="compact" max-height="450px">
            <div class="d-flex pr-2">
                <v-list-subheader class="d-flex">Styles & Colors</v-list-subheader>
                <v-spacer />
                <v-btn
                    @click="cosmetics.resetCosmetics(true)"
                    size="small"
                    text="Reset" />
            </div>

            <v-list-item
                @click="() => cosmetics.toggleLightDark()"
                prepend-icon="$theme-light-dark"
                title="Toggle Light/Dark Mode" />

            <v-divider class="my-1" />

            <v-list-subheader>Custom</v-list-subheader>

            <v-list-item
                v-if="currentColorSet != null"
                :subtitle="currentColorSet.primary"
                title="Primary Color">
                <template #append>
                    <BTColorPickerMenu
                        @change="() => cosmetics.resetCosmetics(false)"
                        :color="currentColorSet.primary"
                        v-model="currentColorSet.primary" />
                </template>
            </v-list-item>

            <v-list-item
                v-if="currentColorSet != null"
                :subtitle="currentColorSet.secondary"
                title="Secondary Color">
                <template #append>
                    <BTColorPickerMenu
                        @change="() => cosmetics.resetCosmetics(false)"
                        :color="currentColorSet.secondary"
                        v-model="currentColorSet.secondary" />
                </template>
            </v-list-item>

            <v-list-item
                v-if="currentColorSet != null"
                :subtitle="currentColorSet.accent"
                title="Accent Color">
                <template #append>
                    <BTColorPickerMenu
                        @change="() => cosmetics.resetCosmetics(false)"
                        :color="currentColorSet.accent"
                        v-model="currentColorSet.accent" />
                </template>
            </v-list-item>

            <v-divider class="my-1" />

            <v-list-subheader>Templates</v-list-subheader>

            <v-card>
                <v-row v-for="(color, ind) in colorOptions" dense :key="ind" @click="selectTemplate(color)">
                    <v-col cols="4">
                        <v-btn :color="color.primary" />
                    </v-col>
                    <v-col cols="4">
                        <v-btn :color="color.secondary" />
                    </v-col>
                    <v-col cols="4">
                        <v-btn :color="color.accent" />
                    </v-col>
                    <v-divider class="my-1" />
                </v-row>
            </v-card>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
    import colors from 'vuetify/util/colors'
    import { useTheme } from 'vuetify'
    import BTColorPickerMenu from './BT-Color-Picker-Menu.vue'
    import { computed } from 'vue'
    import { useCosmetics } from '../composables/cosmetics.ts'

    interface MenuProps {
        size?: string
    }

    defineProps<MenuProps>()

    const colorOptions = [
        {
            primary: '#192233',
            secondary: '#192233',
            accent: '#7fcbf7'
        },
        {
            primary: colors.pink.darken2,
            secondary: colors.pink.base,
            accent: colors.pink.base
        },
        {
            primary: colors.purple.darken2,
            secondary: colors.purple.base,
            accent: colors.purple.base
        },
        {
            primary: colors.indigo.darken2,
            secondary: colors.indigo.base,
            accent: colors.indigo.base
        },
        {
            primary: colors.teal.darken2,
            secondary: colors.teal.base,
            accent: colors.teal.base
        },
        {
            primary: colors.green.darken2,
            secondary: colors.green.base,
            accent: colors.green.base
        },
        { 
            primary: colors.lightGreen.darken2,
            secondary: colors.lightGreen.base,
            accent: colors.lightGreen.base
        },
        { 
            primary: colors.orange.darken2,
            secondary: colors.orange.base,
            accent: colors.orange.base
        },
        { 
            primary: colors.blueGrey.darken2,
            secondary: colors.blueGrey.base,
            accent: colors.blueGrey.base
        },
        { 
            primary: colors.red.darken2,
            secondary: colors.red.base,
            accent: colors.red.base
        }
    ]

    const theme = useTheme()
    const cosmetics = useCosmetics()

    const currentColorSet = computed(() => theme.current.value.dark ? cosmetics.state.value.dark : cosmetics.state.value.light)

    function selectTemplate(t: any) {
        if (currentColorSet.value != null) {
            currentColorSet.value.primary = t.primary
            currentColorSet.value.secondary = t.secondary
            currentColorSet.value.accent = t.accent
            cosmetics.resetCosmetics(false)
        }
    }
</script>