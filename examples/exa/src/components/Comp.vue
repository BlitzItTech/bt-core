<template>
    <div>
        {{ steps }}
        <!-- <div style="height: 100px; width: 100px; position: relative;">
            <bt-loader :loadingMsg="msg" />
        </div> -->
    </div>
</template>

<script setup lang="ts">
    import { useSteps } from '../../../../core/src/composables/steps';
    const steps = useSteps('test')
</script>