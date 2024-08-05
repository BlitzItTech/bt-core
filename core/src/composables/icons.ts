import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { 
  mdiAccount, 
  mdiArchiveOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiCalendarEdit,
  mdiCancel,
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiCog, 
  mdiContentSave, 
  mdiCubeOutline, 
  mdiDelete,
  mdiEraser,
  mdiEraserVariant,
  mdiFileDelimited,
  mdiFilter,
  mdiLogout,
  mdiMagnify,
  mdiMenuDown,
  mdiMoveResizeVariant,
  mdiPencil, 
  mdiPencilOff, 
  mdiRefresh,
  mdiThemeLightDark,
  mdiUndo,
  mdiViewColumn,
  mdiWindowMaximize } from '@mdi/js'
import type { IconAliases, IconOptions } from 'vuetify'

export function useIcons(icons?: Partial<IconAliases>): IconOptions {
    return {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            account: mdiAccount,
            'archive-outline': mdiArchiveOutline,
            'arrow-left': mdiArrowLeft,
            'arrow-right': mdiArrowRight,
            'calendar-edit': mdiCalendarEdit,
            cancel: mdiCancel,
            check: mdiCheck,
            'chevron-up': mdiChevronUp,
            'chevron-down': mdiChevronDown,
            close: mdiClose,
            cog: mdiCog,
            'content-save': mdiContentSave,
            'cube-outline': mdiCubeOutline,
            delete: mdiDelete,
            eraser: mdiEraser,
            'eraser-variant': mdiEraserVariant,
            'file-delimited': mdiFileDelimited,
            filter: mdiFilter,
            logout: mdiLogout,
            magnify: mdiMagnify,
            'menu-down': mdiMenuDown,
            'move-resize-variant': mdiMoveResizeVariant,
            pencil: mdiPencil,
            'pencil-off': mdiPencilOff,
            refresh: mdiRefresh,
            'theme-light-dark': mdiThemeLightDark,
            undo: mdiUndo,
            'view-column': mdiViewColumn,
            'window-maximize': mdiWindowMaximize,
            ...(icons ?? {})
        },
        sets: {
            mdi
        }
    }
}