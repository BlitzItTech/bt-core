export interface GeoCoordinate {
    lat?: number
    lng?: number
}

export function useGeo() {
    
    /**
     * get area around a certain location with a space of the given size
     * @param location 
     * @param radius
     * @returns 
     */
    function getAreaAround(location: GeoCoordinate, radius: number) {
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
    function getAreaToLeft(location: GeoCoordinate, radius: number) {
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
    function getAreaToRight(location: GeoCoordinate, radius: number) {
        if (location.lat == null || location.lng == null)
            return undefined
    
        return [
            { lat: location.lat, lng: location.lng + radius },
            { lat: location.lat, lng: location.lng - radius },
            { lat: location.lat + (radius * 2), lng: location.lng - radius },
            { lat: location.lat + (radius * 2), lng: location.lng + radius }
        ];
    }
    
    function getBoundary(mvcArray: any): GeoCoordinate[] {
        let newPaths: GeoCoordinate[][] = []
        var mvcLength = mvcArray.getLength()

        for (let i = 0; i < mvcLength; i++) {
            let path: GeoCoordinate[] = []
            let pathArray = mvcArray.getAt(i)
            let pathLength = pathArray.getLength()
            for (let j = 0; j < pathLength; j++) {
                let point = pathArray.getAt(j)
                path.push({ lat: point.lat(), lng: point.lng() })
            }
            newPaths.push(path)
        }
    
        return newPaths[0]
    }

    return {
        getAreaAround,
        getAreaToLeft,
        getAreaToRight,
        getBoundary
    }
}