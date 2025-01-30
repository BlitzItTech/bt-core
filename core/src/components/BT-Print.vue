<!-- <template>
    <v-dialog
        v-bind="$attrs"
        v-model="show"
        @update:modelValue="changeDialog">
        <template #activator="{ props }">
            <v-btn
                v-if="!hideButton"
                v-bind="props"
                text="Print" />
        </template>
        <template #default>
            <v-card theme="light">
                <div :id="pageID" :style="pageStyle">
                    <div v-if="rawHtml != null" v-html="rawHtml" />
                    <slot name="default" :item="data">

                    </slot>
                </div>
                <template #actions>
                    <v-btn @click="show = false" text="Cancel" />
                    <v-btn @click="generatePDF" text="Generate" />
                </template>
            </v-card>
            <bt-loader :loadingMsg="loadingMsg" />
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import html2pdf from 'html2pdf.js'
    
    defineOptions({
        inheritAttrs: false
    })

    const props = defineProps<{
        getFileName?: (data: any) => string
        hideButton?: boolean
        item?: any
        itemID?: string
        onPullAsync?: (item?: any, id?: string) => Promise<any>
        onPullHtmlAsync?: (item?: any, id?: string) => Promise<string>
        pageID: string
        /**22px */
        pageWidth?: string
        showToggle?: boolean
        title?: string
    }>()

    const data = ref<any>()
    const loadingMsg = ref<string | undefined>()
    const pageStyle = computed(() => {
        return props.pageWidth != null ? { width: props.pageWidth } : undefined
    })
    const rawHtml = ref<string | undefined>()
    const show = ref(false)

    watch(() => props.showToggle, async () => {
        show.value = true
        if (props.item !== data.value)
            await pullHtml()
    })

    async function generatePDF() {
        let fileName = props.getFileName != null ? props.getFileName(data.value) : 'bt-printed-doc.pdf'

        if (props.pageID != null) {
            const el = document.getElementById(props.pageID)

            if (el != null) {
                html2pdf().set({
                    filename: fileName,
                    html2canvas: {
                        scale: 5,
                        useCORS: true
                    },
                    jsPDF: {
                        orientation: 'p',
                        unit: 'px',
                        format: 'a4',
                        hotfixes: ['px_scaling']
                    }
                })
                .from(el)
                .save(fileName)
            }
        }
        
        show.value = false
    }

    async function changeDialog(isOpen: boolean) {
        if (isOpen)
            await pullHtml()
    }

    async function pullHtml() {
        if (props.onPullHtmlAsync != null)
            rawHtml.value = await props.onPullHtmlAsync(props.item, props.itemID)

        if (props.onPullAsync != null)
            data.value = await props.onPullAsync(props.item, props.itemID)
        else
            data.value = props.item

        //show.value = true
    }

</script> -->