import { appendUrl, isLengthyArray, isNullOrEmpty, jwtDecrypt } from '../composables/helpers.ts'
import { DateTime } from 'luxon'
import { type RemovableRef, useStorage } from '@vueuse/core'
import { BTCreateMenu } from '../composables/menu.ts'
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
    refreshExpiresOn?: string
    refreshToken?: string
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
    getTokenTestUrl?: (token: string) => string
    menu?: BTCreateMenu
    oauthGrantType?: string
    oauthClientID?: string
    /**sets current credentials on top of default function
     * for processing the token payload and applying to state
    */
    processTokenPayload?: (state: RemovableRef<any>, payload: any) => void
    router?: Router
    /**suboptions */
    subscriptionOptions?: AuthSubscription[]
    /**tests whether token is still valid after receiving a 401 Unauthorized Response */
    testToken?: (code?: string) => Promise<boolean>
    /**where to route to if token is no longer valid */
    tokenInvalidPath?: string
    
    /**overrides refresh token and all params below */
    tryRefreshToken?: (authObj?: any) => Promise<void>
    /**how many minutes left on refresh expiry before refreshing | Defaults to 10,800 (7 days) */
    tokenRefreshMinuteWindow?: number
    /**if UseTokenRefresh */
    tokenRefreshPath?: string
    /**whether to use token refreshing */
    useTokenRefresh?: boolean

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
    login: (redirectPath?: string, query?: any) => void
    logout: (navNameRedirect?: string) => void
    resetAuthState: () => void
    setAuth: (jwtToken?: string) => void
    testToken: () => Promise<boolean>
    timeZone: ComputedRef<string>
    tryLogin: () => boolean | undefined
    tryRefreshToken: () => Promise<void>
}

let current: BTAuth
const authStateKey = 'auth-credentials-state'

export function useAuth(): BTAuth {
    return current
}

export function createAuth(options: CreateAuthOptions): BTAuth {
    const expiryFormat = options.expiryTokenFormat ?? 'd/MM/yyyy h:mm:ss a'
    const refreshMinutesWindow = options.tokenRefreshMinuteWindow ?? 10800

    let authState = ref(localStorage.getItem(authStateKey) ?? '')
    
    if (authState.value.length == 0) {
        resetAuthState()
    }

    function resetAuthState() {
        authState.value = Math.random().toString(36).substring(4, 19) + Math.random().toString(12).substring(1, 11)
        localStorage.setItem(authStateKey, authState.value)
    }

    const state = useStorage<BaseAuthCredentials>('auth-credentials', {})

    if (options.menu != null)
        options.menu.currentView.value = state.value.subscriptionCode

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

    /**clears credentials and potentially redirects */
    function logout(navPathRedirect?: string) {
        state.value = undefined
        
        //ensure time zone still exists
        reinstateDefaults()
        
        //clear stores

        //maybe redirect
        if (navPathRedirect != null && options.router != null) {
            if (options.router.currentRoute.value.path != navPathRedirect) {
                options.router.push({ path: navPathRedirect })
            }
        }
    }

    /**Redirects to OAuth 2.0 process if not yet logged in and token expired.  Ends demo. */
    function login(redirectPath?: string, query?: any) {
        const mState = toValue(state)

        if (tokenExpired() || !mState.isLoggedIn) {
            logout()

            let url = getAuthorizeUrl(redirectPath);

            if (query != null) {
                if (!url.includes('?'))
                    url = url + '?'

                if (url.includes('&'))
                    url = url + '&'

                url = url + new URLSearchParams(query).toString()
            }

            window.location.href = url
        }
        else if (!isNullOrEmpty(redirectPath) && options.router != null) {
            options.router.push({ path: redirectPath })
        }
    }

    async function tryRefreshToken() {
        options.tryRefreshToken ??= async () => {
            console.log('trying refresh')

            if (options.useTokenRefresh !== true)
                return

            if (isNullOrEmpty(state.value.refreshToken) || isNullOrEmpty(state.value.refreshExpiresOn))
                return

            const expiresOn = DateTime.fromFormat(state.value.refreshExpiresOn!, expiryFormat)
            const now = DateTime.utc()
            const triggerOn = expiresOn.plus({ minutes: 0 - refreshMinutesWindow })
            
            // console.log(`testing ${expiresOn} with ${now} and if after ${triggerOn}`)
            if (now.toString() > expiresOn.toString())
                return //do not refresh

            if (now.toString() < triggerOn.toString())
                return //do not refresh
            
            //continue

            var refreshUrl = appendUrl(useAuthUrl(), options.tokenRefreshPath ?? 'refreshtoken')

            console.log(`refresh url: ${refreshUrl}`)

            try {
                var res = await fetch(refreshUrl, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken: state.value.refreshToken })
                })

                if (res.ok) {
                    var jRes = await res.json()
                    if (res != null && jRes.data != null)
                        setAuth(jRes.data)
                }
            }
            catch { }
        }

        return await options.tryRefreshToken(state.value)
    }

    async function testToken() {
        options.testToken ??= async () => {
            let token = state.value.token
            let isValid = false
            
            const getTestUrl = options.getTokenTestUrl ?? (() => {
                return appendUrl(useAuthUrl(), 'test')
            })
            
            if (token != null) {
                const api = useApi()

                const res = await api.post<any>({ 
                    additionalUrl: getTestUrl(token),
                    data: {
                        token: token
                    }
                 })

                 console.log('test result')
                 console.log(res)

                 if (res.data === true)
                    isValid = true
            }

            if (!isValid) {
                logout(options.tokenInvalidPath)
                // if (options.tokenInvalidRouteName != null)
                //     options?.router?.push({ name: options.tokenInvalidRouteName })
                return false
            }

            return true
        }

        return await options.testToken()
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

            setAuth(res.access_token)
        }

        return await options.getToken(code, state)
    }

    /**if not demoing, then will decrypt the jwtToken and attempt to set credentials */
    function setAuth(jwtToken?: string) {
        if (jwtToken == null) return

        const d = jwtDecrypt(jwtToken)
        
        setDefaultAuth(d, jwtToken)
        
        if (options.processTokenPayload != null)
            options.processTokenPayload(state, d)
    }

    function setDefaultAuth(d: any, token: string) {
        const v = state.value
        v.expiresOn = d.ExpiresOn
        v.isGlobalAdmin = d.IsGlobalAdmin == 'True'
        v.isLoggedIn = true
        v.permissions = d.Permissions
        v.subscriptionCode = d.Subscription
        v.refreshExpiresOn = d.RefreshTokenExpiresOn
        v.refreshToken = d.RefreshToken

        if (options?.menu != null)
            options.menu.currentView.value = v.subscriptionCode
        
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

        if (mState.isLoggedIn && tokenExpired() && refreshTokenExpired()) {
            logout()
            window.location.href = getAuthorizeUrl()
        }

        return mState.isLoggedIn
    }

    /**returns true if not implemented, etc. */
    function refreshTokenExpired() {
        if (!options.useTokenRefresh)
            return true

        if (isNullOrEmpty(state.value.refreshExpiresOn) || isNullOrEmpty(state.value.refreshToken))
            return true
        
        const expiresOn = DateTime.fromFormat(state.value.refreshExpiresOn!, expiryFormat)
        const now = DateTime.utc()
        
        if (now < expiresOn)
            return true //do not refresh

        return false
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
        testToken,
        timeZone: computed(() => {
            return state.value.timeZone ?? options.defaultTimeZone ?? defaultTimeZone
        }),
        tryLogin,
        tryRefreshToken
    }

    return current
}