<template>
  <v-app>
    <v-app-bar>
      <!-- <v-btn @click="importFromCSV" text="Import" />
      {{ loadingMsg }} -->
       <BT-Assistant-Menu :tags="['one']" />
    </v-app-bar>
    <!-- <v-navigation-drawer v-model="show">
      
    </v-navigation-drawer> -->
    <v-main>
      <v-container>
        {{ route }}
        <v-btn @click="showToggle = !showToggle" text="Select Profile" />
        <BT-Demo-Profile-Select
          :toggleShow="showToggle" />
        <!-- <v-btn text="test" @click="a" /> -->
        <!-- <BT-Blade-Item>
              <template #default>d</template>
              <template #body="{ style }">
                {{ style }}
              </template>
            </BT-Blade-Item> -->
        <!-- <BT-Slider
          :options="[
            { title: 'One', value: 'one' },
            { title: 'Two', value: 'two' },
            { title: 'Three', value: 'three' },
            { title: 'Four', value: 'four', navHistory: true },
            { title: 'Five', value: 'five', hide: true, navHistory: true },
          ]"
          v-model="panel">
          <template #one-toolbar-right>
            <v-btn text="Try" />
          </template>
          <template #two-toolbar="{ back, title }">
            <v-btn @click="back" text="Left" />
            {{ title }}
          </template>
          <template #three>
            <BT-Blade-Item>
              <template #default>d</template>
              <template #body="{ style }">
                <v-card :style="style">
                  test
                </v-card>
              </template>
            </BT-Blade-Item>
          </template>
        </BT-Slider> -->
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import BTAssistantMenu from '../../../core/src/components/BT-Assistant-Menu.vue'
  import BTDemoProfileSelect from '../../../core/src/components/BT-Demo-Profile-Select.vue'
  
  const showToggle = ref(false)
  const route = useRoute()
</script>
