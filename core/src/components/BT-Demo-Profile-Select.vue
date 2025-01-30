<template>
    <v-dialog v-model="doShow" max-width="400">
        <v-card
            title="Demo Profiles">
            <v-list class="pa-0">
                <template v-for="profile in profiles"
                    :key="profile.id">
                    <v-card 
                        class="ma-1"
                        @click="selectProfile(profile)"
                        :prepend-avatar="profile.profileAvatarURL"
                        :prepend-icon="profile.profileIcon"
                        :text="profile.description"
                        :title="profile.profileName" />
                </template>
            </v-list>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useRouter } from 'vue-router';
    import { DemoProfile, useDemo } from '../composables/demo.ts'
    import { computed, ref, watch } from 'vue';

    const props = defineProps<{
        to?: string
        toggleShow: boolean
    }>()

    const doShow = ref(false)
    const { getProfiles, startDemo } = useDemo()
    const profiles = computed(() => {
        return getProfiles != null ? getProfiles() ?? [] : []
    })
    const router = useRouter()

    function selectProfile(p: DemoProfile) {
        startDemo(p.id)

        if (props.to != null)
            router.push({ name: props.to })
    }

    watch(() => props.toggleShow, () => {
        doShow.value = !doShow.value
    })

</script>