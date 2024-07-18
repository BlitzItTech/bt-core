import { firstBy } from 'thenby'

export function sum(array: number[]): number {
    return array.reduce((sum, v) => sum += v, 0)
}

export function orderBy(arr: any[], prop: string | ((item: any) => boolean | number | string) | undefined, asc: true | false = true) {
    return arr.sort(function (a, b) {
        if (!prop) {
            if (a > b) {
                return asc === true ? 1 : -1;
            }
            else if (a < b) {
                return asc === true ? -1 : 1;
            }
            else {
                return 0;
            }
        }
        else if (typeof(prop) === 'string') {            
            if (nestedValue(a, prop) > nestedValue(b, prop)) {
                return asc === true ? 1 : -1;
            }
            else if (nestedValue(a, prop) < nestedValue(b, prop)) {
                return asc === true ? -1 : 1;
            }
            else {
                return 0;
            }
        }
        else {
            if (prop(a) > prop(b)) {
                return asc === true ? 1 : -1;
            }
            else if (prop(a) < prop(b)) {
                return asc === true ? -1 : 1;
            }
            else {
                return 0;
            }
        }
    })
}

export function appendUrl(originalVal?: string, additionalVal?: string) {
    let original = originalVal ?? ''
    let additional = additionalVal ?? ''

    if (original.endsWith('/')) {
        do {
            original = original.slice(0, original.length - 1)
        } while (original.endsWith('/'));
    }

    if (additional.startsWith('/')) {
        do {
            additional = additional.slice(1, additional.length)
        } while (additional.startsWith('/'));
    }

    return `${original}/${additional}`
}

export function checkImage(
    url: string,
    onGood: (this: GlobalEventHandlers, ev: Event) => void,
    onBad: OnErrorEventHandler) {
        let img = new Image()
        img.onload = onGood
        img.onerror = onBad
        img.src = url
}

export function distinct(list: any) {
    if (list == null || !Array.isArray(list)) {
        return list
    }

    return [...new Set(list.map(item => item))]
}

export function group<T>(list: T[], keyGetter: string | ((item: T) => string | number)) {
    const map = new Map()
    
    list.forEach((item: any) => {
        let key: any
        if (typeof keyGetter == 'string')
            key = item[keyGetter]
        else
            key = keyGetter(item)

        const collection = map.get(key)
        if (!collection)
            map.set(key, [item])
        else
            collection.push(item)
    })

    return map
}

export function extensionExists(elementId: string = 'blitzItExtensionExists') {
    try {
        var el = document.getElementById(elementId);
        return el != null;
    }
    catch (ex) {
        console.log(extractErrorDescription(ex));
        return false;
    }
}

//#region area and space

export interface GeoCoordinate {
    lat?: number
    lng?: number
}

// /**
//  * confirms if area is a certain size
//  * @param boundary array of 4 x { lat: number, lng: number }
//  * @param size 
//  * @returns 
//  */
// export function isAreaOfSize(boundary?: GeoCoordinate[], size?: number) {
//     if (boundary == null || size == null || boundary.length != 4) {
//         return false;
//     }

//     var middleLat = boundary[0].lat + size;
//     var middleLng = boundary[0].lng - size;

//     if ((boundary[1].lat + size) != middleLat) {
//         return false;
//     }
//     if ((boundary[1].lng + size) != middleLng) {
//         return false;
//     }

//     if ((boundary[2].lat - size) != middleLat) {
//         return false;
//     }
//     if ((boundary[2].lng + size) != middleLng) {
//         return false;
//     }

//     if ((boundary[3].lat - size) != middleLat) {
//         return false;
//     }
//     if ((boundary[3].lng - size) != middleLng) {
//         return false;
//     }

//     return true;
// }

/**
 * get area around a certain location with a space of the given size
 * @param location 
 * @param radius
 * @returns 
 */
export function getAreaAround(location: GeoCoordinate, radius: number) {
    if (location.lat == null || location.lng == null)
        return undefined

    return [
        { lat: location.lat - radius, lng: location.lng + radius },
        { lat: location.lat - radius, lng: location.lng - radius },
        { lat: location.lat + radius, lng: location.lng - radius },
        { lat: location.lat + radius, lng: location.lng + radius }
    ];
}

/**get square area using the location as the far right line */
export function getAreaToLeft(location: GeoCoordinate, radius: number) {
    if (location.lat == null || location.lng == null)
        return undefined

    return [
        { lat: location.lat - (radius * 2), lng: location.lng + radius },
        { lat: location.lat - (radius * 2), lng: location.lng - radius },
        { lat: location.lat, lng: location.lng - radius },
        { lat: location.lat, lng: location.lng + radius }
    ];
}

/**get square area using the location as the far left line */
export function getAreaToRight(location: GeoCoordinate, radius: number) {
    if (location.lat == null || location.lng == null)
        return undefined

    return [
        { lat: location.lat, lng: location.lng + radius },
        { lat: location.lat, lng: location.lng - radius },
        { lat: location.lat + (radius * 2), lng: location.lng - radius },
        { lat: location.lat + (radius * 2), lng: location.lng + radius }
    ];
}

//#endregion

//#region locations

/**
 * 
 * @param value converts location to a single string and standardizes state and road names, etc.
 * @returns 
 */
export function getGoogleMapsLocationLine(value: any) {
    var str = getLocationLine(value, true);

    str = str.toLowerCase(); //str.replaceAll(' ', '').toLowerCase();
    //replace values
    str = str.replace(' victoria ', 'vic');
    str = str.replace(' queensland ', 'qld');
    str = str.replace(' new south wales ', 'nsw');
    str = str.replace(' northern territory ', 'nt');
    str = str.replace(' western australia ', 'wa');
    str = str.replace(' tasmania ', 'tas');
    str = str.replace(' south australia ', 'sa');
    str = str.replace(' australian captial territory ', 'act');

    str = str.replace(' & ', ' and ');
    str = str.replace(' road', ' rd');
    str = str.replace(' street', ' st');
    str = str.replace(' lane', ' ln');
    str = str.replace(' alley', ' aly');
    str = str.replace(' arcade', ' arc');
    str = str.replace(' boulevard', ' blvd');
    str = str.replace(' court', ' ct');
    str = str.replace(' cove', ' cv');
    str = str.replace(' highway', ' hwy');

    return str.replaceAll(' ', '');
}

export function getLocationLine(value: any, forGoogle: boolean = false) {
    if (value == null) {
        return '';
    }

    if (typeof value !== 'object') {
        return value;
    }    
    
    var rStr = '';

    if (value.addressLineOne != null && !forGoogle) {
        rStr = value.addressLineOne + ' ';
    }
    if (value.streetNumber != null) {
        rStr = rStr + value.streetNumber + ' ';
    }
    if (value.streetName != null) {
        rStr = rStr + value.streetName + ', ';
    }
    if (value.suburb != null) {
        rStr = rStr + value.suburb + ' ';
    }
    if (value.state != null) {
        rStr = rStr + value.state + ' ';
    }
    if (value.postcode != null) {
        rStr = rStr + value.postcode;
    }
    
    return rStr;
}



//#endregion

//#region images

export async function getImageData(url?: string, throwErrorOnFail: boolean = true) {
    return new Promise((resolve, reject) => {
        if (url == null)
            reject('no url given')
        
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = function () {
            var canvas = document.createElement('canvas');
             //@ts-ignore
            canvas.width = this.width;
             //@ts-ignore
            canvas.height = this.height;

            var ctx = canvas.getContext('2d');
            
            //@ts-ignore
            ctx?.drawImage(this, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = function () {
            console.log('errr');
            if (throwErrorOnFail) {
                reject('image could not be loaded for some reason');
            }
            else {
                resolve(null);
            }
        };

        if (url != null)
            img.src = url;
    })
}

//#endregion

//#region string and character

/**
 * 
 * @param val Converts string from camel case to every word being capitalized and spaces between
 * @returns 
 */
export function fromCamelCase(val?: string) {
    if (!val)
        return val
    
    return val
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => {
            return str.toUpperCase();
        })
}

/**
 * Converts props to camel casing
 * @param value 
 * @returns 
 */
export function toCamelCase(value: any) { //for JSON parse
    if (value != null && typeof value === 'object'){
      for (var k in value) {
        if (/^[A-Z]/.test(k) && Object.hasOwnProperty.call(value, k)) {
          value[k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
          delete value[k];
        }
      }
    }
    return value;
  }


export function capitalizeWords(val?: string) {
    if (val == null)
        return val
    
    return val.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
}

//#endregion

//#region weekday

export const weekdayPairs = [
    { value: 1, short: 'sun', values: ['sun', 'sunday'] },
    { value: 2, short: 'mon', values: ['mon', 'monday'] },
    { value: 3, short: 'tue', values: ['tue', 'tues', 'tuesday'] },
    { value: 4, short: 'wed', values: ['wed', 'wednesday'] },
    { value: 5, short: 'thu', values: ['thu', 'thur', 'thurs', 'thursday'] },
    { value: 6, short: 'fri', values: ['fri', 'friday'] },
    { value: 7, short: 'sat', values: ['sat', 'saturday'] },
    { value: 0, short: 'always', values: ['always', null, undefined] }
]

/**returns the sort value of the weekday csv string
 * returns minimum if csv list
 */
export function weekdayValue(wkDay?: string) {
    if (wkDay == null) {
        return 0
    }

    const wkDaySplit = wkDay.replaceAll(' ', '').split(',').map(z => z.toLowerCase())
    const valList = weekdayPairs.filter(x => x.values.some(v => wkDaySplit.some(s => v == s))).map(z => z.value)
    if (valList.length == 0)
        return 8

    return Math.min(...valList)
}

/**returns the sort value of the weekday csv string
 * returns minimum if csv list
 */
export function weekdayShortName(wkDay?: string) {
    if (wkDay == null) {
        return wkDay
    }

    return wkDay.toLowerCase().replaceAll(' ', '').split(',').map(day => {
        let pair = weekdayPairs.find(x => x.values.some(v => v == day))
        return pair != null ? pair.short : ''
    }).filter(z => z != null && z.length > 0).toString()

    // const valList = weekdayPairs.filter(x => x.values.some(v => wkDaySplit.some(s => v == s))).map(z => z.short)
    // if (valList.length == 0)
    //     return 8

    // return Math.min(...valList)
}

/**whether the csv string contains the weekday
 * returns true if either prop is undefined
 */
export function containsWeekday(weekdays?: string, wkDay?: string) {
    if (weekdays == null || wkDay == null) {
        return true;
    }

    const wkDaySplit = weekdays.replaceAll(' ', '').split(',').map(z => z.toLowerCase())
    const weekday = wkDay.replaceAll(' ', '').toLowerCase()
    const pair = weekdayPairs.find(pair => pair.values.some(v => v == weekday))
    return pair != null && wkDaySplit.some(s => s == pair.short || pair.values.some(v => v == s))
}

/**adds and sorts the weekday string */
export function addWeekday(weekdays?: string, day?: string) {
    if (day == null) {
        return weekdays;
    }

    let wDays = weekdays ?? ''
    wDays = `${wDays},${day}`

    let res = [...new Set(wDays.replaceAll(' ', '').toLowerCase().split(',').map(z => {
        return weekdayPairs.find(x => x.values.some(v => v == z))
    })
    .filter(z => z != null)
    .sort(firstBy(z => z?.value ?? 0))
    .map(z => z?.short))].toString()

    return res.length > 0 ? res : undefined
}

export function removeWeekday(weekdays?: string, day?: string) {
    if (day == null || weekdays == null) {
        return weekdays;
    }

    let wDays = weekdays ?? ''
    let wDay = day.replaceAll(' ', '').toLowerCase()
    
    let res = [...new Set(wDays.replaceAll(' ', '').toLowerCase().split(',').map(z => {
        return weekdayPairs.find(x => x.values.some(v => v == z && v != wDay))
    })
    .filter(z => z != null)
    .sort(firstBy(z => z?.value ?? 0))
    .map(z => z?.short))].toString()

    return res.length > 0 ? res : undefined
}

//#endregion

//region arrays

export function isArrayOfLength(val: any, l: number) {
    return val != null && Array.isArray(val) && val.length == l;
}

export function isLengthyArray(val: any, greaterThan: number = 0) {
    return val != null && Array.isArray(val) && val.length > greaterThan
}

export function isNullOrEmpty(val: string | undefined): boolean {
    return val == null || val.length == 0
}

//#endregion

//#region dates

export function isMinDate(d?: string) {
    return '0001-01-01T00:00:00Z' == d;
}

export function getMinDate() {
    return new Date('0001-01-01T00:00:00Z').getTime();
}

export function getMinDateString() {
    return '0001-01-01T00:00:00Z'
}

/**
 * rounds the given value to a certain number of decimal places
 * @param v
 * @param dPlaces 
 * @returns 
 */
export function roundTo(val: number, dPlaces: number) {
    let m = '1';
    let i = 0;

    if (i < dPlaces) {
        do {
            m = m + '0';
            i += 1;
        } while (i < dPlaces);
    }

    let d = Number.parseInt(m);
    
    return Math.round(val * d) / d;
}

//#endregion

//#region csv

export function toggleCSV(value?: string, tag?: string) {
    let rVal = value ?? ''
    if (tag != null) {
        if (csvContains(rVal, tag)) {
            //remove
            rVal = rVal.split(',').filter(x => x != tag).toString();
        }
        else {
            //add
            if (rVal != null) {
                rVal = `${rVal},${tag}`;
            }
            else {
                rVal = tag;
            }
        }
    }
    
    return rVal != null && rVal.length > 0 ? rVal : null
}

export function csvContains(value?: string, tag?: string) {
    if (value == null || value.length == 0) {
        return false;
    }

    if (!tag) {
        return true;
    }

    var csvList = value.split(',');
    var tagList = tag.split(',');

    return csvList.some(x => tagList.some(y => y == x));
}

//#end region

/**copies object and all descendant properties */
export function copyDeep(aObject: any) {
    if (!aObject) {
        return aObject;
    }
    let v;
    let bObject: any = Array.isArray(aObject) ? [] : {};
    for (const k in aObject) {
        v = aObject[k];
        bObject[k] = (typeof v === 'object') ? copyDeep(v) : v;
    }

    return bObject;
}

/**copies object and returns copied object with descendant properties placed in alphabetical order */
export function copyItemByAlphabet(aObject: any) {
    if (!aObject) {
        return aObject;
    }    
    return Object.keys(aObject)
    .sort()
    .reduce(function (acc: any, key) {
        let v = aObject[key];
        acc[key] = (typeof v === 'object' && v !== null) ? copyItemByAlphabet(v) : v;
        return acc;
    }, Array.isArray(aObject) ? [] : {});
}

/**whether string is contained somewhere in this value */
export function containsSearch(value?: string, str?: string) {
    if (str == null) {
        return true;
    }
    if (value == null) {
        return false;
    }
    
    return value.toLowerCase().includes(str.toLowerCase());
}

/**must be an object.  Returns a flat map of all items in the prop selector */
export function deepSelect(obj: any, propSelector: Function = (obj: any) => obj) {
    if (obj == null) {
        return []
    }

    const arr = Array.isArray(obj) ? obj : propSelector(obj)

    if (!isLengthyArray(arr)) {
        return []
    }
  
    return [...arr.reduce((a: any, b: any) => {
        a.push(b)
        const v = deepSelect(b, propSelector)
        if (isLengthyArray(v)) {
            a.push(...v)
        }
        return a
    }, [])]
}

export function DataURIToBlob(dataURI: any) {
    const splitDataURI = dataURI.split(',')
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])        
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

    const ia = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
}


export function extractErrorDescription(error: any) {
    var msg = '';
    if (error) {
        if (error.message)
            msg = error.message

        if (error.response && error.response.data) {
            if (error.response.data.errors) {
                for (var i = 0; i < error.response.data.errors.length; i++) {
                    msg = msg + ' | ' + error.response.data.errors[i];
                }
            }
            if (error.response.data.message) {
                msg = msg + ' | ' + error.response.data.message;
            }

            msg = msg + ' | ' + JSON.stringify(error.response.data);
        }
        
        return msg;
    }

    return 'hmmm no error was supplied';
}

export function getRandomColor() {
    const rColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    if (rColor.length !== 7) {
        return getRandomColor();
    } else {
        return rColor;
    }
}

/**tests for whether string is contains in any of the given props of the given value */
export function hasSearch(value: any, str?: string, props?: string[]) {
    if (str == null) {
        return true;
    }
    
    if (value == null || props == null) {
        return false;
    }

    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        var propVal = nestedValue(value, propName);
        if (propVal != undefined) {
            if (typeof(propVal) === 'string') {
                if (containsSearch(propVal, str)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

export function toCompareString(str?: string) {
    if (str != null) {
        return str.replaceAll(' ', '').toLowerCase();
    }
    else {
        return null;
    }
}

export function twiddleThumbs(mSec = 2000) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), mSec);
    })
}

export function nestedValue(obj: any, path?: string) {
    if (obj == null || obj == undefined || !path) {
        return null;
    }
    
    var props = path.split('.');
    let propCnt = props.length;
    var r = obj;

    for (var i = 0; i < propCnt; i++) {
        r = r[props[i]]
        if (r == null) {
            return null;
        }
    }

    return r;
}

export function validEmail(email?: string) {
    if (!email) return false
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
}

export function singularize(str: string) {
    if (str.endsWith('ies'))
        return str.slice(0, str.length - 3)

    // if (str.endsWith('es'))
    //     return str.slice(0, str.length - 2)

    if (str.endsWith('s'))
        return str.slice(0, str.length - 1)

    return str
}