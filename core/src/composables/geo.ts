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

    function areaContains(polygon: GeoCoordinate[], point?: GeoCoordinate) {
        if (polygon == null || point?.lat == null || point?.lng == null)
            return false;

        var pointsList = polygon.map(x => {
            return { x: x.lat!, y: x.lng! };
        });
        //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
        let odd = false;
        //For each edge (In this case for each point of the polygon and the previous one)
        for (let i = 0, j = pointsList.length - 1; i < pointsList.length; i++) {
            if ((pointsList[i].y > point.lng) !== (pointsList[j].y > point.lng)) {
                if (point.lat < ((pointsList[j].x - pointsList[i].x) * (point.lng - pointsList[i].y) / (pointsList[j].y - pointsList[i].y) + pointsList[i].x)) {
                    odd = !odd;
                }
            }
            
            j = i;

        }
        //If the number of crossings was odd, the point is in the polygon
        return odd;
    }

    return {
        areaContains,
        getAreaAround,
        getAreaToLeft,
        getAreaToRight,
        getBoundary
    }
}