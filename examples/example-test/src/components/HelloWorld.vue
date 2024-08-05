<template>
  <bt-blade-item
    :item="r">
    <template #default="{ item }">
      <bt-field-select
        isEditing
        :items="arr"
        v-model="item.gender" />

        {{ r }}
      
        <v-btn @click="testSelect">Test</v-btn>
    </template>
  </bt-blade-item>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useSelectItem } from '../../../../core/src/composables/dialogs'

  const e = ref({ test: '1', cron: '0 0 * * 0 0-0' })
  const r = ref<any>({})
  const arr = ref<string[]>([])
  const selectTag = useSelectItem()

  async function testSelect() {
    const res = await selectTag({
      items: [{ text: 'a', value: 'b' }],
      textFunction: (a: any) => a
      // itemValue: 'value',
      // nav: 'users'
    })

    console.log(res)
  }

  onMounted(() => {
    arr.value.push('test')
  })
</script>
