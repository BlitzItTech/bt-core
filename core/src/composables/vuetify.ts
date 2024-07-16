// import '@mdi/font/css/materialdesignicons.css'
// import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { useLocalCosmetics } from '../composables/cosmetics.ts'

const theme = useLocalCosmetics({
  defaultTheme: 'dark',
  dark: {
    primary: '#617f44',
    secondary: '#424242',
  },
  light: {
    primary: '#617f44',
    secondary: '#424242',
  }
})

const vuetify = createVuetify({
  theme: theme
})

export { vuetify }