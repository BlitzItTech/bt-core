<template>
    <v-avatar v-bind="$attrs">
        <v-img :src="src">
            <template #error>
                <div class="d-flex align-center justify-center h-100 w-100">
                    <v-icon
                        :icon="defaultIcon"
                        :size="iconSize" />
                </div>
            </template>
            <template #placeholder>
                <div class="d-flex align-center justify-center h-100 w-100">
                    <v-icon
                        :icon="defaultIcon"
                        :size="iconSize" />
                </div>
            </template>
        </v-img>
    </v-avatar>
</template>

<script setup lang="ts">

    interface AvProps {
        defaultIcon?: string
        iconSize?: string
        src?: string
    }

    defineProps<AvProps>()

</script>