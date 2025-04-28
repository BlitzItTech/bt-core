<template>
    <div>
        <v-menu 
            v-if="isLengthyArray(primaryLinks) || isLengthyArray(secondaryLinks)" 
            max-width="450"
            :close-on-content-click="false">
            <template #activator="{ props }">
                <v-btn
                    v-bind="props"
                    :icon="buttonIcon ?? '$help-circle-outline'"
                    :size="buttonSize" />
            </template>

            <v-card>
                <div class="d-flex align-center">
                    <v-tabs
                        v-model="tab">
                        <v-tab>
                            <v-icon start icon="$help-circle-outline" />Help
                        </v-tab>
                        <v-tab>
                            <v-icon start icon="$feedback" />Feedback
                        </v-tab>
                    </v-tabs>
                    <!-- <v-spacer />
                    <v-btn 
                        @click=""
                        size="small"
                        icon="$close" 
                        variant="text" /> -->
                </div>
                <v-tabs-window v-model="tab">
                    <v-tabs-window-item>
                        <v-card>
                            <v-list class="pa-2">
                                <div class="d-flex align-center">
                                    <v-list-subheader v-if="isLengthyArray(primaryLinks)">
                                        Relevant Links
                                    </v-list-subheader>
                                    <v-spacer />
                                    <v-btn 
                                        v-if="menuRouteName != null"
                                        append-icon="$arrow-right"
                                        size="small"
                                        text="More Help"
                                        :to="{ name: menuRouteName }"
                                        variant="text" />
                                </div>
                                <v-card v-for="(link, ind) in primaryLinks" :key="ind"
                                    :prepend-icon="link.icon"
                                    class="ma-1"
                                    :href="link.url"
                                    target="_blank"
                                    :text="link.description"
                                    :append-avatar="findYouTubeAvatar(link.url)"
                                    :title="link.title"
                                    :subtitle="link.subtitle" />
                                
                                <v-list-subheader v-if="isLengthyArray(secondaryLinks)">Other Helpful Links</v-list-subheader>

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
                    </v-tabs-window-item>
                    <v-tabs-window-item>
                         <v-card
                            min-width="330"
                            subtitle="Share your thoughts with us"
                            title="Give Feedback">
                            <template #default>
                                <v-textarea
                                    autofocus
                                    hide-details
                                    lines="three"
                                    placeholder="...start typing any requests, suggestions, or frustrations you might have.  Unburden yourself."
                                    v-model="feedbackString" />
                                
                                <v-card-subtitle class="mt-2">Or just give us a rating</v-card-subtitle>
                                
                                <div class="text-center">
                                    <v-rating
                                        active-color="primary"
                                        hover
                                        :length="5"
                                        v-model="feedbackRating" />
                                </div>

                                <v-btn
                                    append-icon="$send"
                                    block
                                    @click="sendFeedback"
                                    :disabled="!canSendFeedback"
                                    text="Send" />
                            </template>
                        </v-card>
                    </v-tabs-window-item>
                    <v-tabs-window-item>
                        <v-card class="d-flex align-center justify-center" min-height="330" max-width="330">
                            <v-icon
                                v-if="feedbackResult == null"
                                icon="$party"
                                size="x-large"
                                start />
                            <div v-if="feedbackResult == null" class="text-h5">Thankyou so much!</div>
                            <p v-else class="text-body-2 text-center">{{ feedbackResult }}</p>
                        </v-card>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card>
        </v-menu>
        <v-dialog v-model="showDialog" max-width="450">
            <v-card>
                <div class="d-flex align-center justify-space-between">
                    <v-tabs
                        v-model="tab">
                        <v-tab>
                            <v-icon start icon="$help-circle-outline" />Help
                        </v-tab>
                        <v-tab>
                            <v-icon start icon="$feedback" />Feedback
                        </v-tab>
                    </v-tabs>
                    <v-btn
                        class="mr-1"
                        @click="showDialog = false"
                        icon="$close"
                        size="small"
                        variant="text" />
                </div>
                <v-tabs-window v-model="tab">
                    <v-tabs-window-item>
                        <v-card
                            subtitle="Here are some relevant tips and clips."
                            title="Tips Assistant">
                            <div class="d-flex align-center mb-1">
                                <v-btn
                                    class="mx-1"
                                    @click="hideForNow"
                                    rounded
                                    :size="xs ? 'x-small' : 'small'"
                                    text="Maybe Later"
                                    variant="tonal" />

                                <v-btn
                                    class="mr-1"
                                    @click="neverShowAgain"
                                    rounded
                                    :size="xs ? 'x-small' : 'small'"
                                    text="Hide Forever"
                                    variant="tonal" />
                                
                                <v-btn
                                    v-if="menuRouteName != null"
                                    rounded
                                    :size="xs ? 'x-small' : 'small'"
                                    text="Show More"
                                    :to="{ name: menuRouteName }" />
                                
                            </div>
                            
                            <v-divider />

                            <v-list class="pa-2">
                                <v-list-subheader v-if="isLengthyArray(primaryLinks)">
                                    Relevant Links
                                </v-list-subheader>
                                <v-card v-for="(link, ind) in primaryLinks" :key="ind"
                                    :prepend-icon="link.icon"
                                    class="ma-1"
                                    :href="link.url"
                                    target="_blank"
                                    :text="link.description"
                                    :append-avatar="findYouTubeAvatar(link.url)"
                                    :title="link.title"
                                    :subtitle="link.subtitle" />
                                
                                <v-list-subheader v-if="isLengthyArray(secondaryLinks)">Other Helpful Links</v-list-subheader>

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
                    </v-tabs-window-item>
                    <v-tabs-window-item>
                         <v-card
                            subtitle="Share your thoughts with us"
                            title="Give Feedback">
                            <template #default>
                                <v-textarea
                                    autofocus
                                    hide-details
                                    lines="three"
                                    placeholder="...start typing any requests, suggestions, or frustrations you might have.  Unburden yourself."
                                    v-model="feedbackString" />
                                
                                <v-card-subtitle class="mt-2">Or just give us a rating</v-card-subtitle>
                                
                                <div class="text-center">
                                    <v-rating
                                        active-color="primary"
                                        hover
                                        :length="5"
                                        v-model="feedbackRating" />
                                </div>

                                <v-btn
                                    append-icon="$send"
                                    block
                                    @click="sendFeedback"
                                    :disabled="!canSendFeedback"
                                    text="Send" />
                            </template>
                        </v-card>
                    </v-tabs-window-item>
                    <v-tabs-window-item>
                        <v-card class="d-flex align-center justify-center" min-height="300">
                            <v-icon
                                v-if="feedbackResult == null"
                                icon="$party"
                                size="x-large"
                                start />
                            <div v-if="feedbackResult == null" class="text-h5">Thankyou so much!</div>
                            <div v-else class="text-body-2">{{ feedbackResult }}</div>
                        </v-card>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
    import { isLengthyArray, isNullOrEmpty } from '../composables/helpers.ts'
    import { findYouTubeAvatar, HelpLink, useAssistant } from '../composables/assistant.ts'
    import { firstBy } from 'thenby'
    import { computed, onMounted, ref, watch } from 'vue'
    import { useRoute } from 'vue-router'
    import { useDisplay } from 'vuetify'
    import { useFeedback } from '../composables/feedback.ts'
    
    const props = defineProps<{
        buttonIcon?: string
        buttonSize?: string
        tags?: string[]
    }>()

    const { 
        doShowDialog, 
        getPrimaryLinks, 
        getSecondaryLinks, 
        hideDialogPermanently, 
        hideDialogTemporarily,
        menuRouteName,
        tab
    } = useAssistant()

    const route = useRoute()

    const primaryLinks = ref<HelpLink[]>([])
    const secondaryLinks = ref<HelpLink[]>([])
    
    const showDialog = ref(false)

    const feedbackRating = ref<number | undefined>()
    const feedbackString = ref<string | undefined>()
    const feedbackResult = ref<string | undefined>()

    const { sendAsync } = useFeedback()
    
    const { xs } = useDisplay()
    
    const canSendFeedback = computed(() => {
        return !isNullOrEmpty(feedbackString.value) || feedbackRating.value != null
    })

    async function sendFeedback() {
        try {
            var res = await sendAsync({
                msg: feedbackString.value,
                rating: feedbackRating.value,
                route: route.fullPath
            })

            tab.value = 2

            setTimeout(() => {
                tab.value = 1
                hideForNow()
            }, 3000)

            if (res) {
                feedbackString.value = undefined
                feedbackRating.value = undefined
            }
            else {
                feedbackResult.value = 'Sorry!  Something seems to have gone wrong.  Perhaps try again later.'
            }
        }
        catch (err) {
            console.log(err)
        }
    }

    function hideForNow() {
        hideDialogTemporarily()
        showDialog.value = false
    }

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