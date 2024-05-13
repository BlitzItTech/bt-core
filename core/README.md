## Vue 3 + TypeScript + Vite + Vuetify

## Custom Themes
Enables saving local cosmetic settings that are loaded in to Vuetify

## Data URL Navigation
Enables managing navigation and permissions through defining permissions, urls, and microservices base urls.

## Auto Routes
Uses unplugin-auto-router to define routes.  Specific details can be overriden with navigation items.

## Component Presets
Can set default settings that are applied to components with a single property.

## Components
Some custom components that are built off Vuetify and have default grid/column settings, but haven't worked out how to export them with Vuetify components and styles.

## Auth modes

Permissions take the format [permission].[access].  For instance:

```
customers.view
customers.edit
```

If the navigation item requires a permission of 'customers', then it will allow viewing and also editing.

## Environment URL Testing
Can set different data urls for each stage - whether development or staging or production