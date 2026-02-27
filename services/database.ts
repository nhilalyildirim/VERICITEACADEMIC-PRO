
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalysisReport, User } from '../types';

// Vercel / Vite Environment Variables resolution
// Explicitly check process.env (mapped in vite.config.ts) and import.meta.env (Vite standard)
const supabaseUrl = 
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  '';

const supabaseKey = 
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.SUPABASE_ANON_KEY ||
  '';

// Fail-safe initialization: Strictly check for valid configuration
const isConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('[VeriCite] Supabase not configured. URL:', !!supabaseUrl, 'KEY:', !!supabaseKey);
}

/**
 * Singleton Supabase client.
 * Shared across the entire application for auth and database operations.
 */
export const supabase: SupabaseClient | null = isConfigured 
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }) 
    : null;

export interface DbInvoice {
    id: string;
    date: string | number;
    amount: number;
    status: 'Paid' | 'Pending' | 'Failed';
}

class DatabaseService {
    /**
     * Checks if the cloud infrastructure is connected.
     * If false, the app gracefully degrades to Guest Mode (Local Storage).
     */
    public isReady(): boolean {
        return !!supabase;
    }

    /**
     * Fetches user profile.
     */
    async getUserProfile(userId: string): Promise<User | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error || !data) return null;

        return {
            id: data.id,
            email: data.email,
            analysisCount: data.analysis_count || 0
        } as User;
    }

    async recordAnalysis(report: AnalysisReport, userId: string): Promise<void> {
        if (!supabase) return;
        
        await supabase.from('analyses').insert({
            user_id: userId,
            trust_score: report.overallTrustScore,
            citation_count: report.totalCitations,
            verified_count: report.verifiedCount,
            hallucinated_count: report.hallucinatedCount,
            report_data: report,
            created_at: new Date().toISOString()
        });

        // Increment total usage counter
        const { data: profile } = await supabase.from('profiles').select('analysis_count').eq('id', userId).single();
        if (profile) {
            await supabase.from('profiles')
                .update({ analysis_count: (profile.analysis_count || 0) + 1 })
                .eq('id', userId);
        }
    }

    async ensureUserExists(user: { id: string, email: string }) {
        if (!supabase) return;

        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existing) {
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                analysis_count: 0,
                joined_at: new Date().toISOString()
            });
        }
    }

    async getDashboardStats() {
        if (!supabase) return { totalUsers: 0, premiumUsers: 0, totalAnalyses: 0, fileUploads: 0, revenue: 0 };
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: totalAnalyses } = await supabase.from('analyses').select('*', { count: 'exact', head: true });
        return {
            totalUsers: totalUsers || 0,
            premiumUsers: 0,
            totalAnalyses: totalAnalyses || 0,
            fileUploads: 0, 
            revenue: 0
        };
    }

    async getRecentAnalyses() {
        if (!supabase) return [];
        const { data } = await supabase
            .from('analyses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        return (data || []).map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            citationCount: a.citation_count,
            trustScore: a.trust_score,
            timestamp: a.created_at
        }));
    }

    async getRecentLogs() {
        if (!supabase) return [];
        const { data } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(20);
        return data || [];
    }
}

export const db = new DatabaseService();
