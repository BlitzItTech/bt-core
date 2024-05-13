<template>
  <v-app>
    <BT-Nav-Sidebar />
    <v-main>
      <div>default layout</div>
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
  import BTNavSidebar from '../../../../core/src/components/BT-Nav-Sidebar.vue'
</script>
