import { 
  computed, 
  ref, 
  watch, 
  type Ref, 
  type PropType,
  type SetupContext, 
  type WatchSource } from 'vue'
  
import { splitArray } from './helpers.ts'

export interface SetOptions<T> {
    items: T[]
}

export function useSet<T>(options: SetOptions<T>) {
    const { items } = options

    const values = new Set<T>()
    const updated = ref(0)

    function forceUpdate() {
        updated.value = updated.value + 1
    }

    function add(item: T) {
        if (items.indexOf(item) == -1) {
            return
        }

        values.add(item)
        forceUpdate()
    }

    function has(item: T) {
        return values.has(item)
    }

    function remove(item: T) {
        if (values.delete(item)) {
            forceUpdate()
        }
    }

    function clear() {
        values.clear()
        forceUpdate()
    }

    function toggle(item: T) {
        if (has(item))
            remove(item)
        else
            add(item)
    }

    function equals(items: T[]) {
        if (items.length != values.size) {
            return false
        }

        for (const item of items) {
            if (!values.has(item)) {
                return false
            }
        }

        return true
    }

    return {
        values,
        add,
        toggle,
        remove,
        clear,
        updated,
        equals
    }
}

export interface SelectOptions<T, V> extends SetOptions<T> {
    multiple?: boolean
    itemText?: string | ((item: T) => string)
    itemValue?: string | ((item: T) => V)
    cols?: number
}
  
export function selectProps<T, V>() {
    return {
      modelValue: {
        type: [String, Number, Array] as PropType<V | V[]>,
      },
      selection: {
        type: String,
      },
      clearable: {
        type: Boolean,
        default: false,
      },
      items: {
        type: Array as PropType<Array<T>>,
        default: () => [],
      },
      multiple: {
        type: Boolean,
        default: false,
      },
      cols: {
        type: Number,
        default: 1,
      },
      itemText: {
        type: [String, Function] as PropType<string | ((item: T) => string)>,
        default: 'text',
      },
      itemValue: {
        type: [String, Function] as PropType<string | ((item: T) => V)>,
        default: 'value',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    }
}
  
export function useSelect<T, V>(options: SelectOptions<T, V>) {
    const { items, cols = 1, multiple = false, itemText = 'text', itemValue = 'value' } = options
    const s = useSet<T>(options)
    const selected: Ref<V[] | V> = multiple ? ref<Array<any>>([]) : ref<any>(null)
    const selectedStr = ref('')
  
    const select = (item: T) => {
      if (multiple) {
        s.toggle(item)
      } else {
        s.clear()
        s.add(item)
      }
    }
  
    const has = (item: T | null): boolean => {
      if (item === null) {
        return false
      }
      const value = getValue(item)
      if (Array.isArray(selected.value)) {
        return selected.value.includes(value)
      } else {
        return selected.value === value
      }
    }
  
    const getValue = (item: any): V => {
      if (typeof itemValue == 'function') {
        return itemValue(item)
      } else if (itemValue != null) {
        return item[itemValue]
      } else {
        return item
      }
    }
  
    const getText = (item: any): string => {
      if (typeof itemText == 'function') {
        return itemText(item)
      } else if (itemText != null) {
        return item[itemText]
      }
      else {
        return item
      }
    }
  
    const itemMap = new Map(items.map((i) => [getValue(i), i]))
  
    const setItems = (items: T[]) => {
      if (s.equals(items)) {
        return
      }
      s.clear()
      items.forEach((i) => select(i))
    }
  
    const setValues = (values: V[] | V) => {
      values = Array.isArray(values) ? values : [values]
      const items = values.map((v) => itemMap.get(v)).filter((item): item is T => !!item)
      setItems(items)
    }
  
    watch(s.updated, () => {
      const items = Array.from(s.values)
      selected.value = multiple ? items.map(getValue) : getValue(items[0])
      selectedStr.value = items.map(getText).join(',')
    })
  
    const isEmpty = computed(() => {
      return multiple
        ? !Array.isArray(selected.value) || selected.value.length == 0
        : !!selected.value
    })
  
    return {
      ...s,
      select,
      selected,
      selectedStr,
      itemRows: splitArray(items, cols),
      setItems,
      setValues,
      isEmpty,
      has,
    }
}

/**
 * @interface
 */
export type UseSelectReturn<T, V> = ReturnType<typeof useSelect<T, V>>

export function setupSelect<T, V>(
  options: SelectOptions<T, V>,
  modelValue: WatchSource<V>,
  { emit }: SetupContext<['update:model-value', 'change']>,
): UseSelectReturn<T, V> {
  const s = useSelect(options)

  let isInitiated = false

  watch(s.selected, () => {
    emit('update:model-value', s.selected.value)
    if (isInitiated)
      emit('change', s.selected.value)
    else
      isInitiated = true
  })

  watch(
    modelValue,
    (value) => {
      if (value) {
        // console.log('setting values')
        // console.log(value)
        s.setValues(value)
      }
    },
    { immediate: true },
  )

  return s
}
