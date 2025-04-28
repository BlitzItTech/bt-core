<template>
    <v-list-item>
        <template #prepend>
            <v-icon v-if="isTrue === true" icon="$check" color="success" />
            <v-icon v-else-if="isTrue === false" icon="$close" color="error" />
        </template>
        <template #title>
            <slot name="title">
                <bt-span v-if="titleFilter != null" :value="title" :filter="titleFilter" />
                <span v-else>{{ title }}</span>
            </slot>
        </template>
        <template #subtitle>
            <slot name="subtitle">
                <bt-span v-if="subtitleFilter != null" :value="subtitle" :filter="subtitleFilter" />
                <span v-else>{{ subtitle }}</span>
            </slot>
        </template>
    </v-list-item>
</template>

<script setup lang="ts">

    withDefaults(defineProps<{
        isTrue?: boolean
        subtitle?: any
        subtitleFilter?: string
        title?: any
        titleFilter?: string
    }>(), {
        isTrue: undefined
    })
</script>