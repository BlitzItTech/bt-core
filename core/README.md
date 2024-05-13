## Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite.  It includes a number of helpful components and composables. 
The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

<!-- 
## Environment modes - production, staging, development

Control what mode you are in by adding environment files to your project root folder with these variables:

```
VITE_BASE_AUTH_URL=[https://auth...]
VITE_[BASE_DATA_URL]=[https://data...]
VITE_WEB_APP_URL=[https://webapp...]
VITE_[MICROSERVICE]=[https://microservice...]
VITE_[LOCAL_DB_NAME]=[btweb]
```
The VITE_[MICROSERVICE] variable can include any number of variables like this:

```
VITE_auth=[https://data_auth...]
VITE_ordering=[https://data_ordering...]
VITE_courier-invoicing=[https://data_courier-invoicing...]
``` -->

## Auth modes

Auth credentials are stored locally using @vueuse/core's useStorage composable.  You can change the storage key by setting an environment variable:

```
VITE_AUTH_STORAGE_TOKEN=[string]
```

Permissions take the format [permission].[access].  For instance:

```
customers.view
customers.edit
```

If the navigation item requires a permission of 'customers', then it will allow viewing and also editing.