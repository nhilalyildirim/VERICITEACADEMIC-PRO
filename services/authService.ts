/**
 * Admin Authentication Service
 * 
 * Simulates server-side authentication.
 * Updated to use direct plaintext comparison for specific admin credentials.
 */

const ADMIN_USER = "NHYA";
const ADMIN_PASSWORD = "239486*";
const SESSION_KEY = "vericite_admin_token";

export const authService = {
    /**
     * Attempt to login. Returns true if credentials match.
     */
    login: async (username: string, password: string): Promise<boolean> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Direct plaintext comparison
        if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
            // Generate a mock session token
            const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2)}`;
            localStorage.setItem(SESSION_KEY, token);
            return true;
        }
        return false;
    },

    /**
     * Check if a valid session exists.
     */
    isAuthenticated: (): boolean => {
        const token = localStorage.getItem(SESSION_KEY);
        // In a real app, we would validate the token signature here.
        return !!token;
    },

    /**
     * Clear session.
     */
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    }
};