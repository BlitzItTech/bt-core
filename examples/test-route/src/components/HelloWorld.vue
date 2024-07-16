<template>
  <v-container class="pa-0" fluid>
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
              { title: 'First', value: 'first' },
              { title: 'Second' },
              { title: 'Thi-d', hideHeader: true },
              '1','2','3','4','5','6','7','8','9','12','13','14','15','16','17','18']">
              <template #first>
                <bt-blade-item
                  bladeName="sing"
                  :bladeStartShowing="true"
                  :canDelete="false"
                  :canUnselect="false"
                  label="Test"
                  transparent
                  width="400"
                  :useBladeSrc="true" />
              </template>
              <template #second>
                <bt-blade-items
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
                  v-model:selected="selected.sub" />
              </template>
              <template #thi-d>
                Third
              </template>
          </bt-slider>
        </template>
      </bt-blade>
    </v-container>
  </v-container>
  
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
  import { ref } from 'vue'
  import { useActions } from '../../../../core/src/composables/actions'
  import { useRoute } from 'vue-router'
  // import { useBladeEvents } from '../../../../core/src/composables/blade';

  const selectItems = ref([
    { id: '1', one: 'a', two: 'b' },
    { id: '2', one: 'c', two: 'd' }
  ])

  const { getAllItems } = useActions({
    
  })

  const se = ref('1')

  const items = ref([
    { id: '1', text: 'test' },
    { id: '2', text: 'blah' }])
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

  const route = useRoute()
// const b = useBladeEvents({})

  // function s() {
  //   console.log('hello selected')
  // }

  // function test(item: any) {
  //   console.log('sele')
  //   console.log(item)
  // }
</script>
