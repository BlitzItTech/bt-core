import { TableColumn } from "./list.ts"
import { isLengthyArray, fromCamelCase, nestedValue, toCompareString, toCamelCase } from "../composables/helpers.ts"
import { useFileDialog } from "@vueuse/core"
import { computed, ComputedRef, ref } from "vue"

export interface CSVProps {
    canExportCSV?: boolean
}

export const csvDefaults = {
    canExportCSV: false
}

export interface UseCSVPropsReturn {
    exportToCSV: Function
    importFromCSV: Function
    loadingMsg: ComputedRef<string | undefined>
}

export interface CSVItem {
    header: string
    itemText?: string
    value: any
}

declare global {
    interface Navigator {
        msSaveOrOpenBlob: (blob: Blob, fileName: string) => boolean
    }
}

export interface ExportToCSVOptions {
    items: any[],
    headers?: TableColumn[],
    fileName?: string,
    format: 'array' | 'file'
}

export interface UseCSVOptions<T> {
    onImport?: (items: T[]) => void
}

export function useCSV<T>(options?: UseCSVOptions<T>): UseCSVPropsReturn {
    options ??= { }

    const loadingMessage = ref<string | undefined>()

    const { open, onChange } = useFileDialog({
        accept: '.csv',
        multiple: false
    });

    function exportToCSV(options: ExportToCSVOptions) {
        const {
            items,
            headers,
            fileName = 'data.csv',
            format = 'file'
        } = options
        console.log(items)
        if (!isLengthyArray(items)) {
            return;
        }

        let dnaArray: CSVItem[] = []

        if (headers != null) {
            dnaArray = headers?.filter(y => (y.csv ?? y.csvText ?? y.csvFilter ?? y.csvArray) != null)
                .map(z => {
                    return {
                        header: z.title ?? z.value ?? '',
                        itemText: z.itemText,
                        value: z.value
                    }
                })
        }

        if (!isLengthyArray(dnaArray))
            dnaArray = Object.keys(items[0]).map(x => { return { header: fromCamelCase(x) ?? '', value: x }; });
        
        dnaArray = dnaArray.filter(z => z.header.length > 0)

        var lineArray: any[] = [];

        for (let i = 0; i < items.length; i++) {
            const d = items[i];

            var newItem: any = {};
            var extraLines: any[] = [];

            for (let ii = 0; ii < dnaArray.length; ii++) {
                const dna = dnaArray[ii];
                var v = null;
                if (typeof(dna.value) == 'function') {
                    v = dna.value(d);
                }
                else if (typeof(dna.value) == 'string') {
                    v = nestedValue(d, dna.value);
                }

                if (dna.itemText != null) {
                    newItem[dna.header] = nestedValue(v, dna.itemText);
                }
                else {
                    newItem[dna.header] = v;
                }
            }

            lineArray.push(newItem);

            if (isLengthyArray(extraLines)) {
                extraLines.forEach(e => {
                    lineArray.push(e);
                })
            }

            extraLines = [];
        }

        var resArray = [];

        //print header row
        resArray.push(dnaArray.map(x => x.header).toString())

        lineArray.forEach(obj => {
            let propArray: any[] = [];
            dnaArray.forEach(function(k) {
                var v = obj[k.header];
                propArray.push(v != null ? v : '');
            });
            
            resArray.push(propArray.join(","));
        })


        if (format == 'array') {
            return resArray
        }
        else {
            //file
            var csvContent = resArray.join("\n")

            var file = new Blob([csvContent], { type: "text/plain;charset=utf-8" });
            
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(file, fileName);
            }
            else {
                var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function () {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 0);
                }
        }
    }

    interface ImportFromCSVOptions {
        headers?: Array<TableColumn | string>
    }

    interface csvInd {
        headerName: string
        propName: string
        csvInd?: number
    }

    function translateValue(v: string) {
        if (v == null)
            return v

        var e = v.replaceAll('\n', '').replaceAll('\r', '')

        var boolV = toCompareString(e)

        if (boolV == 'true')
            return true
        else if (boolV == 'false')
            return false

        return e
    }

    function refinePropName(p: string) {
        return toCamelCase(p.replaceAll(' ', '')
            .replaceAll('\n', '')
            .replaceAll('\r', ''))
    }

    function refineHeader(v: string) {
        return toCompareString(v.replaceAll(' ', '')
            .replaceAll('\n', '')
            .replaceAll('\r', '')) ?? ''
    }

    function importFromCSV(importOptions?: ImportFromCSVOptions) {
        onChange((files) => {
            if (files?.length == 1) {
                const file = files[0]
                loadingMessage.value = 'Importing from CSV file.'
                const reader = new FileReader()
                reader.onload = (e) => {
                    var newItems: T[] = []
                    const txt = e.target?.result as string
                    
                    if (txt != null) {
                        let items = txt.split('\n');
                        
                        if (isLengthyArray(items)) {
                            var props: csvInd[] = []
                            
                            if (isLengthyArray(importOptions?.headers)) {
                                props = importOptions!.headers!.map(x => {
                                    var r: csvInd
                                    if (typeof x == 'string') {
                                        r = {
                                            headerName: refineHeader(x),
                                            propName: refinePropName(x),
                                            csvInd: undefined
                                        }
                                    }
                                    else {
                                        r = {
                                            headerName: refineHeader(x.title ?? x.value ?? ''),
                                            propName: refinePropName((x.value ?? x.title ?? '')),
                                            csvInd: undefined
                                        }
                                    }
                                    return r
                                })
                            }
                            else {
                                const headerNames = items[0].split(',');
                                props = headerNames.map(x => {
                                    return {
                                        headerName: refineHeader(x),
                                        propName: refinePropName(x),
                                        csvInd: undefined
                                    }
                                })
                            }

                            const headers = items[0].split(',')

                            props.forEach(p => {
                                p.csvInd = headers.findIndex(x => x == p.headerName || x == p.propName || toCompareString(x) == toCompareString(p.headerName) || toCompareString(x) == toCompareString(p.propName))
                            })
                            
                            props = props.filter(p => p.csvInd != null && p.csvInd > -1)
                            
                            //remove the header line
                            // items.splice(0, 1)

                            if (items.length > 1) {
                                for (var i = 1; i < items.length; i++) {
                                    const newItem: any = {}
                                    var line = items[i].split(',')
                                    var isSomething = false

                                    //check for final null
                                    if (line.length == 1 && line[0].length == 0)
                                        break;

                                    if (line.length > 0) {
                                        props.forEach(prop => {
                                            if (line.length > (prop.csvInd! - 1)) {
                                                newItem[prop.propName] = translateValue(line[prop.csvInd!])
                                                isSomething = true
                                            }
                                        })
                                    }

                                    if (isSomething)
                                        newItems.push(newItem)
                                }
                            }
                        }
                    }
    
                    if (options?.onImport != null)
                        options.onImport(newItems)
                    
                    loadingMessage.value = undefined
                }
    
                reader.readAsText(file)
            }
        })

        open()
    }

    return {
        exportToCSV,
        importFromCSV,
        loadingMsg: computed(() => loadingMessage.value)
    }
}