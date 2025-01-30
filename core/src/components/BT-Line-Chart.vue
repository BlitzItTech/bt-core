<!-- <template>
    <LineChart
        :data="mData"
        :options="chartOptions" />
</template>

<script setup lang="ts">

import { Line as LineChart } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js'
import { computed } from 'vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

const props = withDefaults(defineProps<{
    chartOptions?: any
    itemSets: { data: any[] }[]
    labels?: any[]
}>(), {
    chartOptions: {
        responsive: true
    }
})

const mData = computed(() => { 
    return {
        datasets: props.itemSets,
        labels: props.labels
    }
})

</script> -->