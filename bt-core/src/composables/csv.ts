import { TableColumn } from "./list"
import { isLengthyArray, fromCamelCase, nestedValue } from "../index"

export interface CSVProps {
    canExportCSV?: boolean
}

export const csvDefaults = {
    canExportCSV: false
}

export interface UseCSVPropsReturn {
    exportToCSV: Function
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

export function useCSV(): UseCSVPropsReturn {

    function exportToCSV(
        items: any[],
        headers?: TableColumn[],
        fileName: string = 'csvData.csv') {

        if (!isLengthyArray(items)) {
            return;
        }

        let dnaArray: CSVItem[] = []

        if (headers != null) {
            dnaArray = headers?.filter(y => (y.csv ?? y.csvText ?? y.csvFilter ?? y.csvArray) != null)
                        .map(z => {
                            return {
                                header: z.title ?? '',
                                itemText: z.itemText,
                                value: z.value
                            }
                        })
        }
        else {
            dnaArray = Object.keys(items[0]).map(x => { return { header: fromCamelCase(x) ?? '', value: x }; });
        }

        dnaArray = dnaArray.filter(z => z.header.length > 0)

        var lineArray: any[] = [];

        // var increments = [];
        // if (dnaArray.some(y => y.breakdown === true)) {
        //     try {
        //         increments = await BlitzIt.store.getAll('stock-increments');
        //     }
        //     catch (err) {
        //         console.log('generating csv file could not pull increments for breakdown');
        //         console.log(this.extractErrorDescription(err));
        //     }
        // }

        // if (docTitle != null) {
        //     lineArray.push(docTitle);
        // }

        // dnaArray = dnaArray.filter(x => x.header != null);

        //print header row
        // lineArray.push(dnaArray.map(x => x.header))

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

                    // if (dna.navigation != null && v != null) {
                    //     //search from local storage
                    //     try {
                    //         var res = await BlitzIt.store.get(dna.navigation, v, null, false, null, null, true);
                    //         if (res != null) {
                    //             v = res;
                    //         }
                    //     }
                    //     catch (err) {
                    //         console.log(err);
                    //     }
                    // }
                }

                // if (v != null && dna.valueFilter != null) {
                //     console.log('aa');
                //     v = this.$options.filters[dna.valueFilter](v);
                //     console.log(v);
                // }

                // if (dna.csvArray) {
                //     if (this.isLengthyArray(v)) {
                //         v.forEach(w => {
                //             var otherNewItem = {};
                //             // otherNewItem[dna.header] = w.toString();
                //             // extraLines.push(otherNewItem);
                //             if (dna.breakdown && w.productID != null) {
                //                 otherNewItem[dna.header] = `${getBreakdown(w.quantity, measurements, increments, w.productID)}, ${w.product?.productName}`;
                //                 extraLines.push(otherNewItem);
                //             }
                //             else {
                //                 otherNewItem[dna.header] = w.toString();
                //                 extraLines.push(otherNewItem);
                //             }
                //         })
                //     }
                // }
                // else {
                    // if (dna.breakdown) {
                    //     var prodProp = dna.csvProductIDProp || 'productID';
                    //     newItem[dna.header] = getBreakdown(v, measurements, increments, d[prodProp]);
                    // }
                    if (dna.itemText != null) {
                        newItem[dna.header] = nestedValue(v, dna.itemText);
                    }
                    else {
                        newItem[dna.header] = v;
                    }
                // }
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

        // if (docTitle != null) {
        //     resArray.push(docTitle);
        // }

        //print header row
        resArray.push(dnaArray.map(x => x.header))

        lineArray.forEach(obj => {
            let propArray: any[] = [];
            dnaArray.forEach(function(k) {
                var v = obj[k.header];
                propArray.push(v != null ? v : '');
            });
            
            resArray.push(propArray.join(","));
        })

        var csvContent = resArray.join("\n");
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

    return {
        exportToCSV
    }
}