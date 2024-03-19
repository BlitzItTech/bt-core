import { type MaybeRefOrGetter, type Ref, ref, toRef, toValue, watch } from "vue";
import { copyDeep } from '@/composables/helpers';

export interface UseTrackerOptions {
    propsToIgnore?: string[]
    propsToTrack?: string[],
    useTracker?: boolean
}

export function useTracker(data: MaybeRefOrGetter<any>, options?: UseTrackerOptions) { //propsToIgnore, propsToTrack) {
    const isChanged = ref(false);
    const asyncItem: Ref<any> = toRef(data);
    let originalJSON = createJSON(toValue(data));

    if (options?.useTracker !== false) {
        watch(asyncItem, (v) => {
            isChanged.value = createJSON(v) != originalJSON;
        }, { deep: true })
    }

    function createJSON(dataItem: any) {
        const copy = copyDeep(dataItem);

        if (options != null) {
            if (options.propsToIgnore != null) {
                //delete from copy
                options.propsToIgnore.forEach(k => {
                    delete copy[k];
                })
            }
            else if (options.propsToTrack != null) {
                //only keep these
                const dataProps = Object.keys(dataItem)
                dataProps.forEach(k => {
                    if (!options!.propsToTrack!.some(x => x == k)) {
                        delete copy[k]
                    }
                })
            }
        }

        return JSON.stringify(copy);
    }

    function restart() {
        originalJSON = createJSON(toValue(asyncItem));
        isChanged.value = false;
    }

    return {
        asyncItem,
        isChanged,
        restartTracker: restart
    }
}