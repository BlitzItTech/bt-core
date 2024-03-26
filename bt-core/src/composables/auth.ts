import { isLengthyArray } from '@/composables/helpers';
import { DateTime } from 'luxon'
import { type RemovableRef, useStorage } from '@vueuse/core'
import { useDemo } from '@/composables/demo'
import { useRouter } from 'vue-router'
import { toValue } from 'vue'

interface AuthItem {
    children?: AuthItem[]
    ignoreSuspension?: boolean
    permissions?: string[]
    requiresAuth?: boolean
    subscriptions?: string[]
}

interface AuthSubscription {
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

const state = useStorage<BaseAuthCredentials>('auth-credentials', {})
let defaultsSet = false
let defaultTimeZone = 'Australia/Melbourne'

export type FindAuthItem = (navName?: string | AuthItem) => AuthItem | undefined
export type GetAuthUrl = (redirectPath?: string, state?: string) => string

export interface UseAuthOptions<T extends BaseAuthCredentials>{
    defaultTimeZone?: string,
    /**expiry token date format.  Defaults to 'd/MM/yyyy h:mm:ss a' */
    expiryTokenFormat?: string
    /**retrieve the auth item */
    getAuthItem: FindAuthItem
    /**retrieve the url to navigate to for the OAuth 2.0 process */
    getAuthUrl: GetAuthUrl
    /**sets current credentials on top of default function*/
    setCredentials: (state: RemovableRef<T>, payload: any) => void
    /**suboptions */
    subscriptionOptions?: AuthSubscription[]
}

/**returns current timezone */
export function useTimeZone() {
    return state.value.timeZone ?? defaultTimeZone
}

export function useAuthData() {
    return state.value
}

export function useAuth<T extends BaseAuthCredentials>(options: UseAuthOptions<T>) {
    const router = useRouter()
    const expiryFormat = options.expiryTokenFormat ?? 'd/MM/yyyy h:mm:ss a'
    const authState = useStorage<string>('auth-credentials-state', (Math.random().toString(36).substring(4, 19) + Math.random().toString(12).substring(1, 11)))

    if (!defaultsSet) {
        setDefaults()
        defaultsSet = true
    }

    const { endDemo, isDemoing } = useDemo()
    
    /**can edit if navName is undefined, isGlobalAdmin, not suspended, or user permissions allow editing of this navItem */
    function canEdit(navName?: string): boolean {
        if (navName == null) return true

        var navItem = options.getAuthItem(navName);
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
        
        var navItem = options.getAuthItem(navName);
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
        var navItem = options.getAuthItem(navName);
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

    function getAuthUrl(redirectPath?: string) {
        return options.getAuthUrl(redirectPath, authState.value)
    }

    // var path = appendUrl(useUrl('Authentication'), `authorize?response_type=code&client_id=appClient1&redirect_uri=${window.location.origin}/authentication&state=${getAuthState()}`);
    // return redirectPath ? `${path}&redirect_path=${redirectPath}` : path

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
    function logout(navNameRedirect?: string) {
        state.value = undefined
        
        //ensure time zone still exists
        setDefaults()
        
        //clear stores

        //maybe redirect
        if (navNameRedirect != null) {
            if (router.currentRoute.value.name != navNameRedirect) {
                router.push({ name: navNameRedirect })
            }
        }
    }

    /**Redirects to OAuth 2.0 process if not yet logged in and token expired.  Ends demo. */
    function login(redirectPath?: string) {
        const mState = toValue(state)

        if (!mState.isLoggedIn) {
            endDemo()
            if (tokenExpired()) {
                logout()
                window.location.href = getAuthUrl(redirectPath) //}response_type=code&client_id=appClient1&redirect_path=${redirectPath}` : getAuthUrl()
            }
        }
    }

    /**if not demoing, then will decrypt the jwtToken and attempt to set credentials */
    function setAuth(jwtToken?: string) {
        if (jwtToken == null) return

        if (!isDemoing.value) {
            const d = jwtDecrypt(jwtToken)
            
            setDefaultAuth(d)
            
            if (options.setCredentials != null) {
                options.setCredentials(state as RemovableRef<T>, d)
            }
        }
    }

    function setDefaultAuth(d: any) {
        const v = state.value
        v.expiresOn = d.ExpiresOn
        v.isGlobalAdmin = d.IsGlobalAdmin == 'True'
        v.isLoggedIn = true
        v.permissions = d.Permissions
        v.subscriptionCode = d.Subscription
        // v.subscriptionsInUse = d.SubscriptionsInUse
        v.token = d
        v.userID = d.UserLoginID
        v.userPermissions = d.Permissions?.split(',') ?? []
    }

    function setDefaults() {
        state.value.timeZone ??= (options.defaultTimeZone ?? defaultTimeZone)
    }

    /**returns whether or not logged in.  Potentially redirects to OAauth 2.0 process if logged in and expired */
    function tryLogin() {
        const mState = toValue(state)

        //what if no internet?
        if (mState.isLoggedIn && tokenExpired()) {
            logout()
            window.location.href = getAuthUrl()
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

    return {
        authState: authState.value,
        canEdit,
        canEditPermit,
        canView,
        canViewPermit,
        credentials: state.value,
        doShow,
        doShowByNav,
        getAuthUrl,
        login,
        logout,
        setAuth,
        tryLogin
    }
}