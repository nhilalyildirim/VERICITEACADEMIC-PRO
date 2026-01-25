import { AnalysisReport, User, SubscriptionStatus } from '../types';

const DB_KEY = 'vericite_core_db_v1';
const GUEST_ID_KEY = 'vericite_anon_id';

// Add missing DbInvoice interface
export interface DbInvoice {
    id: string;
    userId: string;
    date: number;
    amount: number;
    status: 'Paid' | 'Pending' | 'Failed';
}

export interface DbUser {
    id: string;
    email?: string;
    isPremium: boolean;
    joinedAt: number;
    lastLogin: number;
    analysisCount: number;
    subscriptionStatus: SubscriptionStatus;
    planType?: 'free' | 'pro_monthly';
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
}

export interface DbAnalysis {
    id: string;
    userId: string;
    timestamp: number;
    trustScore: number;
    citationCount: number;
    verifiedCount: number;
    hallucinatedCount: number;
}

export interface DbLog {
    id: string;
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

interface DatabaseSchema {
    users: DbUser[];
    analyses: DbAnalysis[];
    logs: DbLog[];
    invoices: DbInvoice[]; // Added invoices to schema
}

class DatabaseService {
    private db: DatabaseSchema;

    constructor() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            try {
                this.db = JSON.parse(raw);
                // Ensure invoices exist in migrated data
                if (!this.db.invoices) this.db.invoices = [];
            } catch {
                this.db = { users: [], analyses: [], logs: [], invoices: [] };
            }
        } else {
            this.db = { users: [], analyses: [], logs: [], invoices: [] };
        }
    }

    private save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.db));
    }

    /**
     * Ensures an anonymous user ID exists for the browser and tracks it in "DB".
     * This simulates server-side ID tracking.
     */
    getOrCreateGuestId(): string {
        let gid = localStorage.getItem(GUEST_ID_KEY);
        if (!gid) {
            gid = `anon_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(GUEST_ID_KEY, gid);
        }
        
        // Ensure guest exists in the DB records
        if (!this.db.users.find(u => u.id === gid)) {
            this.db.users.push({
                id: gid!,
                isPremium: false,
                joinedAt: Date.now(),
                lastLogin: Date.now(),
                analysisCount: 0,
                subscriptionStatus: 'none'
            });
            this.save();
        }
        return gid!;
    }

    getUser(userId: string): DbUser | undefined {
        return this.db.users.find(u => u.id === userId);
    }
    
    getUserByEmail(email: string): DbUser | undefined {
        return this.db.users.find(u => u.email === email);
    }

    getAnalysisCount(userId: string): number {
        const u = this.getUser(userId);
        return u ? u.analysisCount : 0;
    }

    // Fix: Implement getUserInvoices
    getUserInvoices(userId: string): DbInvoice[] {
        return this.db.invoices.filter(inv => inv.userId === userId);
    }

    // Fix: Implement activateSubscription and generate a mock invoice
    activateSubscription(userId: string, planId: string): DbUser | undefined {
        const user = this.db.users.find(u => u.id === userId);
        if (user) {
            user.isPremium = true;
            user.subscriptionStatus = 'active';
            user.planType = 'pro_monthly';
            user.currentPeriodStart = Date.now();
            user.currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
            
            this.db.invoices.push({
                id: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                userId: userId,
                date: Date.now(),
                amount: 14.99,
                status: 'Paid'
            });
            
            this.logEvent('INFO', `Subscription activated for user ${userId}`);
            this.save();
        }
        return user;
    }

    // Fix: Implement getDashboardStats for AdminPanel
    getDashboardStats() {
        const premiumUsers = this.db.users.filter(u => u.isPremium).length;
        const totalRevenue = this.db.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        return {
            totalUsers: this.db.users.length,
            premiumUsers: premiumUsers,
            totalAnalyses: this.db.analyses.length,
            fileUploads: Math.round(this.db.analyses.length * 0.45), // Simulated stat
            revenue: totalRevenue
        };
    }

    // Fix: Implement getRecentAnalyses for AdminPanel
    getRecentAnalyses() {
        return [...this.db.analyses]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }

    // Fix: Implement getRecentLogs for AdminPanel
    getRecentLogs(): DbLog[] {
        return [...this.db.logs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50);
    }

    ensureUser(user: User, email?: string) {
        let existing = this.db.users.find(u => u.id === user.id);
        if (existing) {
            existing.lastLogin = Date.now();
            existing.analysisCount = Math.max(existing.analysisCount, user.analysisCount);
        } else {
            this.db.users.push({
                id: user.id,
                email: email,
                isPremium: user.isPremium,
                joinedAt: Date.now(),
                lastLogin: Date.now(),
                analysisCount: user.analysisCount,
                subscriptionStatus: user.subscriptionStatus
            });
        }
        this.save();
    }

    recordAnalysis(report: AnalysisReport, userId: string) {
        this.db.analyses.push({
            id: report.id,
            userId: userId,
            timestamp: report.timestamp,
            trustScore: report.overallTrustScore,
            citationCount: report.totalCitations,
            verifiedCount: report.verifiedCount,
            hallucinatedCount: report.hallucinatedCount
        });

        const user = this.db.users.find(u => u.id === userId);
        if (user) {
            user.analysisCount += 1;
        }
        this.save();
    }

    logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
        this.db.logs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            level,
            message
        });
        if (this.db.logs.length > 500) this.db.logs = this.db.logs.slice(-500);
        this.save();
    }
}

export const db = new DatabaseService();