import { ShallowRef } from "vue"
import { useActions } from "./actions.ts"
import { appendUrl } from "./helpers.ts"
import { useDataUrl } from "./urls.ts"

export interface CreateFeedbackOptions {
    /**Whether to keep this instance as current or to handle separately */
    createSeparately?: boolean
    /**OVERRIDES DEFAULT final url which is [UseDataURL] + [feedbackURL] */
    feedbackFinalURL?: string
    /**OVERRIDES DEFAULT which is '/api/v1/Feedback/post' */
    feedbackURL?: string
}

export interface FeedbackDTO {
    msg?: string
    rating?: number
    route?: string
}

export interface BTFeedback {
    loadingMsg: ShallowRef<string | undefined>
    sendAsync: (obj: FeedbackDTO) => Promise<boolean>
}

let current: BTFeedback

export function useFeedback(): BTFeedback {
    return current
}

export function createFeedback(options?: CreateFeedbackOptions) {
    const { actionLoadingMsg, apiPost } = useActions()
    
    var url: string = ''

    if (options?.feedbackFinalURL != null)
        url = options?.feedbackFinalURL
    else if (options?.feedbackURL != null)
        url = appendUrl(useDataUrl(), options?.feedbackURL)
    else
        url = appendUrl(useDataUrl(), '/Feedback/post')

    // console.log(`Feedback url created: ${url}`)

    async function sendAsync(obj: FeedbackDTO) {
        try {
            await apiPost({
                data: obj,
                finalUrl: url,
                throwError: true
            })

            return true
        }
        catch (err) {
            console.log('feedback post error')
            console.log(err)
            return false
        }
    }

    const feedback = {
        loadingMsg: actionLoadingMsg,
        sendAsync
    }

    if (options?.createSeparately !== true)
        current = feedback

    return feedback
}