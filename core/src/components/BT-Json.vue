<template>
    <v-card max-height="350" class="overflow-y-auto">
        <v-card-text>
            <div v-for="(j, ind) in display" :key="ind">
                <pre v-html="syntaxHighlight(j)"></pre>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    
    const props = defineProps(['value'])

    const display = computed(() => {
        if (props.value == null) {
            return []
        }

        if (Array.isArray(props.value))
            return props.value

        return [props.value]
    })

    function syntaxHighlight(json: any) {
        if (typeof json != 'string') {
            json = JSON.stringify(json, undefined, 2); //Object.keys(json).sort(), 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const e = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match: any) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });

        return e
    }

</script>

<style>
    pre {
        outline: 1px solid #ccc; 
        padding: 5px; 
        margin: 5px; }

    pre .string { 
        color: green; 
    }
    pre .number { color: darkorange; }
    pre .boolean { color: rgb(191, 255, 0); }
    pre .null { color: magenta; }
    pre .key { color: rgb(141, 141, 141); }
</style>