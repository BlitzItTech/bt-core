<template>
    <div>
        <v-menu v-if="isLengthyArray(primaryLinks) || isLengthyArray(secondaryLinks)" max-width="450">
            <template #activator="{ props }">
                <v-btn
                    v-bind="props"
                    :icon="buttonIcon ?? '$help-circle-outline'"
                    :size="buttonSize" />
            </template>
            <v-list v-if="isLengthyArray(primaryLinks)" class="pa-2">
                <v-list-subheader>'How To' Links</v-list-subheader>
                <v-card v-for="(link, ind) in primaryLinks" :key="ind"
                    :prepend-icon="link.icon"
                    class="ma-1"
                    :href="link.url"
                    target="_blank"
                    :text="link.description"
                    :append-avatar="findYouTubeAvatar(link.url)"
                    :title="link.title"
                    :subtitle="link.subtitle" />
            </v-list>
            <v-list v-if="isLengthyArray(secondaryLinks)" class="pa-2">
                <v-list-subheader>Other Helpful Links</v-list-subheader>
                <v-card v-for="(link, ind) in secondaryLinks" :key="ind"
                    :prepend-icon="link.icon"
                    class="ma-1"
                    :href="link.url"
                    target="_blank"
                    :text="link.description"
                    :append-avatar="findYouTubeAvatar(link.url)"
                    :title="link.title"
                    :subtitle="link.subtitle" />
            </v-list>
        </v-menu>
        <v-dialog v-model="showDialog" max-width="450">
            <v-card
                :append-icon="buttonIcon ?? '$help-circle-outline'"
                lines="two"
                subtitle="Here are some relevant tips and clips."
                title="Tips Assistant">
                <v-btn
                    @click="neverShowAgain"
                    hide-details
                    rounded
                    text="Hide Forever"
                    variant="tonal" />
                
                <v-divider />

                <v-list v-if="isLengthyArray(primaryLinks)" class="pa-2">
                    <v-list-subheader>Links</v-list-subheader>
                    <v-card v-for="(link, ind) in primaryLinks" :key="ind"
                        :prepend-icon="link.icon"
                        class="ma-1"
                        :href="link.url"
                        target="_blank"
                        :text="link.description"
                        :append-avatar="findYouTubeAvatar(link.url)"
                        :title="link.title"
                        :subtitle="link.subtitle" />
                </v-list>
                <v-divider v-if="isLengthyArray(secondaryLinks)" />
                <v-list v-if="isLengthyArray(secondaryLinks)" class="pa-2">
                    <v-list-subheader>Other Links</v-list-subheader>
                    <v-card v-for="(link, ind) in secondaryLinks" :key="ind"
                        :prepend-icon="link.icon"
                        class="ma-1"
                        :href="link.url"
                        target="_blank"
                        :text="link.description"
                        :append-avatar="findYouTubeAvatar(link.url)"
                        :title="link.title"
                        :subtitle="link.subtitle" />
                </v-list>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
    import { isLengthyArray } from '../composables/helpers.ts'
    import { HelpLink, useAssistant } from '../composables/assistant.ts'
    import { firstBy } from 'thenby'
    import { onMounted, ref, watch } from 'vue'
    import { useRoute } from 'vue-router'
    
    const props = defineProps<{
        buttonIcon?: string
        buttonSize?: string
        tags?: string[]
    }>()

    function findYouTubeAvatar(url?: string) {
        if (url == null)
            return

        var split = url.split('?v=')
        if (split.length < 2)
            return

        split = split[1].split('&')
        if (split[0] != null)
            return `http://img.youtube.com/vi/${split[0]}/0.jpg`
    }

    const { doShowDialog, getPrimaryLinks, getSecondaryLinks, hideDialogPermanently } = useAssistant()
    const route = useRoute()

    const primaryLinks = ref<HelpLink[]>([])
    const secondaryLinks = ref<HelpLink[]>([])
    
    const showDialog = ref(false)

    function neverShowAgain() {
        if (route.name != null)
            hideDialogPermanently(route.name as string)

        showDialog.value = false
    }

    watch(() => route.name, (v) => {
        primaryLinks.value = getPrimaryLinks(v?.toString(), props.tags).sort(firstBy((x: HelpLink) => x.sort ?? 0)) ?? []
        secondaryLinks.value = getSecondaryLinks(v?.toString(), props.tags).sort(firstBy((x: HelpLink) => x.sort ?? 0)) ?? []
        
        if (doShowDialog(v as string))
            showDialog.value = true
    })

    onMounted(() => {
        if (route.name != null) {
            primaryLinks.value = getPrimaryLinks(route.name?.toString(), props.tags).sort(firstBy((x: HelpLink) => x.sort ?? 0)) ?? []
            secondaryLinks.value = getSecondaryLinks(route.name?.toString(), props.tags).sort(firstBy((x: HelpLink) => x.sort ?? 0)) ?? []

            if (doShowDialog(route.name as string))
                showDialog.value = true
        }
    })

</script>