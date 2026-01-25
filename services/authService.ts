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

// Configured providers. In production, these clientIds are from environment variables.
const AUTH_CONFIG: Record<string, AuthProviderConfig> = {
    GOOGLE: { 
        enabled: true, 
        clientId: '8423984723-mock.apps.googleusercontent.com', // Placeholder for UI visibility
        authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'openid email profile'
    },
    MICROSOFT: { 
        enabled: true, 
        clientId: 'ms-mock-id',
        authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'openid profile email'
    },
    ORCID: { 
        enabled: true, 
        clientId: 'orcid-mock-id',
        authEndpoint: 'https://orcid.org/oauth/authorize',
        scope: '/authenticate'
    }
};

export const authService = {
    isAdminAuthenticated: (): boolean => !!localStorage.getItem(ADMIN_SESSION_KEY),

    getCurrentUser: (): User | null => storageService.getUserSession(),

    getProviders: () => AUTH_CONFIG,

    // Fix: Implement loginAdmin
    loginAdmin: async (username: string, pass: string): Promise<boolean> => {
        // Mock admin check - in production, this would be a server call
        if (username === 'admin' && pass === 'vericite2026') {
            localStorage.setItem(ADMIN_SESSION_KEY, "mock_admin_token_" + Date.now());
            db.logEvent('INFO', `Admin login: ${username}`);
            return true;
        }
        db.logEvent('WARN', `Failed admin login attempt: ${username}`);
        return false;
    },

    // Fix: Implement logoutAdmin
    logoutAdmin: () => {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        db.logEvent('INFO', 'Admin logout performed.');
    },

    /**
     * REAL OAUTH REDIRECTION
     * This function constructs a standard OAuth 2.0 URL and redirects the browser.
     * This is NOT a simulation; it sends the user to the actual provider's consent page.
     */
    initiateOAuth: (providerKey: string) => {
        const config = AUTH_CONFIG[providerKey];
        if (!config || !config.enabled || !config.clientId) return;

        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem(OAUTH_STATE_KEY, state);
        sessionStorage.setItem(OAUTH_PROVIDER_KEY, providerKey);

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: window.location.origin, // Returns to our app
            response_type: 'code',
            scope: config.scope,
            state: state,
            prompt: 'select_account' 
        });

        window.location.href = `${config.authEndpoint}?${params.toString()}`;
    },

    /**
     * Processes the callback code.
     * In a real system, the 'code' is exchanged on the SERVER for a token.
     * Here, we simulate the server-side verification after the redirect returns.
     */
    handleOAuthCallback: async (code: string, returnedState: string): Promise<{ success: boolean; user?: User; error?: string }> => {
        const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
        const providerKey = sessionStorage.getItem(OAUTH_PROVIDER_KEY);

        if (!storedState || storedState !== returnedState) {
            return { success: false, error: "CSRF Validation Failed. Unauthorized request." };
        }

        // Simulate server-side token exchange and identity verification
        await new Promise(r => setTimeout(r, 1000));
        
        const mockEmail = `user_${code.substring(0, 4)}@${providerKey?.toLowerCase()}.com`;
        let user = db.getUserByEmail(mockEmail);
        
        // Fix: Added missing DbUser properties joinedAt and lastLogin
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
        return { success: true, user: user as User };
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