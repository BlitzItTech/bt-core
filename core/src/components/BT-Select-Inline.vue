<template>
    <v-chip v-bind="chipProps" :disabled="disabled">
      <template #append>
        <v-icon v-if="clearable && !isEmpty" size="small" icon="mdi-close" @click.stop="clear()"> </v-icon>
        <v-icon size="small" icon="$chevron-down" />
      </template>
  
      {{ selection ?? selectedStr }}
  
      <v-menu activator="parent" v-bind="menuProps" :close-on-content-click="!multiple">
        <v-list class="pa-0 ma-0">
          <v-slide-y-transition hide-on-leave group>
              <v-row v-for="(itemRow, rInd) in itemRows" :key="rInd" no-gutters>
                <v-slide-y-transition hide-on-leave group>
                  <v-col v-for="(item, mInd) in itemRow" :key="mInd">
                    <v-list-item v-if="item" class="vcron-v-item" @click="select(item)" :active="has(item)">
                      {{ item.text }}
                    </v-list-item>
                  </v-col>
                </v-slide-y-transition>
              </v-row>
          </v-slide-y-transition>
        </v-list>
      </v-menu>
    </v-chip>
  </template>
  
  <script lang="ts">
  import { selectProps, setupSelect } from '../composables/select.ts'
  
  export default {
    inheritAttrs: false,
    name: 'CustomSelect',
    props: {
      ...selectProps<any, any>(),
      menuProps: {
        type: Object,
        default: () => { return { maxHeight: '300px' } },
      },
      chipProps: {
        type: Object,
        default: () => {},
      },
    },
    emits: ['update:model-value', 'change'],
    setup(props, ctx) {
      return setupSelect(props, () => props.modelValue, ctx)
    },
  }
  </script>
  
  <style>
  .vcron-v-item div {
    overflow: visible;
  }
  </style>