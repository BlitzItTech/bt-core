import { validEmail } from '../composables/helpers.ts'

export interface UseRulesOptions {
    forEmail?: boolean
    forPassword?: boolean
    otherRules?: any
    required?: boolean,
}

export function useRules(options?: UseRulesOptions) {
    const rules = []

    if (options?.required == true) {
        rules.push((v: any) => !!v || 'Field is required')
    }

    if (options?.otherRules != null) {
        if (Array.isArray(options?.otherRules)) {
            rules.push(...options.otherRules)
        }
        else {
            rules.push(options.otherRules)
        }
    }

    if (options?.forPassword == true) {
        rules.push((x: any) => !!x || 'Password is required')
        rules.push((x: any) => x !!= null && x.length > 9 || 'Password must be 10 or more characters')
        rules.push((x: any) => /^(.*[a-z].*)$/.test(x) || 'Password must contain a lowercase letter')
        rules.push((x: any) => /^(.*[A-Z].*)$/.test(x) || 'Password must contain an uppercase letter')
        rules.push((x: any) => /^(.*\d.*)$/.test(x) || 'Password must contain a number')
    }

    if (options?.forEmail == true) {
        rules.push((v: any) => !!v || 'Email is required')
        rules.push((v: any) => validEmail(v) || 'Email must be valid')
    }

    return rules
}