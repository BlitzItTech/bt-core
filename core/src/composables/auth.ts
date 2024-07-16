import { appendUrl, isLengthyArray } from '../composables/helpers.ts'
import { DateTime } from 'luxon'
import { type RemovableRef, useStorage } from '@vueuse/core'
import { type BTDemo } from '../composables/demo.ts'
import { Router } from 'vue-router'
import { computed, ref, toValue } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useAuthUrl } from './urls.ts'
import { useApi } from './api.ts'

export interface AuthItem {
    children?: AuthItem[]
    ignoreSuspension?: boolean
    permissions?: string[]
    requiresAuth?: boolean
    subscriptions?: string[]
}

export interface AuthSubscription {
    code: string
    value: number
}

export interface BaseAuthCredentials {
    expiresOn?: string
    isGlobalAdmin?: boolean
    isLoggedIn?: boolean
    isSuspended?: boolean
    permissions?: string
    subscriptionCode?: string
    timeZone?: string
    token?: string
    userID?: string
    userPermissions?: string[]
}

let defaultTimeZone = 'Australia/Melbourne'

// export type GetAuthUrl = (redirectPath?: string, state?: string) => string

export interface CreateAuthOptions {
    defaultTimeZone?: string,
    demo?: BTDemo,
    /**expiry token date format.  Defaults to 'd/MM/yyyy h:mm:ss a' */
    expiryTokenFormat?: string
    /**OVERRIDES CORE DEFAULT. retrieve the auth item */
    getAuthItem?: (navName?: string | AuthItem) => AuthItem | null
    /**OVERRIDES DEFAULT. the url to start the OAuth 2.0 process */
    getAuthorizeUrl?: (redirectPath?: string, state?: string) => string
    /**OVERRIDES DEFAULT. use the given code and generate the url to convert to an access token */
    getTokenUrl?: (code: string, redirect_uri: string, grant_type: string, client_id: string) => string
    /**OVERRIDES DEFAULT.  */
    getToken?: (code?: string, state?: string) => Promise<void>
    oauthGrantType?: string
    oauthClientID?: string
    /**sets current credentials on top of default function
     * for processing the token payload and applying to state
    */
    processTokenPayload?: (state: RemovableRef<any>, payload: any) => void
    /**suboptions */
    subscriptionOptions?: AuthSubscription[]
}

export interface BTAuth {
    authState: Ref<string>
    /**Global Admin, everything.edit, *.edit */
    canEdit: (navName?: string) => boolean
    canEditPermit: (permit: string) => boolean
    /**Global Admin, everything.view, *.view */
    canView: (navName?: string) => boolean
    canViewPermit: (permit: string) => boolean
    credentials: RemovableRef<any>
    doShow: (subcodes?: string[], permissions?: string[], action?: 'view' | 'edit') => boolean
    doShowByNav: (navName?: string | AuthItem, includeChildren?: boolean) => boolean
    getAuthorizeUrl: (redirectPath?: string) => string
    getToken: (code?: string, state?: string) => Promise<void>
    isLoggedIn: ComputedRef<boolean>
    login: (redirectPath?: string) => void
    logout: (navNameRedirect?: string, router?: Router) => void
    resetAuthState: () => void
    setAuth: (jwtToken?: string) => void
    timeZone: ComputedRef<string>
    tryLogin: () => boolean | undefined
}

let current: BTAuth
const authStateKey = 'auth-credentials-state'

export function useAuth(): BTAuth {
    return current
}

export function createAuth(options: CreateAuthOptions): BTAuth {
    const expiryFormat = options.expiryTokenFormat ?? 'd/MM/yyyy h:mm:ss a'
    let authState = ref(localStorage.getItem(authStateKey) ?? '')
    
    if (authState.value.length == 0) {
        resetAuthState()
    }

    function resetAuthState() {
        authState.value = Math.random().toString(36).substring(4, 19) + Math.random().toString(12).substring(1, 11)
        localStorage.setItem(authStateKey, authState.value)
    }

    // const authState = useStorage<string>('auth-credentials-state', (Math.random().toString(36).substring(4, 19) + Math.random().toString(12).substring(1, 11)))
    const state = useStorage<BaseAuthCredentials>('auth-credentials', {})

    /**can edit if navName is undefined, isGlobalAdmin, not suspended, or user permissions allow editing of this navItem */
    function canEdit(navName?: string): boolean {
        if (navName == null) return true

        var navItem = options.getAuthItem != null ? options.getAuthItem(navName) : null;
        if (navItem == null) return false
        if (navItem.requiresAuth === false) return true

        const mState = toValue(state)
        if (mState.isSuspended && navItem.ignoreSuspension !== true) return false
        if (mState.isGlobalAdmin) return true
        
        if (navItem.permissions != null) {
            for (var ii = 0; ii < navItem.permissions.length; ii++) {
                if (!canEditPermit(navItem.permissions[ii])) {
                    return false
                }
            }
        }

        return true;
    }
    
    /**purely tests for whether this permit is in the user's permissions list.
     * Or else the user just needs the 'everything.edit' permission.
     */
    function canEditPermit(permit: string): boolean {
        const mState = toValue(state)
        
        if (mState.userPermissions != null) {
            for (var i = 0; i < mState.userPermissions.length; i++) {
                var parts = mState.userPermissions[i].split('.');
                if (mState.userPermissions[i] == 'everything.edit' ||
                    permit == parts[0] && parts.length > 1 && parts[1] == 'edit') {
                    return true;
                }
            }
        }
        
        return false
    }
    
    /**can view if navName is undefined, isGlobalAdmin, not susepended, or user permissions allow viewing of this navItem */
    function canView(navName: string | undefined): boolean {
        if (navName == null) return true
        
        var navItem = options.getAuthItem != null ? options.getAuthItem(navName) : null;
        if (navItem == null) return false
        if (navItem.requiresAuth === false) return true

        const mState = toValue(state)
        if (mState.isSuspended && navItem.ignoreSuspension !== true) return false
        if (mState.isGlobalAdmin) return true

        if (navItem.permissions != null) {
            for (var ii = 0; ii < navItem.permissions.length; ii++) {
                if (!canViewPermit(navItem.permissions[ii])) {
                    return false;
                }
            }
        }

        return true;
    }
    
    /**purely tests for whether this permit is in the user's permissions list.
     * Or else the user just needs the 'everything.view' permission or '[permit].edit'.
     */
    function canViewPermit(permit: string): boolean {
        const mState = toValue(state)
        
        if (mState.userPermissions != null) {
            for (var i = 0; i < mState.userPermissions.length; i++) {
                var parts = mState.userPermissions[i].split('.');
                if (permit == parts[0] || permit == 'everything' || 
                    mState.userPermissions[i] == 'everything.view' ||
                    mState.userPermissions[i] == 'everything.edit') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**doesn't check for suspension
     * if user
     */
    function doShow(subcodes?: string[], permissions?: string[], action?: 'view' | 'edit'): boolean {
        let doShowRes = true

        const mState = toValue(state)
        if (mState.isGlobalAdmin) return true

        if (permissions != null && permissions.length > 0) {
            permissions.forEach((permit: string) => {
                if (action == 'edit') {
                    if (!canEditPermit(permit)) {
                        doShowRes = false
                    }
                }
                else {
                    //otherwise it will be view
                    if (!canViewPermit(permit)) {
                        doShowRes = false
                    }
                }
            })
        }

        if (subcodes != null && subcodes.length > 0) {
            if (!subcodes.some((subCode: string) => isWithinSubscription(subCode))) {
                doShowRes = false
            }
        }

        return doShowRes
    }

    function doShowByNav(navName?: string | AuthItem, includeChildren: boolean = false) {
        var navItem = options.getAuthItem != null ? options.getAuthItem(navName) : null;
        let doShowRes = false;

        if (navItem == null) return false

        let subcodes = navItem.subscriptions ?? []
        let permissions = navItem.permissions ?? []
        let oRes = doShow(subcodes, permissions, 'view');

        if (oRes || !includeChildren || !isLengthyArray(navItem.children))
            return oRes

        if (navItem?.children != null) {
            navItem.children.forEach(child => {
                if (doShowByNav(child, true)) {
                    doShowRes = true;
                }
            })
        }
        
        return doShowRes;
    }

    function getAuthorizeUrl(redirectPath?: string) {
        options.getAuthorizeUrl ??= (redirectPath?: string, state?: string) => {
            const path = appendUrl(useAuthUrl(), `authorize?response_type=code&client_id=${options.oauthClientID}&redirect_uri=${window.location.origin}/authentication&state=${state}`)
            return redirectPath ? `${path}&redirect_path=${redirectPath}` : path
        }

        if (options.getAuthorizeUrl != null)
            return options.getAuthorizeUrl(redirectPath, authState.value) ?? ''

        return ''
    }

    /**undefined or unfound is worth 0 */
    function getSubscriptionCodeValue(subCode?: string) {
        if (subCode == null) return 0
        let subList = options.subscriptionOptions ?? []
        return subList.find(x => x.code == subCode)?.value ?? 0
    }

    /**identifies whether user's subscription level allows for this subCode */
    function isWithinSubscription(subCode?: string) {
        const mState = toValue(state)

        if (mState.subscriptionCode == null) return false
        if (mState.subscriptionCode == subCode) return true

        const subLevelNeeded = getSubscriptionCodeValue(subCode)
        const subCompanyLevel = getSubscriptionCodeValue(mState.subscriptionCode)

        return subLevelNeeded <= subCompanyLevel
    }

    /**decrypts jwt token */
    function jwtDecrypt(token: string) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function(c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );

        return JSON.parse(jsonPayload);
    }

    /**clears credentials and potentially redirects */
    function logout(navPathRedirect?: string, router?: Router) {
        state.value = undefined
        
        //ensure time zone still exists
        reinstateDefaults()
        
        //clear stores

        //maybe redirect
        if (navPathRedirect != null && router != null) {
            if (router.currentRoute.value.path != navPathRedirect) {
                router.push({ path: navPathRedirect })
            }
        }
    }

    /**Redirects to OAuth 2.0 process if not yet logged in and token expired.  Ends demo. */
    function login(redirectPath?: string) {
        const mState = toValue(state)

        if (!mState.isLoggedIn) {
            options.demo?.endDemo()
            if (tokenExpired()) {
                logout()
                window.location.href = getAuthorizeUrl(redirectPath) //}response_type=code&client_id=appClient1&redirect_path=${redirectPath}` : getAuthUrl()
            }
        }
    }

    /**defaults to find parameters from route query */
    async function getToken(code?: string, state?: string) {
        options.getToken ??= async () => {
            let mCode = code
            let mState = state
            let mGrantType = options.oauthGrantType ?? 'authorization_token'
            let mClientID = options.oauthClientID ?? ''
            
            if (mCode == null || mState == null) {
                throw new Error('Code and State required in OAuth token process')
            }
    
            if (mState != authState.value)
                throw new Error('state does not match')
    
            let url = ''
    
            options.getTokenUrl ??= () => {
                return appendUrl(useAuthUrl(), 'token')
            }
    
            url = options.getTokenUrl(mCode, `${window.location.origin}/authentication`, mGrantType, mClientID)
    
            const formData: any = {}
            formData['grant_type'] = mGrantType
            formData['code'] = mCode
            formData['redirect_uri'] = `${window.location.origin}/authentication`
            formData['client_id'] = mClientID
    
            const api = useApi()
            const res = await api.post<any>({
                additionalUrl: url,
                data: formData
            })

            // const res = await fetch(url, {
            //     method: 'POST',
            //     mode: 'cors',
            //     cache: 'no-cache',
            //     body: JSON.stringify(formData)
            // })

            // const data = await res.json()
    
            setAuth(res.access_token)
        }

        return await options.getToken(code, state)
    }

    /**if not demoing, then will decrypt the jwtToken and attempt to set credentials */
    function setAuth(jwtToken?: string) {
        if (jwtToken == null) return

        if (options.demo == null || !options.demo.isDemoing.value) {
            const d = jwtDecrypt(jwtToken)
            
            setDefaultAuth(d, jwtToken)
            
            if (options.processTokenPayload != null)
                options.processTokenPayload(state, d)
        }
    }

    function setDefaultAuth(d: any, token: string) {
        const v = state.value
        v.expiresOn = d.ExpiresOn
        v.isGlobalAdmin = d.IsGlobalAdmin == 'True'
        v.isLoggedIn = true
        v.permissions = d.Permissions
        v.subscriptionCode = d.Subscription
        
        // v.subscriptionsInUse = d.SubscriptionsInUse
        v.timeZone ??= (options.defaultTimeZone ?? defaultTimeZone)
        
        v.token = token
        v.userID = d.UserLoginID
        v.userPermissions = d.Permissions != null && d.Permissions.length > 0 ? d.Permissions?.split(',') ?? [] : []
    }

    function reinstateDefaults() {
        state.value ??= {}
        state.value.timeZone ??= (options.defaultTimeZone ?? defaultTimeZone)
    }

    /**returns whether or not logged in.  Potentially redirects to OAauth 2.0 process if logged in and expired */
    function tryLogin() {
        const mState = toValue(state)

        //what if no internet?
        if (mState.isLoggedIn && tokenExpired()) {
            logout()
            window.location.href = getAuthorizeUrl()
        }

        return mState.isLoggedIn
    }

    function tokenExpired() {
        const mState = toValue(state)
        if (mState == null || mState.expiresOn == null) return true

        const e1 = DateTime.fromFormat(mState.expiresOn, expiryFormat)
        const e2 = DateTime.utc()
        return e1 <= e2
    }

    reinstateDefaults()

    current = {
        authState,
        canEdit,
        canEditPermit,
        canView,
        canViewPermit,
        credentials: state,
        doShow,
        doShowByNav,
        getAuthorizeUrl,
        getToken,
        isLoggedIn: computed(() => state.value.isLoggedIn === true),
        login,
        logout,
        resetAuthState,
        setAuth,
        timeZone: computed(() => {
            return state.value.timeZone ?? options.defaultTimeZone ?? defaultTimeZone
        }),
        tryLogin
    }

    return current
}