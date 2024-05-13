<template>
  <div>index</div>
  <v-btn @click="og">Login</v-btn>
</template>

<script lang="ts" setup>
  import { useAuth, useAuthUrl } from '../../../../core/dist/bt-core-app'

  const { login } = useAuth()

  function og() {
    const e = useAuthUrl()
    console.log(e)
    login()
  }
</script>

<route lang="yaml">
  meta:
    layout: default
</route>