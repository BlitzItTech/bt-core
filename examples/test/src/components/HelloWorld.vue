<template>
  <div>
    test
    <bt-image-uploader />
    <!-- <bt-image-uploader :canEdit="false" /> -->
  </div>

  <!-- <bt-blade-items
    bladeName="list"
    :bladeStartShowing="true"
    :headers="[
      { title: 'b', value: 'text', truncate: true },
      { title: 'a', value: 'id' }]"
    :items="items"
    :itemsPerPage="50"
    label="Test"
    truncate
    useLocalPagination /> -->
  <!-- <v-container class="pa-0" fluid>
    <v-toolbar color="primary" density="compact">
      <bt-cosmetics-menu />
    </v-toolbar>
    <v-container class="pa-0">
      <bt-blade
        bladeName="test"
        bladeStartShowing
        hideSubtoolbar
        label="Blade Title"
        variant="page">
        <template #content>
          <bt-slider
            :options="[
              { title: 'First', value: 'first', disabled: true },
              { title: 'Second' },
              { title: 'Thi-d', hideHeader: true },
              '1','2','3','4','5','6','7','8','9','12','13','14','15','16','17','18']">
              <template #first>
                First
              </template>
              <template #second>
                <bt-blade-items
                  bladeName="list"
                  :bladeStartShowing="true"
                  :headers="[
                    { title: 'b', value: 'text', truncate: true },
                    { title: 'a', value: 'id' }]"
                  :items="items"
                  label="Test"
                  truncate />
              </template>
              <template #thi-d>
                Third
              </template>
          </bt-slider>
        </template>
      </bt-blade>
    </v-container>
  </v-container> -->
  
  <!-- <v-container
    class="pa-0 d-flex flex-nowrap overflow-x-auto overflow-y-hidden no-gutters"
    fluid> -->
    
    <!-- <bt-blade-items
      addBladeName="single"
      bladeName="list"
      :bladeStartShowing="true"
      :canDelete="false"
      :canUnselect="false"
      itemBladeName="single"
      :items="items"
      itemValue="id"
      label="Test"
      selectSingle
      showListOnly
      transparent
      width="400"
      variant="blade"
      v-model:selected="selected.sub" />
      {{ selected }} -->

      
<!-- 
    <bt-field-select
      isEditing
      :items="items"
      itemText="text"
      itemValue="id"
      v-model="testSelect.id" /> -->
    
<!-- 
    <bt-blade-item
      bladeName="single"
      :canEdit="false"
      :eager="false"
      hideNavigation
      hideRefresh
      label="Test"
      :onGetNew="() => { return { id: '3', text: 'other' }}"
      :onSaveAsync="save"
      useBladeSrc
      variant="blade"
      width="250">
      <template #default="{ item }">
        
        <div>test</div>
        
        <bt-field-select
          isEditing
          :items="selectItems"
          itemText="one"
          itemValue="id"
          v-model="item.text" />

        <bt-col>
          <template #default>
            <div>test</div>
          </template>
        </bt-col>
      </template>
    </bt-blade-item>

    <bt-blade-item
      bladeName="singles"
      bladeStartShowing
      :eager="false"
      label="Test"
      :onGetNew="() => { return { id: '3', text: 'other' }}"
      useBladeSrc
      variant="blade" /> -->
  <!-- </v-container> -->
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useActions } from '../../../../core/src/composables/actions'

  const selectItems = ref([
    { id: '1', one: 'a', two: 'b' },
    { id: '2', one: 'c', two: 'd' }
  ])

  const { getAllItems } = useActions({
    
  })

  const se = ref('1')

  const items = computed(() => {
    const e: any[] = []
    for (let i = 0; i < 200; i++) {
      e.push({
        id: `${i}`,
        text: `${i}`
      })
    }

    return e
  })

  // const items = ref([
  //   { id: '1', text: 'test a very very very long statement' },
  //   { id: '2', text: 'blah test a very very very long statement test a very very very long statement test a very very very long statement test a very very very long statement' }])
  
  const selected = ref({ sub: undefined })
  const testSelect = ref({ id: '2' })

  function save(item: any) {
    console.log(item)
    return item
  }

  async function getItem() {
    const res = await getAllItems({
      params: { companyID: 'id' }
    })

    return res
  }
// const b = useBladeEvents({})

  // function s() {
  //   console.log('hello selected')
  // }

  // function test(item: any) {
  //   console.log('sele')
  //   console.log(item)
  // }
</script>
