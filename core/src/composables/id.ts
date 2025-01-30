// Returns a random Universally Unique Identifier (UUID)
export function useId(pattern?: string) {
    // Accept any desired pattern. If no pattern is provided
    // default to a RFC4122 UUID pattern.
    const _pattern = pattern ? pattern : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

    // Replace each character in the pattern
    // leaving any non x|y character alone.
    return _pattern.replace(/[xy]/g, replacePattern);
}

function replacePattern(c: string) {
    // Random hexadecimal number
    const r = (Math.random() * 16) | 0;

    // If 'x' return hexadecimal number,
    // if 'y' return [8-11] randomly
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
}

const _pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

export function useIds() {
    return {
        getID: () => {
            return _pattern.replace(/[xy]/g, replacePattern)
        }
    }
}

export function useIDMemory(prefix?: string) {
    const ids: Record<string, string> = {}

    return {
        getID: (key?: string) => {
            const keys = Object.keys(ids) ?? []
            key ??= keys.length.toString() as string
            if (ids[key] == null)
                ids[key] = `${prefix ?? ''}id-${keys.length}`

            return ids[key]
        }
    }
}