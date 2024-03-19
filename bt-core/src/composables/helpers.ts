import { type MaybeRefOrGetter, toValue } from 'vue';


export function appendUrl(originalVal?: string, additionalVal?: string) {
    let original = originalVal ?? ''
    let additional = additionalVal ?? ''
    var returnValue = original.endsWith('/') ? original : original + '/';
    var newValue = additional.startsWith('/') ? additional.slice(1, additional.length) : additional;
    return returnValue + newValue;
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

interface GeoCoordinate {
    lat: number
    lng: number
}

/**
 * confirms if area is a certain size
 * @param boundary array of 4 x { lat: number, lng: number }
 * @param size 
 * @returns 
 */
export function isAreaOfSize(boundary?: GeoCoordinate[], size?: number) {
    if (boundary == null || size == null || boundary.length != 4) {
        return false;
    }

    var middleLat = boundary[0].lat + size;
    var middleLng = boundary[0].lng - size;

    if ((boundary[1].lat + size) != middleLat) {
        return false;
    }
    if ((boundary[1].lng + size) != middleLng) {
        return false;
    }

    if ((boundary[2].lat - size) != middleLat) {
        return false;
    }
    if ((boundary[2].lng + size) != middleLng) {
        return false;
    }

    if ((boundary[3].lat - size) != middleLat) {
        return false;
    }
    if ((boundary[3].lng - size) != middleLng) {
        return false;
    }

    return true;
}

/**
 * get area around a certain location with a space of the given size
 * @param location 
 * @param size 
 * @returns 
 */
export function getAreaAround(location: GeoCoordinate, size?: number) {
    size ??= 1
    
    return [
        { lat: location.lat - size, lng: location.lng + size },
        { lat: location.lat - size, lng: location.lng - size },
        { lat: location.lat + size, lng: location.lng - size },
        { lat: location.lat + size, lng: location.lng + size }
    ];
}

export function getAreaToLeft(location: GeoCoordinate, size?: number) {
    if (size == null) {
        size = 1;
    }

    return [
        { lat: location.lat - size, lng: location.lng },
        { lat: location.lat - size, lng: location.lng - (size * 2) },
        { lat: location.lat + size, lng: location.lng - (size * 2) },
        { lat: location.lat + size, lng: location.lng }
    ];
}

export function getAreaToRight(location: GeoCoordinate, size?: number) {
    if (size == null) {
        size = 1;
    }

    return [
        { lat: location.lat - size, lng: location.lng + (size * 2) },
        { lat: location.lat - size, lng: location.lng },
        { lat: location.lat + size, lng: location.lng },
        { lat: location.lat + size, lng: location.lng + (size * 2) }
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

export function checkImage(url?: string, goodCallback?: any, badCallback?: any) {
    if (!url)
        return

    var img = new Image();
    img.onload = goodCallback;
    img.onerror = badCallback;
    img.src = url;
}

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
 * @param val Converts string from camel case to pascal casing
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

export function weekdaysValue(wkDay?: string) {
    if (wkDay == null || containsWeekday(wkDay, 'Always')) {
        return 0;
    }
    else if (containsWeekday(wkDay, 'Sun')) {
        return 1;
    }
    else if (containsWeekday(wkDay, 'Mon')) {
        return 2;
    }
    else if (containsWeekday(wkDay, 'Tue')) {
        return 3;
    }
    else if (containsWeekday(wkDay, 'Wed')) {
        return 4;
    }
    else if (containsWeekday(wkDay, 'Thu')) {
        return 5;
    }
    else if (containsWeekday(wkDay, 'Fri')) {
        return 6;
    }
    else if (containsWeekday(wkDay, 'Sat')) {
        return 7;
    }

    return 8;
}

export function weekdayValue(wkDay?: string) {
    if (wkDay == null || wkDay == 'Always') {
        return 0;
    }
    else if (wkDay == 'Sun') {
        return 1;
    }
    else if (wkDay == 'Mon') {
        return 2;
    }
    else if (wkDay == 'Tue') {
        return 3;
    }
    else if (wkDay == 'Wed') {
        return 4;
    }
    else if (wkDay == 'Thu') {
        return 5;
    }
    else if (wkDay == 'Fri') {
        return 6;
    }
    else if (wkDay == 'Sat') {
        return 7;
    }

    return 8;
}

export function containsWeekday(weekdays?: string, wkDay?: string) {
    if (weekdays == null || wkDay == null) {
        return true;
    }

    var weekdayList = weekdays.split(',');
    return weekdayList.some(z => z == 'Always' || z == wkDay);
}

export function addWeekday(value?: string, day?: string) {
    var fullList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var potList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (day == null) {
        return value;
    }

    var abbWeekday = day.substring(0, 3);
    var ind = potList.indexOf(abbWeekday);
    var fullWeekday = fullList[ind];

    if (value == null) {
        return fullWeekday;
    }
    else {
        var wList = value.split(',');
        wList.push(fullWeekday);
        var list = [];
        for (let i = 0; i < fullList.length; i++) {
            const fDay = fullList[i];
            if (wList.some(y => y == fDay)) {
                list.push(fDay);
            }
        }
        return list.toString();
    }
}

export function removeWeekday(value?: string, day?: string) {
    let rVal = value ?? ''
    rVal = rVal.split(',').filter(y => y != day && y.substring(0, 3) != day).toString()
    return rVal != null && rVal.length > 0 ? rVal : null
}

//#endregion

//region arrays

export function isArrayOfLength(val: any, l: number) {
    return val != null && Array.isArray(val) && val.length == l;
}

export function isLengthyArray(val: any, minLength: number = 0) {
    return val != null && Array.isArray(val) && val.length > minLength
}

//#endregion

//#region dates

export function isMinDate(d?: string) {
    return '0001-01-01T00:00:00Z' == d;
}

export function getMinDate() {
    return new Date('0001-01-01T00:00:00Z').getTime();
}

//#end region

//#region math

/**
 * rounds the given value to a certain number of decimal places
 * @param v
 * @param dPlaces 
 * @returns 
 */
export function roundTo(v: MaybeRefOrGetter<number>, dPlaces: number) {
    const val = toValue(v)

    var m = '1';
    var i = 0;

    if (i < dPlaces) {
        do {
            m = m + '0';
            i += 1;
        } while (i < dPlaces);
    }

    var d = Number.parseInt(m);
    
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

export function copyItemByAlphabet(aObject: any) {
    //copy jsObject and reorder properties by alphabet name
    if (!aObject) {
        return aObject;
    }    
    return Object.keys(aObject)
    .sort()
    .reduce(function (acc: any, key) {
        let v = aObject[key];
        acc[key] = (typeof v === 'object' && !v === null) ? copyItemByAlphabet(v) : v;
        return acc;
    }, Array.isArray(aObject) ? [] : {});
}

export function containsSearch(value?: string, str?: string) {
    if (str == null) {
        return true;
    }
    if (value == null) {
        return false;
    }
    var valOne = value.toLowerCase(); //.replaceAll(' ', '');
    var valTwo = str.toLowerCase(); //.replaceAll(' ', '');
    return valOne.includes(valTwo);
}

export function deepSelect(obj: any, propSelector: Function = (obj: any) => obj) {
    if (obj == null) {
        return []
    }

    const arr = propSelector(obj)

    if (!isLengthyArray(arr)) {
        return []
    }
  
    return [...arr, ...arr.reduce((a: any, b: any) => {
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
        if (error.message) {
            msg = error.message;
        }

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