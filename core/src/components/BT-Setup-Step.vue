<template>
    <div>Setup</div>
    <!-- <v-slide-x-transition hide-on-leave>
        <v-card v-if="isCurrent" flat class="overflow-y-auto" min-height="70vh" width="100%" tile>
            <v-card flat class="my-0 pa-0 mx-auto" :max-width="(fluid || fluidTop || fluidContent || fluidBottom || isMobile) ? '100%' : '700px'" min-height="70vh">
                <slot name="title">
                    <v-card-title v-if="title != null || cShowRestart || cShowSkip" 
                        class="mx-auto" >
                        <v-icon v-if="icon != null" large left>{{ icon }}</v-icon>
                        {{ title }}
                        <BT-Btn
                            v-if="canNavigate && stage != null"
                            @click="previousStage"
                            :disabled="stage == null || stage == 0"
                            icon="mdi-chevron-left"
                            inline
                            title="Previous Stage" />

                        <BT-Btn
                            v-if="canNavigate && stage != null"
                            @click="nextStage"
                            disabled
                            icon="mdi-chevron-right"
                            inline
                            title="Next Stage" />

                        <v-slide-x-transition>
                            <BT-Btn
                                v-if="cShowRestart"
                                @click="restartStage"
                                :disabled="disabled"
                                inline
                                leftIcon="mdi-restart"
                                right
                                small
                                text
                                title="Restart Step Again" />
                        </v-slide-x-transition>
                        
                        <v-spacer />
                        
                        <BT-Btn v-if="cShowSkip" :disabled="disabled" inline text label="Skip" leftIcon="mdi-debug-step-over" @click="next" />
                        <BT-Btn v-if="showNext" :disabled="disabled" inline buttonClass="primary" label="Next" @click="$emit('next', next)" />
                    </v-card-title>
                </slot>
                <div class="ma-4">
                    <slot name="body" v-bind:next="next">
                        {{ text }}
                    </slot>
                </div>
                <v-card-actions v-if="cShowYesNo || customizeTo != null" class="mx-auto">
                    <slot name="actions" v-bind:setup="step">
                        <BT-Btn
                            v-if="cShowYesNo"
                            buttonClass="primary mx-1"
                            inline
                            :label="noText"
                            @click="$emit('no', next)" />

                        <BT-Btn
                            v-if="cShowYesNo"
                            buttonClass="primary mx-1"
                            inline
                            :label="yesText"
                            @click="$emit('yes', next)" />

                        <BT-Btn
                            v-if="customizeTo != null"
                            class="primary--text"
                            inline
                            label="Customize"
                            text
                            :to="customizeTo"
                            verySmall />
                    </slot>
                </v-card-actions>
            </v-card>
            
            <v-overlay :value="loadingMsg != null" absolute class="text-center">
                <v-progress-circular indeterminate size="64" />
                <p>{{ loadingMsg || 'Loading' }}</p>
            </v-overlay>
        </v-card>
    </v-slide-x-transition> -->
</template>

<script setup lang="ts">

    // const props = withDefaults(defineProps<{
    //     canNavigate?: boolean
    //     customizeTo?: any
    //     disabled?: boolean
    //     fluid?: boolean
    //     fluidBottom?: boolean
    //     fluidContent?: boolean
    //     fluidTop?: boolean
    //     hideRestart?: boolean
    //     hideSkip?: boolean
    //     hideYesNo?: boolean
    //     icon?: string
    //     loadingMsg?: string
    //     noText?: string
    // }>(), {
    //     canNavigate: true,
    //     noText: 'No'
    // })

</script>