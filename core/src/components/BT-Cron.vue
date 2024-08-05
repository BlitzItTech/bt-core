<template>
    <v-row class="align-center ml-2" no-gutters>
        <v-slide-y-transition hide-on-leave group>
            <v-col v-if="label != null" cols="12" key="1">
                <v-list-subheader>{{ label }}</v-list-subheader>
            </v-col>
            <v-col v-if="firstPrefix != null" class="mr-1" key="1.5" cols="auto">
                {{ firstPrefix }}
            </v-col>
            <v-col class="mr-1 flex-grow-0" key="2">
                <bt-select-inline
                    :items="regularityOptions"
                    v-model="cron.regularity.value" />
            </v-col>
            <v-col v-if="cron.regularity.value == 'Custom'" class="mr-1" key="3">
                <bt-field-string
                    isEditing
                    @update:focused="rawChange"
                    v-model="cron.rawExpression.value" />
            </v-col>
            <v-col v-if="cron.regularity.value != 'Custom'" class="mr-1 flex-grow-0" key="4">at</v-col>
            <v-col v-if="cron.regularity.value != 'Custom'" class="mr-1 flex-grow-0" key="5">
                <bt-select-inline
                    @change="reconfigure"
                    :items="hourOptions"
                    v-model="cron.hour.value" />
            </v-col>
            <v-col v-if="cron.regularity.value == 'Monthly' || cron.regularity.value == 'Weekly'" class="mr-1 flex-grow-0" key="6">
                on
            </v-col>
            <v-col v-if="cron.regularity.value == 'Monthly'" class="mr-1 flex-grow-0" key="7">
                <bt-select-inline
                    @change="reconfigure"
                    :items="weekOptions"
                    multiple
                    v-model="cron.weeks.value" />
            </v-col>
            <v-col v-if="cron.regularity.value == 'Monthly' || cron.regularity.value == 'Weekly'" class="mr-1 flex-grow-0" key="8">
                <bt-select-inline
                    @change="reconfigure"
                    :items="weekdayOptions"
                    multiple
                    v-model="cron.weekdays.value" />
            </v-col>
            <v-col v-if="useLeadTimeLeft" cols="12" key="9" class="ma-0 pa-0">
                <v-row class="align-center" no-gutters>
                    <v-slide-y-transition hide-on-leave group>
                        <v-col v-if="secondPrefix != null" class="mr-1" key="1" cols="auto">
                            {{ secondPrefix }}
                        </v-col>
                        <v-col class="mx-3 my-0 pa-0 text-center" cols="auto" key="2">
                            <bt-number
                                @change="reconfigure"
                                hide-details
                                textCenter
                                variant="underlined"
                                width="70"
                                v-model.number="cron.leadTimeLeft.value" />
                        </v-col>
                        <v-col class="mr-1" cols="auto" key="3">
                            {{ useLeadTimeInHours ? 'hour' : 'minute' }}{{ cron.leadTimeLeft.value == 1 ? 'later' : 's later' }}
                        </v-col>
                    </v-slide-y-transition>
                </v-row>
            </v-col>
            <v-col v-if="useAdjustments" cols="12">
                <v-dialog v-model="adjDialog" persistent max-width="450">
                    <template #activator="{ props }">
                        <v-btn
                            append-icon="$pencil"
                            @click="cronAdj.unpack(cronAdj.adjustmentsString.value, cron.cronExpression.value)"
                            class="text-caption mt-3"
                            v-bind="props"
                            size="small"
                            :text="adjustmentsLabelText" />
                    </template>
                    <template #default="{ isActive }">
                        <v-card>
                            <v-card-title>
                                <div class="d-flex align-center">
                                    <span>{{ adjustmentsLabelText }}</span>
                                    <v-spacer />
                                    <span v-if="!hideCron" class="text-caption text-grey">{{ cron.cronExpression.value }}</span>
                                </div>
                            </v-card-title>
                            <v-list max-height="400">
                                <v-slide-y-transition hide-on-leave group>
                                    <template v-for="(adj) in cronAdj.adjustments.value" :key="adj.dateTrigger">
                                        <v-list-item lines="two">
                                            <template #title>
                                                <!-- <div class="text-caption text-grey">{{ firstPrefix }}</div> -->
                                                <bt-span 
                                                    filter="toLongDateAndTime"
                                                    :value="adj.dateTrigger"  />
                                            </template>
                                            <template #subtitle v-if="adj.isAdjusting">
                                                <v-slide-y-transition hide-on-leave group>
                                                    <div v-if="adj.replacingDate != null" key="1">
                                                        <bt-span
                                                            filter="toLongDateAndTime"
                                                            :prefix="replacementLabel"
                                                            :value="adj.replacingDate"  />
                                                    </div>
                                                    <div v-else class="text-error" key="2">(Cancelled)</div>
                                                    <div v-if="adj.replacingDate != null && (adj.leadTimeLeft > 0 || adj.leadLeftDate != null)" key="3">
                                                        <bt-span
                                                            filter="toLongDateAndTime"
                                                            :prefix="adjustmentLeftLabel"
                                                            :value="adj.leadLeftDate" />
                                                    </div>
                                                    <div v-if="adj.replacingDate != null && (adj.leadTimeRight > 0 || adj.leadRightDate != null)" key="4">
                                                        <bt-span
                                                            filter="toLongDateAndTime"
                                                            :prefix="adjustmentRightLabel"
                                                            :value="adj.leadRightDate" />
                                                    </div>
                                                </v-slide-y-transition>
                                            </template>
                                            <template #append>
                                                <div class="d-flex flex-column">
                                                    <v-slide-y-transition hide-on-leave group>
                                                        <v-btn v-if="adj.isAdjusting"
                                                            @click="cronAdj.undoAdjustment(adj)"
                                                            key="1"
                                                            prepend-icon="$undo"
                                                            size="x-small"
                                                            text="Undo"
                                                            title="Remove Adjustment" />

                                                        <v-btn v-if="!adj.isAdjusting"
                                                            @click="cronAdj.cancelAdjustment(adj)"
                                                            class="text-error my-1"
                                                            key="2"
                                                            prepend-icon="$cancel"
                                                            size="x-small"
                                                            text="Cancel" />

                                                        <v-btn v-if="!adj.isAdjusting"
                                                            @click="openAdjustmentFor(adj)"
                                                            class="text-warning my-1"
                                                            key="3"
                                                            prepend-icon="$calendar-edit"
                                                            size="x-small"
                                                            text="Adjust"
                                                            v-bind="props" />
                                                    </v-slide-y-transition>
                                                </div>
                                            </template>
                                        </v-list-item>
                                        <v-divider />
                                    </template>
                                </v-slide-y-transition>
                            </v-list>
                            <v-card-actions>
                                <v-btn
                                    @click="isActive.value = false"
                                    text="Cancel" />
                                <v-spacer />
                                <v-btn
                                    @click="applyAdjustments"
                                    prepend-icon="$content-save"
                                    text="Save" />
                            </v-card-actions>
                        </v-card>
                    </template>
                </v-dialog>
                <v-dialog v-model="editAdjDialog" persistent max-width="325">
                    <template #default="{ isActive }">
                        <v-card v-if="editAdjData != null" class="text-center">
                            <v-card-title>Adjusted Date</v-card-title>
                            <v-container>
                                <v-row dense>
                                    <v-col cols="12">
                                        <v-list-subheader>{{ replacementLabel }}</v-list-subheader>
                                        <bt-date
                                            useTime
                                            v-model="editAdjData.replacingDate" />
                                        <v-divider class="mt-4" />
                                    </v-col>
                                    <v-col v-if="useLeadTimeLeft" cols="12">
                                        <v-list-subheader>{{ adjustmentLeftLabel }}</v-list-subheader>
                                        <bt-date
                                            useTime
                                            v-model="editAdjData.leadLeftDate" />
                                    </v-col>
                                    <v-col v-if="useLeadTimeRight" cols="12">
                                        <v-list-subheader>{{ adjustmentRightLabel }}</v-list-subheader>
                                        <bt-date
                                            useTime
                                            v-model="editAdjData.leadRightDate" />
                                    </v-col>
                                </v-row>
                            </v-container>
                            <v-card-text>
                            </v-card-text>
                            <v-card-actions>
                                <v-btn
                                    @click="isActive.value = false"
                                    text="Cancel" />
                                <v-spacer />
                                <v-btn
                                    @click="applyAdjustmentChange"
                                    text="Done" />
                            </v-card-actions>
                        </v-card>
                    </template>
                </v-dialog>
            </v-col>
        </v-slide-y-transition>
    </v-row>
</template>

<script setup lang="ts">
    import { useCron, hourOptions, weekOptions, weekdayOptions, regularityOptions } from '../composables/cron.ts'
    import { type Adjustment, useCronAdjustments } from '../composables/cron-adjustments.ts'
    import { computed, onMounted, ref } from 'vue'

    interface CronProps {
        adjustments?: string
        adjustmentLeftLabel?: string
        adjustmentRightLabel?: string
        chipProps?: any
        defaultExpression?: string
        firstPrefix?: string
        secondPrefix?: string
        hideCron?: boolean
        label?: string
        modelValue?: any
        replacementLabel?: string
        /**defaults to minutes */
        useAdjustments?: boolean
        useLeadTimeInHours?: boolean
        useLeadTimeLeft?: boolean
        useLeadTimeRight?: boolean
    }

    const props = defineProps<CronProps>()
    const emit = defineEmits(['update:modelValue', 'update:adjustments'])
    const adjDialog = ref(false)
    const adjustmentsLabelText = computed(() => {
        return `${cronAdj.filteredAdjustments.value.length} Adjustment${ cronAdj.filteredAdjustments.value.length == 1 ? '' : 's' }`
    })

    const editAdjData = ref<Adjustment | undefined>(undefined)
    const editAdjDialog = ref(false)

    const cron = useCron({
        ...props,
        value: props.modelValue
    })

    const cronAdj = useCronAdjustments({
        adjustmentString: props.adjustments,
        cronExpression: cron.cronExpression.value
    })

    function applyAdjustments() {
        adjDialog.value = false
        emit('update:adjustments', cronAdj.stringify())
    }

    function applyAdjustmentChange() {
        if (editAdjData.value)
            cronAdj.applyAdjustment(editAdjData.value)

        editAdjDialog.value = false
    }

    function openAdjustmentFor(adj: Adjustment) {
        editAdjData.value = {
            dateTrigger: adj.dateTrigger,
            replacingDate: adj.replacingDate,
            leadTimeLeft: 0,
            leadTimeRight: 0,
            leadLeftDate: adj.leadLeftDate,
            leadRightDate: adj.leadRightDate
        }

        editAdjDialog.value = true
    }

    function rawChange(focused: boolean) {
        if (!focused) {
            cron.applyRawExpression()
            reconfigure()
        }
    }

    function reconfigure() {
        emit('update:modelValue', cron.pack())
    }

    onMounted(() => {
        cron.unpack(props.modelValue)
    })

</script>