
import { db } from './database';
import { User } from '../types';
import { storageService } from './storageService';

const ADMIN_SESSION_KEY = "vericite_admin_token";
const OAUTH_STATE_KEY = "vericite_oauth_state";
const OAUTH_PROVIDER_KEY = "vericite_oauth_provider";

interface AuthProviderConfig {
    enabled: boolean;
    clientId: string;
    authEndpoint: string;
    scope: string;
}

/**
 * AUTH CONFIGURATION
 * Buttons will only appear if these IDs are provided via environment variables.
 */
const AUTH_CONFIG: Record<string, AuthProviderConfig> = {
    GOOGLE: { 
        enabled: true, 
        clientId: process.env.GOOGLE_CLIENT_ID || '', 
        authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'openid email profile'
    },
    MICROSOFT: { 
        enabled: true, 
        clientId: process.env.MS_CLIENT_ID || '',
        authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'openid profile email'
    },
    ORCID: { 
        enabled: true, 
        clientId: process.env.ORCID_CLIENT_ID || '',
        authEndpoint: 'https://orcid.org/oauth/authorize',
        scope: '/authenticate'
    }
};

export const authService = {
    isAdminAuthenticated: (): boolean => !!localStorage.getItem(ADMIN_SESSION_KEY),

    getCurrentUser: (): User | null => storageService.getUserSession(),

    getProviders: () => AUTH_CONFIG,

    loginAdmin: async (username: string, pass: string): Promise<boolean> => {
        if (username === 'admin' && pass === 'vericite2026') {
            localStorage.setItem(ADMIN_SESSION_KEY, "admin_token_" + Date.now());
            db.logEvent('INFO', `Admin login: ${username}`);
            return true;
        }
        db.logEvent('WARN', `Failed admin login attempt: ${username}`);
        return false;
    },

    logoutAdmin: () => {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        db.logEvent('INFO', 'Admin logout performed.');
    },

    /**
     * INITIATE OAUTH REDIRECT
     * Standard OAuth 2.0 Authorization Code Flow.
     */
    initiateOAuth: (providerKey: string) => {
        const config = AUTH_CONFIG[providerKey];
        if (!config || !config.enabled || !config.clientId) {
            console.error(`[Auth] Attempted to initiate OAuth for ${providerKey} without valid Client ID.`);
            return;
        }

        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem(OAUTH_STATE_KEY, state);
        sessionStorage.setItem(OAUTH_PROVIDER_KEY, providerKey);

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: window.location.origin,
            response_type: 'code',
            scope: config.scope,
            state: state,
            prompt: 'select_account' 
        });

        window.location.href = `${config.authEndpoint}?${params.toString()}`;
    },

    /**
     * HANDLE CALLBACK
     * Only creates a session if the returned state matches the stored state.
     */
    handleOAuthCallback: async (code: string, returnedState: string): Promise<{ success: boolean; user?: User; error?: string }> => {
        const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
        const providerKey = sessionStorage.getItem(OAUTH_PROVIDER_KEY);

        if (!storedState || storedState !== returnedState) {
            db.logEvent('ERROR', 'OAuth callback failed: State mismatch (CSRF Attempt).');
            return { success: false, error: "Security validation failed. Please try logging in again." };
        }

        try {
            // In a real SaaS, we would POST the 'code' to our API here.
            // For this frontend-only environment, we finalize the verification simulation.
            await new Promise(r => setTimeout(r, 800));
            
            const mockEmail = `user_${code.substring(0, 4)}@${providerKey?.toLowerCase()}.com`;
            let user = db.getUserByEmail(mockEmail);
            
            if (!user) {
                user = {
                    id: `u_${Math.random().toString(36).substr(2, 9)}`,
                    isPremium: false,
                    analysisCount: 0,
                    subscriptionStatus: 'none',
                    joinedAt: Date.now(),
                    lastLogin: Date.now()
                };
                db.ensureUser(user as User, mockEmail);
            }

            storageService.saveUserSession(user as User, true);
            db.logEvent('INFO', `OAuth successful for ${providerKey}: ${user.id}`);
            return { success: true, user: user as User };
        } catch (e) {
            db.logEvent('ERROR', `OAuth callback processing error: ${e}`);
            return { success: false, error: "An error occurred during authentication. Please try again." };
        }
    },

    loginUser: async (email: string, _pass: string, remember: boolean): Promise<any> => {
        const user = db.getUserByEmail(email);
        if (!user) return { success: false, error: "User not found." };
        storageService.saveUserSession(user as User, remember);
        return { success: true, user };
    },

    registerUser: async (email: string, _pass: string): Promise<any> => {
        if (db.getUserByEmail(email)) return { success: false, error: "Email already in use." };
        const user: User = { id: `u_${Math.random().toString(36).substr(2,9)}`, isPremium: false, analysisCount: 0, subscriptionStatus: 'none' };
        db.ensureUser(user, email);
        storageService.saveUserSession(user, false);
        return { success: true, user };
    },

    logoutUser: () => storageService.clearSession()
};
