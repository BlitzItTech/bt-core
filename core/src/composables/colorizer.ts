interface ColorRec {
    color: string,
    isUsed?: boolean
}

export function useColorizer() {

    const colorOptions: ColorRec[] = [
        { color: '#27D81E' },
        { color: '#1E78D8' },
        { color: '#8F1ED8' },
        { color: '#D83F1E' },
        { color: '#D81EBE' },
        { color: '#D81E5C' },
        { color: '#1ED5D8' },
        { color: '#D2D81E' },
        { color: '#186A3B' }
    ]

    let ind = -1

    function getColor() {
        ind++

        if (ind == colorOptions.length)
            ind = 0

        return colorOptions[ind].color
    }

    return {
        getColor
    }
}