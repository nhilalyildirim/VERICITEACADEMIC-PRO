/**
 * Admin Authentication Service
 * 
 * Simulates server-side authentication using SHA-256 hashing.
 * In a real environment, this validation would happen on the server.
 */

// SHA-256 hash of the password "239486*"
const ADMIN_HASH = "e6b60333216ca8f7422f6d037000d8926066291a45749f7e80d467776510368a";
const ADMIN_USER = "NHYA";
const SESSION_KEY = "vericite_admin_token";

/**
 * Hashes a string using SHA-256 (Web Crypto API)
 */
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
    /**
     * Attempt to login. Returns true if credentials match.
     */
    login: async (username: string, password: string): Promise<boolean> => {
        // Simulate network delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 800));

        if (username !== ADMIN_USER) return false;

        const hash = await sha256(password);
        if (hash === ADMIN_HASH) {
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