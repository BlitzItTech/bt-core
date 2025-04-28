import { computed, ref } from "vue"
import { distinct, moveInArray } from "./helpers.ts"

export type AFormVariant = 'basic' | 'half-and-half' | 'single-page'

export interface AForm {
    bgColor?: string
    bgSrc?: string
    btnColor?: string
    logoSrc?: string
    slides: AFormSlide[]
    title?: string
    useBgSrc?: boolean
    useLogoSrc?: boolean
    variant?: AFormVariant
    version?: number
}

export interface AFormSlide {
    fields: AFormField[]
    canDelete?: boolean
    canEdit?: boolean
    name: string
}

export interface AFormField {
    description?: string
    isRequired?: boolean
    isSubmitButton?: boolean
    label?: string
    options?: string[]
    placeholder?: string
    prop?: string
    type: FieldType
    url?: string
}

export type FieldType = 'info' | 'short-text' | 'long-text' | 'number' | 'checkbox' | 'button' | 'date' | 'email' | 'phone' | 'file' | 'select'

export interface AFormFieldMeta {
    description?: string
    icon?: string
    label?: string
    type: FieldType
}

export interface UseFormsOptions {
    defaultColor?: string
    onGetSchema?: (schema: AForm) => AForm
}

export function useForms(options?: UseFormsOptions) {
    const currentSlide = ref<AFormSlide | undefined>()
    const currentField = ref<AFormField | undefined>()
    const t = computed<FieldType | undefined>(() => currentField.value?.type)

    const schema = ref<AForm | undefined>()

    function addFieldToSlide(field: AFormFieldMeta, slide: AFormSlide) {
        let newField = {
            label: field.type == 'button' ? 'Button' : undefined,
            placeholder: isPlaceholderField(field.type) ? '(Answer)' : undefined,
            prop: isPropField(field.type) ? getPropNameFor(field.type) : undefined,
            type: field.type
        }

        slide.fields.push(newField)
        selectField(slide, newField)
    }

    function addSlide() {
        if (schema.value != null) {
            var slide = {
                fields: [],
                name: `Slide ${schema.value.slides.length + 1}`
            }

            schema.value.slides.push(slide)

            selectSlide(slide)
        }
    }

    function canRequireField(type: FieldType) {
        return type == 'checkbox' || type == 'email' || type == 'long-text' || type == 'number' || type == 'phone' || type == 'select' || type == 'short-text'
    }
    
    function clearCurrent() {
        currentSlide.value = undefined
        currentField.value = undefined
    }

    function getPropNameFor(type: FieldType) {
        var similarFields = schema.value?.slides.flatMap(x => x.fields).filter(f => f.type == type).length
        if (similarFields == null || similarFields == 0)
            return `${type.replaceAll('-', '_')}_field`

        return `${type.replaceAll('-', '_')}_field_${similarFields}`
    }

    function isPlaceholderField(type: FieldType) {
        return type == 'short-text' || type == 'long-text' || type == 'email' || type == 'number'
    }

    function isPropField(type: FieldType) {
        return type != 'info' && type != 'button' && type != 'file'
    }

    function loadSchema(schemaStr?: string) {
        let mSchema;
        if (schemaStr != null)
            mSchema = JSON.parse(schemaStr)
        else
            mSchema = {
                bgColor: options?.defaultColor,
                btnColor: options?.defaultColor,
                slides: [],
                version: 1
            }

        schema.value = options?.onGetSchema != null ? options.onGetSchema(mSchema) : mSchema
    }

    function moveSlideDown(slideIndex: number) {
        if (schema.value?.slides != null)
            moveInArray(schema.value?.slides, slideIndex, slideIndex + 1)
    }

    function moveSlideUp(slideIndex: number) {
        if (schema.value?.slides != null)
            moveInArray(schema.value?.slides, slideIndex, slideIndex - 1)
    }

    function removeCurrent() {
        if (currentField.value != null) {
            var slide = schema.value?.slides.find(s => s.fields.some(f => f === currentField.value))
            var ind = slide?.fields.findIndex(f => f === currentField.value) ?? -1
            if (ind >= 0)
                slide?.fields.splice(ind, 1)

            currentField.value = undefined
        }
        else if (currentSlide.value != null) {
            if (schema.value != null)
                removeSlide(currentSlide.value.name)
        }
    }
    
    function removeSlide(slideName?: string) {
        if (slideName != null && schema.value != null) {
            var slideInd = schema.value.slides.findIndex(x => x.name == slideName) ?? -1
            if (slideInd >= 0)
                schema.value?.slides.splice(slideInd, 1)

            if (slideInd >= 0 && schema.value.slides.length > 0) {
                if (slideInd >= schema.value.slides.length)
                    slideInd = schema.value.slides.length - 1

                currentSlide.value = schema.value.slides[slideInd]
                currentField.value = undefined
            }
        }
    }

    function selectField(slide: AFormSlide, field: AFormField) {
        currentSlide.value = slide
        currentField.value = field
    }

    function selectSlide(slide: AFormSlide) {
        currentSlide.value = slide
        currentField.value = undefined
    }

    function hasInvalidProps(schema: AForm): string | undefined {
        var props = schema.slides.flatMap(x => x.fields).filter(f => isPropField(f.type)).map(z => z.prop)

        if (props.some(p => p == null || p.length == 0))
            return 'One of your field properties are missing'

        var distinctProps = distinct(props)
        if (distinctProps.length != props.length)
            return 'You identical field properties. Every field property needs to be unique.'

        return undefined
    }

    return {
        addFieldToSlide,
        addSlide,
        clearCurrent,
        currentField,
        currentSlide,
        fieldPropRules: [
            (prop: any) => !!prop || 'Property name is required',
            (prop: any) => /^[A-Za-z0-9\-\_]+$/.test(prop) || 'Must contain only letters, numbers, underscores, and dashes',
            (prop: any) => schema.value?.slides.flatMap(s => s.fields).filter(f => isPropField(f.type) && f.prop == prop).length == 1 || 'This property name is already being used'
        ],
        getPropNameFor,
        hasInvalidProps,
        isInputType: computed(() => t.value == 'short-text' || t.value == 'long-text' || t.value == 'number' || t.value == 'checkbox' || t.value == 'date' || t.value == 'email' || t.value == 'phone' || t.value == 'select'),
        isLabelType: computed(() => t.value != 'info' && t.value != 'date'),
        isPlaceholderType: computed(() => t.value != null && isPlaceholderField(t.value)),
        isPropType: computed(() => t.value != null && isPropField(t.value)),
        isRequiredType: computed(() => t.value != null && canRequireField(t.value)),
        isPropField,
        loadSchema,
        moveSlideDown,
        moveSlideUp,
        removeCurrent,
        removeSlide,
        schema,
        schemaString: computed(() => JSON.stringify(schema.value)),
        selectField,
        selectSlide
    }
}

export const Fields: AFormFieldMeta[] = [
    {
        description: 'For your customer to read',
        icon: '$information',
        label: 'Information',
        type: 'info'
    },
    {
        description: 'A short text-based answer',
        icon: '$text-box',
        label: 'Text Input',
        type: 'short-text'
    },
    {
        description: 'A long paragraph answer',
        icon: '$text-box',
        label: 'Paragraph Input',
        type: 'long-text'
    },
    {
        description: 'Requiring an email address',
        icon: '$email',
        label: 'Email Input',
        type: 'email'
    },
    {
        description: 'A phone number answer',
        icon: '$phone',
        label: 'Phone Number',
        type: 'phone'
    },
    {
        description: 'A number answer',
        icon: '$numeric',
        label: 'Number Input',
        type: 'number'
    },
    {
        description: 'For true or false answers',
        icon: '$checkbox-marked',
        label: 'Checkbox',
        type: 'checkbox'
    },
    {
        description: 'Request a date',
        icon: '$calendar-edit',
        label: 'Date Input',
        type: 'date'
    },
    // {
    //     description: 'Select from a list of options',
    //     icon: '$list-box',
    //     label: 'Select List',
    //     type: 'select'
    // },
    // {
    //     description: 'A file upload',
    //     icon: '$file-outline',
    //     label: 'File Input',
    //     type: 'file'
    // },
    {
        description: 'A button that does things.',
        icon: '$button-cursor',
        label: 'Button',
        type: 'button'
    }
]