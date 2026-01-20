import { User } from '../types';

const GUEST_USAGE_KEY = 'vericite_guest_usage_v1';
const USER_KEY = 'vericite_user_session_v1';
export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export const storageService = {
    /**
     * Retrieves the persistent usage count for guest users.
     */
    getGuestUsage: (): number => {
        try {
            const val = localStorage.getItem(GUEST_USAGE_KEY);
            return val ? parseInt(val, 10) : 0;
        } catch { return 0; }
    },

    /**
     * Saves the usage count for guest users.
     */
    saveGuestUsage: (count: number) => {
        try {
            localStorage.setItem(GUEST_USAGE_KEY, count.toString());
        } catch {}
    },

    /**
     * Saves the authenticated user session.
     * @param user The user object
     * @param rememberMe If true, uses localStorage; otherwise sessionStorage
     */
    saveUserSession: (user: User, rememberMe: boolean) => {
        const payload = JSON.stringify({ ...user, _lastActive: Date.now() });
        
        // Clear any existing session to avoid conflicts
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, payload);
    },

    /**
     * Retrieves the current user session from storage.
     */
    getUserSession: (): User | null => {
        let raw = sessionStorage.getItem(USER_KEY);
        if (!raw) raw = localStorage.getItem(USER_KEY);
        
        if (!raw) return null;

        try {
            const data = JSON.parse(raw);
            const { _lastActive, ...user } = data;
            return user as User;
        } catch {
            return null;
        }
    },

    /**
     * Updates the _lastActive timestamp in the current storage.
     */
    updateLastActive: () => {
        let raw = sessionStorage.getItem(USER_KEY);
        let storage = sessionStorage;
        
        if (!raw) {
            raw = localStorage.getItem(USER_KEY);
            storage = localStorage;
        }

        if (raw) {
            try {
                const data = JSON.parse(raw);
                data._lastActive = Date.now();
                storage.setItem(USER_KEY, JSON.stringify(data));
            } catch {}
        }
    },

    /**
     * Gets the last active timestamp.
     */
    getLastActiveTime: (): number => {
        let raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
        if (!raw) return 0;
        try {
            return JSON.parse(raw)._lastActive || 0;
        } catch { return 0; }
    },

    /**
     * Clears user session.
     */
    clearSession: () => {
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
    }
};