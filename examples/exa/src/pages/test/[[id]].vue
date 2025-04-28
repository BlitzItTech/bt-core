<template>
  <div>
    <!-- <bt-image-uploader
      additionalURL="/Upload?id={id}"
      class="mx-auto my-auto"
      :height="100"
      :imageHeight="800"
      :imageWidth="1200"
      label="Background"
      nav="customer-application-templates"
      src="http://127.0.0.1:10000/devstoreaccount1/credit-app-backgrounds/6997dc0b-0f49-4015-8288-324364cde4f2-credit-app" /> -->
      <!-- <v-btn text="Change" @click="changeForm" />
      <div>{{ tracker }}</div> -->
      <!-- <BTForm
        :data="formData"
        isEditing
        :schema="schema"
         /> -->

         <!-- backgroundUrl="https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-ordering-background"
        logoUrl="https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-logo-lg" -->
      <v-container>
        <v-row>
          <bt-col sm="12">
            <BTStatusItem
              isTrue
              title="Submitted" />

            <BTStatusItem
              isTrue
              subtitle="A"
              title="Submitted">
              <template #subtitle>
                By Andrew Deroon on <bt-span value="2023-01-01" filter="toShortDate" />
              </template>
            </BTStatusItem>

            <BTStatusItem
              :isTrue="false"
              subtitle="Andrew Deroon"
              title="Responded" />
            <BTFormBuilder
              :actualUsedHeight="80"
              :getBackgroundUrl="() => 'https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-ordering-background'"
              :getLogoUrl="() => 'https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-logo-lg'"
              :imgProps="{
                additionalUrl: '/Upload?id={id}',
                buttonWidth: 250,
                height: 100,
                imageHeight: 800,
                imageWidth: 1200,
                label: 'Background',
                nav: 'cust',
                src: '',
              }"
              isEditing
              :onGetSchema="getSchema"
              v-model="tracker.asyncItem.value.schema">
              <template #company>
                
              </template>
            </BTFormBuilder>
          </bt-col>
        </v-row>
      </v-container>
    <!-- <BTBladeItem 
      :actualUsedHeight="0"
      variant="pure">
      <template #body> -->
        <!-- backgroundUrl="https://blitzittechimages.blob.core.windows.net/blitzit/bg-cliffs.jpg" -->
         <!-- {{ style }} -->
        <!-- <BTForm
          v-if="schema != null"
          backgroundUrl="https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-ordering-background"
          isEditing
          logoUrl="https://blitzittechimages.blob.core.windows.net/company-logos/349f072e-3dd1-42e4-8318-8abdef8a0d5a-logo-lg"
          :data="formData"
          :onSaveAsync="saveForm"
          :onSubmitAsync="submitForm"
          :schema="schema"
          variant="half-and-half" /> -->
      <!-- </template>
    </BTBladeItem> -->
    

      <!-- <BTSelectListBox
        alwaysOpen
        :items="listItems"
        itemText="id"
        itemValue="id" /> -->

      <!-- <BTBladeItems
        :headers="[{ title: 'Name', value: 'id', searchable: true }]"
        :items="listItems"
        :itemsPerPage="15"
        paginate="local" /> -->
        
    <!-- <BT-Blade-Steps
          :getLabel="() => 'Product'"
          label="Products"
          :headers="[{ title: 'Name', value: 'name' }]"
          :items="items"
          :onGetNewAsync="newTemplate"
          :steps="steps"
          stepsID="test">
          <template #a="{ item, isChanged }">
            <BTFormBuilder
              isEditing
              v-model="item.schema" />
          </template>
          <template #b="{ item }">
            <v-form>
              <template #default="{ isValid }">
                <v-container>
                  {{ item }}
                  <v-row>
                    <BTFieldString
                      isEmail
                      label="Test"
                      required
                      v-model="item.stri" />

                    <BTFieldCheckbox
                      required
                      label="Test"
                      v-model="item.b" />

                      <BTFieldDate
                        required
                        label="Test"
                        v-model="item.d" />

                      <BTFieldSelect
                        canSelectNone
                        itemText="one"
                        itemValue="two"
                        :items="otherItems"
                        label="Test Select"
                        v-model="item.s" />
                  </v-row>
                </v-container>
              </template>
            </v-form>
          </template>
          <template #c>
            c
          </template>
        </BT-Blade-Steps> -->
  </div>
</template>

<route lang="yaml">
  meta:
      menuGroup: Account
</route>

<script lang="ts" setup>
  import { useForms, type AForm  } from '../../../../../core/src/composables/forms'
  import { useSteps, type StepOption } from '../../../../../core/src/composables/steps'
  import BTBladeSteps from '../../../../../core/src/components/BT-Blade-Steps.vue'
  import BTFormBuilder from '../../../../../core/src/components/BT-Form-Builder.vue'
  import BTForm from '../../../../../core/src/components/BT-Form.vue'
import BTBladeItem from '../../../../../core/src/components/BT-Blade-Item.vue'
import BTFieldString from '../../../../../core/src/components/BT-Field-String.vue'
import { useTracker } from '../../../../../core/src/composables/track'
import { twiddleThumbs } from '../../../../../core/src/composables/helpers'
import BTFieldCheckbox from '../../../../../core/src/components/BT-Field-Checkbox.vue'
import BTFieldDate from '../../../../../core/src/components/BT-Field-Date.vue'
import BTFieldSelect from '../../../../../core/src/components/BT-Field-Select.vue'
import BTStatusItem from '../../../../../core/src/components/BT-Status-Item.vue'
// import BTCron from '../../../../../core/src/components/BT-Cron.vue'
// import BTTags from '../../../../../core/src/components/BT-Tags.vue'



const form = {
  name: 'Test Form',
  schema: JSON.stringify({
    bgColor: '#76948AEE',
    btnColor: '#76948A',
    slides: [{
      fields: [
        {
          description: 'What is your name?',
          isRequired: true,
          label: 'Name',
          prop: 'name',
          type: 'short-text'
        }, 
        {
          description: 'What is your name?',
          label: 'Name',
          prop: 'name',
          type: 'long-text'
        }, 
        {
          description: 'Do you have a date?',
          prop: 'date',
          type: 'date'
        },
        {
          description: 'Do you agree?',
          prop: 'agreed',
          type: 'checkbox'
        },
        {
          description: 'Do you have a date?',
          prop: 'date',
          type: 'date'
        },
        {
          description: 'Do you agree?',
          prop: 'agreed',
          type: 'checkbox'
        }
      ],
      name: 'Slide One'
    },
    {
      fields: [{
        description: 'What is your age?',
        isRequired: true,
        label: 'Age',
        prop: 'age',
        type: 'number'
      }],
      name: 'Slide Two'
    }],
    title: 'My Form',
    variant: 'half-and-half',
    version: 1
  })
}

const items = ref([form])
  const otherItems = ref([
    {
      one: 'val one',
      two: 'val two'
    },
    {
      one: 'v one',
      two: 'v two'
    }
  ])

const tracker = useTracker(form)
async function newTemplate() {
        return {
            templateName: undefined,
            schema: JSON.stringify({
                color: '#FFFFFF',
                slides: [{
                    fields: [
                        {
                            description: 'hello, world',
                            prop: 'test',
                            type: 'short-text'
                        }
                    ],
                    name: 'first slide'
                }],
                version: 1
            })
        }
    }

const { loadSchema, schema } = useForms()
loadSchema(form.schema)
const formData = ref<any>({})

function getSchema(schema: AForm) {
  schema.slides ??= []
  schema.slides.unshift({
    canDelete: false,
    canEdit: false,
    name: 'company',
    fields: [{
      description: 'What is the name of your company or business?',
      isRequired: true,
      prop: 'companyName',
      type: 'short-text'
    },
    {
      description: 'What is your address?',
      isRequired: true,
      placeholder: 'Start typing your address',
      prop: 'address',
      type: 'short-text'
    }]
  })
  
  return schema
}

async function saveForm() {
  await twiddleThumbs(3000)
  return 'Save failed'
}

async function submitForm() {
  await twiddleThumbs(3000)
  return 'Submit failed'
}

// const s = useSteps<any>('test')

// const a = ref('')
// const n = ref<number | undefined>()
// const msg = ref('loading')

// var l = []
// for (let id = 1; id < 1100; id++) {
//   l.push({ id: id.toString() })    
// }

// const listItems = ref<any>(l)


// const t = ref<any>({
//   adjustments: undefined,
//   cronExpression: undefined
// })
  const steps: StepOption<any>[] = [
    {
      name: 'a',
      onMoveInto: (opt) => {
        console.log('moving into a')
        return 2
      },
      onMoveNext: (opt) => {
        console.log('moving next from a')
        return 'c'
      }
    },
    {
      name: 'b',
      onMoveInto: (opt) => {
        console.log('moving into b')
        return opt.thisStep
      },
      onMoveNext: (opt) => {
        console.log('moving next from b')
        return opt.next
      }
    },
    {
      name: 'c'
    }
  ]

//   const pV = ref(0)

// async function getItems(res: StoreGetAllReturn<any>) {
//   return {
//     data: res.data.map(x => {
//     return {
//       productID: x.productID,
//       one: x.one,
//       two: x.two
//     }
//   })}
// }
</script>
