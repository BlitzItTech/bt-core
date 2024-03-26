import { type RouteLocationNormalized } from 'vue-router'
import { useDemo } from '@/composables/demo'
import { type Environment } from '@/composables/urls'

/**routes with meta object */
export function useDocumentMeta() {
    const { isDemoing } = useDemo()

    function updateMeta(to: RouteLocationNormalized) {
        const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);
    
        if(nearestWithTitle) {
            document.title = nearestWithTitle.meta.title as string
        }
        else {
            const env = import.meta.env.MODE as Environment
            let title = ''

            if (env == 'development')
                title = 'BWeb Dev'
            else if (env == 'staging')
                title = 'BlitzIt Sandpit'
            else {
                title = 'BlitzIt Web | Cloud-Based Wholesale Logistics Platform'
            }

            if (isDemoing.value)
                title = `Training: ${title}`

            document.title = title
        }
    }

    return {
        updateMeta
    }
}