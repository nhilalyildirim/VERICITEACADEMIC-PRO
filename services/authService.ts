
import { db, supabase } from './database';
import { User } from '../types';
import { storageService } from './storageService';

export const authService = {
    isAdminAuthenticated: (): boolean => {
        return !!localStorage.getItem("vericite_admin_token");
    },

    getCurrentUser: (): User | null => storageService.getUserSession(),

    signInWithGoogle: async () => {
        if (!supabase) throw new Error("Supabase client is not initialized. Please configure your environment variables.");
        
        // Use origin to ensure the redirect matches the current domain (e.g. vericite.vercel.app or localhost)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                },
            }
        });
        if (error) throw error;
    },

    handleAuthRedirect: async (): Promise<User | null> => {
        if (!supabase) return null;

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return null;
        
        if (session?.user) {
            const authUser = session.user;
            // Atomic user sync
            await db.ensureUserExists({ id: authUser.id, email: authUser.email || '' });
            
            const profile = await db.getUserProfile(authUser.id);
            if (profile) {
                storageService.saveUserSession(profile, true);
                return profile;
            }
        }
        return null;
    },

    loginAdmin: async (username: string, pass: string): Promise<boolean> => {
        if (username === 'admin' && pass === 'vericite2026') {
            localStorage.setItem("vericite_admin_token", "admin_" + Date.now());
            return true;
        }
        return false;
    },

    logoutAdmin: () => {
        localStorage.removeItem("vericite_admin_token");
    },

    signInWithEmail: async (email: string, password: string): Promise<User | null> => {
        if (!supabase) throw new Error("Cloud service not connected.");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            await db.ensureUserExists({ id: data.user.id, email: data.user.email || '' });
            const profile = await db.getUserProfile(data.user.id);
            if (profile) {
                storageService.saveUserSession(profile, true);
                return profile;
            }
        }
        return null;
    },

    signUpWithEmail: async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
        if (!supabase) throw new Error("Cloud service not connected.");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
            return { needsConfirmation: true };
        }
        if (data.user && data.session) {
            await db.ensureUserExists({ id: data.user.id, email: data.user.email || '' });
            const profile = await db.getUserProfile(data.user.id);
            if (profile) storageService.saveUserSession(profile, true);
            return { needsConfirmation: false };
        }
        return { needsConfirmation: false };
    },

    logoutUser: async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        storageService.clearSession();
    }
};
