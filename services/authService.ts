
import { db } from './database';
import { User } from '../types';
import { storageService } from './storageService';

const ADMIN_USER = "NHYA";
const ADMIN_PASSWORD = "239486*";
const ADMIN_SESSION_KEY = "vericite_admin_token";

// OAuth Configuration (Simulated Environment Variables)
// In a real deployment, these would come from process.env
const AUTH_CONFIG = {
    GOOGLE: { enabled: true, clientId: 'mock_google_id' },
    MICROSOFT: { enabled: true, clientId: 'mock_ms_id' },
    ORCID: { enabled: true, clientId: 'mock_orcid_id' },
    GITHUB: { enabled: false, clientId: '' } // Example of disabled provider
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

    /**
     * Checks if a user session is active and valid.
     */
    getCurrentUser: (): User | null => {
        return storageService.getUserSession();
    },

    /**
     * Standard Email/Password Login
     */
    loginUser: async (email: string, password: string, rememberMe: boolean): Promise<{ success: boolean; user?: User; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network

        // In a real app, verify hash. Here we simulate success for demo.
        if (!password) {
             return { success: false, error: "Password required" };
        }
        
        let user = db.getUserByEmail(email); 
        
        // DEMO LOGIC: If user doesn't exist, we reject login (Standard SaaS behavior)
        // unless it's a specific demo account.
        
        if (!email.includes('@')) {
             return { success: false, error: "Invalid email format." };
        }

        if (!user) {
             // For UX demo smoothness, we won't block "wrong password" since we don't have a password DB.
             // We will treat this as a "User not found" error.
             return { success: false, error: "Account not found. Please register." };
        }

        storageService.saveUserSession(user, rememberMe);
        db.logEvent('INFO', `User logged in: ${user.id}`);
        return { success: true, user };
    },

    /**
     * User Registration
     */
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
        storageService.saveUserSession(newUser, false); // Default to no remember on register
        db.logEvent('INFO', `New user registered: ${newUser.id}`);
        return { success: true, user: newUser };
    },

    /**
     * OAuth Login Simulation
     */
    loginWithOAuth: async (provider: 'GOOGLE' | 'MICROSOFT' | 'ORCID'): Promise<{ success: boolean; user?: User; error?: string }> => {
        // 1. Check Config
        if (!AUTH_CONFIG[provider].enabled || !AUTH_CONFIG[provider].clientId) {
            return { success: false, error: "Provider configuration missing." };
        }

        console.log(`[Auth] Initiating ${provider} OAuth flow...`);
        
        // 2. Simulate Popup / Redirect Delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Simulate Callback Handling
        // In real world: verify code, exchange for token, get user profile.
        const mockEmail = `user_${Math.random().toString(36).substr(2,4)}@${provider.toLowerCase()}.com`;
        
        const newUser: User = {
            id: `u_${provider.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            isPremium: false,
            analysisCount: 0,
            subscriptionStatus: 'none'
        };

        // Upsert user (Login or Register logic for OAuth is often blended)
        db.ensureUser(newUser, mockEmail);
        storageService.saveUserSession(newUser, true); // OAuth usually implies persistent session
        
        db.logEvent('INFO', `User logged in via ${provider}: ${newUser.id}`);
        return { success: true, user: newUser };
    },

    logoutUser: () => {
        const u = storageService.getUserSession();
        if (u) db.logEvent('INFO', `User logged out: ${u.id}`);
        storageService.clearSession();
    },

    /**
     * Helper to expose config to UI components (to hide/show buttons)
     */
    getProviders: () => AUTH_CONFIG
};
