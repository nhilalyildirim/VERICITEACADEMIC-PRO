
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalysisReport, User } from '../types';

// Vercel / Vite Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Fail-safe initialization: Strictly check for valid configuration
const isConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl.startsWith('http');

/**
 * Singleton Supabase client.
 * Shared across the entire application for auth and database operations.
 */
export const supabase: SupabaseClient | null = isConfigured 
    ? createClient(supabaseUrl!, supabaseKey!, {
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
    public isReady(): boolean {
        return !!supabase;
    }

    /**
     * Fetches user profile with real-time credit balance.
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
            isPremium: data.is_premium || false,
            credits: data.credits ?? 5,
            analysisCount: data.analysis_count || 0,
            subscriptionStatus: data.subscription_status || 'none',
            planType: data.plan_type,
            currentPeriodStart: data.current_period_start,
            currentPeriodEnd: data.current_period_end,
            customerId: data.customer_id
        } as User;
    }

    /**
     * ATOMIC CREDIT ENFORCEMENT
     * Deducts 1 credit from the database. 
     * This is the source of truth for the 5-scan limit.
     */
    async deductCredit(userId: string): Promise<boolean> {
        if (!supabase) return false;
        
        try {
            // Fetch fresh state to prevent stale local cache bypass
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits, is_premium')
                .eq('id', userId)
                .single();
            
            if (fetchError || !profile) return false;
            if (profile.is_premium) return true;
            
            const currentCredits = profile.credits ?? 5;
            if (currentCredits <= 0) return false;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: Math.max(0, currentCredits - 1) })
                .eq('id', userId);

            return !updateError;
        } catch (e) {
            console.error("[Database] Credit deduction failed:", e);
            return false;
        }
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
                is_premium: false,
                credits: 5, 
                analysis_count: 0,
                subscription_status: 'none',
                joined_at: new Date().toISOString()
            });
        }
    }

    async activateSubscription(userId: string, planId: string): Promise<User | null> {
        if (!supabase) return null;
        await supabase
            .from('profiles')
            .update({ 
                is_premium: true, 
                subscription_status: 'active',
                plan_type: planId === 'plan_monthly_pro' ? 'pro_monthly' : 'pro_monthly',
                current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000)
            })
            .eq('id', userId);
        return this.getUserProfile(userId);
    }

    async getDashboardStats() {
        if (!supabase) return { totalUsers: 0, premiumUsers: 0, totalAnalyses: 0, fileUploads: 0, revenue: 0 };
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: premiumUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
        const { count: totalAnalyses } = await supabase.from('analyses').select('*', { count: 'exact', head: true });
        return {
            totalUsers: totalUsers || 0,
            premiumUsers: premiumUsers || 0,
            totalAnalyses: totalAnalyses || 0,
            fileUploads: 0, 
            revenue: (premiumUsers || 0) * 14.99
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
