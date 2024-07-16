import { createApp } from 'vue'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

import App from './App.vue'

createApp(App).use(vuetify).mount('#app')