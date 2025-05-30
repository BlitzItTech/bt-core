/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
// import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
// import { createVuetify } from '../../../../core/src/composables/vuetify'
import { useIcons } from '../../../../core/src/composables/icons'
import { useLocalCosmetics } from '../../../../core/src/composables/cosmetics'
import { createVuetify } from 'vuetify'

import {
  mdiCardPlusOutline,
  mdiPrinter,
  mdiRobot,
  mdiViewList
} from '@mdi/js'

const theme = useLocalCosmetics({
  defaultTheme: 'dark',
  dark: {
    primary: '#1d5474',
    secondary: '#192233',
    accent: '#7fcbf7',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'bgd-primary': '#192233'
  },
  light: {
    primary: '#192233',
    secondary: '#192233',
    accent: '#2a76a2',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'bgd-primary': '#192233'
  }
})

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  //@ts-ignore
  icons: useIcons({
    'card-plus-outline': mdiCardPlusOutline,
    printer: mdiPrinter,
    robot: mdiRobot,
    'view-list': mdiViewList
  }),
  theme: theme
})
