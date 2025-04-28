<template>
  <v-app>
    <!-- <v-app-bar>
      <v-spacer />
       <BT-Assistant-Menu :tags="['one']" />
    </v-app-bar> -->
    <router-view>

    </router-view>
    <!-- <v-main>
      <router-view>

      </router-view> -->
      <!-- <BT-Blade-Items
        :headers="[
          { title: 'one', value: 'one', level: 0 },
          { title: 'two', value: 'two', sublevel: 0 }
        ]"
        :items="items"
        variant="dialog">
        <template #one>
          first
        </template>
        <template #two="{ item }">
          <span>testing</span>
        </template>
      </BT-Blade-Items> -->
        <!-- <BT-Blade-Steps
          :items="[{ id: '1', test: 'a' }, { id: '2', test: 'one' }, { id: '3', test: 'two' }]"
          :getLabel="() => 'Product'"
          label="Products"
          showListOnly
          :steps="[{
            name: 'a'
          },
          {
            name: 'b'
          }]"
          v-model="panel">
          <template #itemTitle="{ item }">
            {{ item }}
          </template>
          <template #a="{ item }">
          </template>
          <template #b="{ item }">
            Second
          </template>
        </BT-Blade-Steps> -->
    <!-- </v-main> -->
  </v-app>
</template>

<script lang="ts" setup>
  import BTAssistantMenu from '../../../core/src/components/BT-Assistant-Menu.vue'
  import BTBladeSteps from '../../../core/src/components/BT-Blade-Steps.vue'
  import BTBladeItems from '../../../core/src/components/BT-Blade-Items.vue'
  // import BTDemoProfileSelect from '../../../core/src/components/BT-Demo-Profile-Select.vue'
  // import BTSlider from '../../../core/src/components/BT-Slider.vue'

  var ind = ref(0)

  var items = [
    {
      one: 'val one',
      two: 'val two'
    },
    {
      one: 'v one',
      two: 'v two'
    }
  ]

  function getNav() {
    if (ind.value == 5)
      return undefined

    return () => {
      ind.value++
    }
  }

  const showToggle = ref(false)
  const route = useRoute()
  const panel = ref(0)

</script>
