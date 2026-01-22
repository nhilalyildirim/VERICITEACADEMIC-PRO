import { db } from './database';
import { User } from '../types';
import { storageService } from './storageService';

const ADMIN_USER = "NHYA";
const ADMIN_PASSWORD = "239486*";
const ADMIN_SESSION_KEY = "vericite_admin_token";
const OAUTH_STATE_KEY = "vericite_oauth_state";
const OAUTH_PROVIDER_KEY = "vericite_oauth_provider";

// --- REAL OAUTH CONFIGURATION ---
// In production, these clientIds must be populated via process.env
// If a clientId is empty, the provider button will be HIDDEN automatically.

interface AuthProviderConfig {
    enabled: boolean;
    clientId: string;
    authEndpoint: string;
    scope: string;
    tokenEndpoint?: string; // For backend usage
}

const AUTH_CONFIG: Record<string, AuthProviderConfig> = {
    GOOGLE: { 
        enabled: true, 
        clientId: '', // Add your Google Client ID here
        authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'openid email profile'
    },
    MICROSOFT: { 
        enabled: true, 
        clientId: '', // Add your Microsoft Client ID here
        authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'openid profile email'
    },
    ORCID: { 
        enabled: true, 
        clientId: '', // Add your ORCID Client ID here
        authEndpoint: 'https://orcid.org/oauth/authorize',
        scope: '/authenticate'
    }
};

export const authService = {
    // --- ADMIN AUTH ---
    loginAdmin: async (username: string, password: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
            const token = `tok_admin_${Date.now()}`;
            localStorage.setItem(ADMIN_SESSION_KEY, token);
            db.logEvent('INFO', 'Admin logged in successfully.');
            return true;
        }
        db.logEvent('WARN', `Admin login failed: ${username}`);
        return false;
    },

    isAdminAuthenticated: (): boolean => !!localStorage.getItem(ADMIN_SESSION_KEY),

    logoutAdmin: () => {
        db.logEvent('INFO', 'Admin logged out.');
        localStorage.removeItem(ADMIN_SESSION_KEY);
    },

    // --- USER AUTH ---

    getCurrentUser: (): User | null => {
        return storageService.getUserSession();
    },

    loginUser: async (email: string, password: string, rememberMe: boolean): Promise<{ success: boolean; user?: User; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network

        if (!password) {
             return { success: false, error: "Password required" };
        }
        
        let user = db.getUserByEmail(email); 
        
        if (!email.includes('@')) {
             return { success: false, error: "Invalid email format." };
        }

        if (!user) {
             return { success: false, error: "Account not found. Please register." };
        }

        storageService.saveUserSession(user, rememberMe);
        db.logEvent('INFO', `User logged in: ${user.id}`);
        return { success: true, user };
    },

    registerUser: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!email.includes('@') || password.length < 6) {
            return { success: false, error: "Invalid email or password too short." };
        }

        const existing = db.getUserByEmail(email);
        if (existing) {
            return { success: false, error: "Email already registered." };
        }

        const newUser: User = {
            id: `u_${Math.random().toString(36).substr(2, 9)}`,
            isPremium: false,
            analysisCount: 0,
            subscriptionStatus: 'none'
        };

        db.ensureUser(newUser, email);
        storageService.saveUserSession(newUser, false); 
        db.logEvent('INFO', `New user registered: ${newUser.id}`);
        return { success: true, user: newUser };
    },

    logoutUser: () => {
        const u = storageService.getUserSession();
        if (u) db.logEvent('INFO', `User logged out: ${u.id}`);
        storageService.clearSession();
    },

    // --- REAL OAUTH FLOW IMPLEMENTATION ---

    getProviders: () => AUTH_CONFIG,

    /**
     * INITIATE OAUTH
     * Redirects the browser to the provider's official authorization page.
     * Uses the Authorization Code Flow.
     */
    initiateOAuth: (providerKey: string) => {
        const config = AUTH_CONFIG[providerKey];
        if (!config || !config.enabled || !config.clientId) {
            console.error("Provider not configured");
            return;
        }

        // 1. Generate and store state to prevent CSRF
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem(OAUTH_STATE_KEY, state);
        sessionStorage.setItem(OAUTH_PROVIDER_KEY, providerKey);

        // 2. Build Authorization URL
        const redirectUri = window.location.origin; // Callback to this app
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: config.scope,
            state: state,
            prompt: 'select_account' 
        });

        // 3. Redirect Browser
        console.log(`[Auth] Redirecting to ${providerKey}...`);
        window.location.href = `${config.authEndpoint}?${params.toString()}`;
    },

    /**
     * HANDLE CALLBACK
     * Processes the code returned from the provider.
     * 
     * NOTE: In a full architecture, this function would take the 'code' and send it 
     * to a backend API (e.g., /api/auth/callback) which would then exchange it 
     * for a token using the Client Secret.
     * 
     * Since this is a frontend-only environment, we handle the "Exchange" simulation here
     * to verify the flow mechanics without exposing a secret.
     */
    handleOAuthCallback: async (code: string, returnedState: string): Promise<{ success: boolean; user?: User; error?: string }> => {
        const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
        const providerKey = sessionStorage.getItem(OAUTH_PROVIDER_KEY);

        // Cleanup
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        sessionStorage.removeItem(OAUTH_PROVIDER_KEY);

        // 1. Validate State (CSRF Protection)
        if (!storedState || storedState !== returnedState) {
            return { success: false, error: "Security validation failed (State mismatch)." };
        }

        if (!providerKey || !AUTH_CONFIG[providerKey]) {
            return { success: false, error: "Unknown authentication provider." };
        }

        // 2. Simulate Backend Token Exchange
        // In a real backend: const token = await exchangeCodeForToken(code, clientSecret);
        // In a real backend: const profile = await fetchUserProfile(token);
        
        console.log(`[Auth] Processing callback from ${providerKey}. Code received.`);
        
        // Simulating the delay of a backend exchange
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. Get or Create User (Account Linking)
        // We simulate fetching a verified email from the provider
        const mockEmail = `user_${code.substring(0, 5)}@${providerKey.toLowerCase()}.com`;
        
        // Check if user exists (Linking)
        // Fix: Explicitly type 'user' as User | undefined to allow assignment of non-DbUser objects
        let user: User | undefined = db.getUserByEmail(mockEmail);
        
        if (!user) {
            // Create new user if not exists
            user = {
                id: `u_${providerKey.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
                isPremium: false,
                analysisCount: 0,
                subscriptionStatus: 'none'
            };
            db.ensureUser(user, mockEmail);
            db.logEvent('INFO', `New account created via ${providerKey}: ${user.id}`);
        } else {
            db.logEvent('INFO', `Existing user logged in via ${providerKey}: ${user.id}`);
        }

        // 4. Create Session
        if (user) {
            storageService.saveUserSession(user, true); // OAuth implies persistent session
        }
        
        return { success: true, user };
    }
};