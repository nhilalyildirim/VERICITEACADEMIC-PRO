import { AnalysisReport, User, SubscriptionStatus } from '../types';

const DB_KEY = 'vericite_core_db_v1';

export interface DbUser {
    id: string;
    email: string;
    isPremium: boolean;
    joinedAt: number;
    lastLogin: number;
    analysisCount: number;
    // Subscription Data
    subscriptionId?: string;
    customerId?: string;
    subscriptionStatus: SubscriptionStatus;
    planType?: 'free' | 'pro_monthly';
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
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

export interface DbInvoice {
    id: string;
    userId: string;
    date: number;
    amount: number;
    status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
    billingPeriodStart: number;
    billingPeriodEnd: number;
}

interface DatabaseSchema {
    users: DbUser[];
    analyses: DbAnalysis[];
    logs: DbLog[];
    invoices: DbInvoice[];
}

// Seed data
const SEED_DATA: DatabaseSchema = {
    users: [
        { 
            id: 'u_demo_1', email: 'student@university.edu', isPremium: false, joinedAt: Date.now() - 5000000, lastLogin: Date.now() - 100000, analysisCount: 12,
            subscriptionStatus: 'none'
        },
        { 
            id: 'u_demo_2', email: 'researcher@lab.org', isPremium: true, joinedAt: Date.now() - 2000000, lastLogin: Date.now() - 50000, analysisCount: 45,
            subscriptionStatus: 'active', subscriptionId: 'sub_seed_123', planType: 'pro_monthly',
            currentPeriodStart: Date.now() - 1000000, currentPeriodEnd: Date.now() + 2000000
        }
    ],
    analyses: [
        { id: 'RPT-SEED-1', userId: 'u_demo_1', timestamp: Date.now() - 100000, trustScore: 92, citationCount: 15, verifiedCount: 14, hallucinatedCount: 0 },
        { id: 'RPT-SEED-2', userId: 'u_demo_1', timestamp: Date.now() - 80000, trustScore: 65, citationCount: 8, verifiedCount: 5, hallucinatedCount: 2 },
        { id: 'RPT-SEED-3', userId: 'u_demo_2', timestamp: Date.now() - 40000, trustScore: 100, citationCount: 22, verifiedCount: 22, hallucinatedCount: 0 }
    ],
    logs: [
        { id: 'l1', timestamp: Date.now() - 1000000, level: 'INFO', message: 'System initialized' }
    ],
    invoices: [
        { id: 'inv_demo_1', userId: 'u_demo_2', date: Date.now() - 2600000000, amount: 14.99, status: 'Paid', billingPeriodStart: Date.now() - 2600000000, billingPeriodEnd: Date.now() - 50000 },
        { id: 'inv_demo_2', userId: 'u_demo_2', date: Date.now() - 5000000, amount: 14.99, status: 'Paid', billingPeriodStart: Date.now() - 5000000, billingPeriodEnd: Date.now() + 2000000 }
    ]
};

class DatabaseService {
    private db: DatabaseSchema;

    constructor() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            try {
                this.db = JSON.parse(raw);
                if (!this.db.invoices) this.db.invoices = [];
            } catch {
                this.db = SEED_DATA;
                this.save();
            }
        } else {
            this.db = SEED_DATA;
            this.save();
        }
    }

    private save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.db));
    }

    // --- READS ---

    getUser(userId: string): DbUser | undefined {
        return this.db.users.find(u => u.id === userId);
    }

    getDashboardStats() {
        const totalUsers = this.db.users.length;
        const totalAnalyses = this.db.analyses.length;
        const premiumUsers = this.db.users.filter(u => u.isPremium).length;
        const freeUsers = totalUsers - premiumUsers;
        const revenue = premiumUsers * 14.99;
        const fileUploads = Math.floor(totalAnalyses * 0.4); 

        return { totalUsers, totalAnalyses, premiumUsers, freeUsers, revenue, fileUploads };
    }

    getRecentAnalyses(limit = 10): DbAnalysis[] {
        return [...this.db.analyses].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }

    getRecentLogs(limit = 10): DbLog[] {
        return [...this.db.logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    
    getUserInvoices(userId: string): DbInvoice[] {
        return (this.db.invoices || []).filter(i => i.userId === userId).sort((a, b) => b.date - a.date);
    }

    // --- WRITES ---

    ensureUser(user: User, email: string = 'unknown@user') {
        const existing = this.db.users.find(u => u.id === user.id);
        if (existing) {
            existing.lastLogin = Date.now();
            // Do not overwrite subscription data here, only transient auth data
            this.save();
        } else {
            this.db.users.push({
                id: user.id,
                email: email,
                isPremium: user.isPremium,
                joinedAt: Date.now(),
                lastLogin: Date.now(),
                analysisCount: user.analysisCount,
                subscriptionStatus: 'none'
            });
            this.save();
        }
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
    
    // --- SUBSCRIPTION LOGIC ---

    /**
     * Activates a subscription.
     * Acts as the single source of truth for "Upgrading" a user.
     * Simulates what a webhook handler would do.
     */
    activateSubscription(userId: string, planId: string): DbUser | null {
        const user = this.db.users.find(u => u.id === userId);
        if (!user) return null;

        const now = Date.now();
        const periodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days

        // 1. Update User State
        user.isPremium = true;
        user.subscriptionStatus = 'active';
        user.planType = 'pro_monthly';
        user.currentPeriodStart = now;
        user.currentPeriodEnd = periodEnd;
        user.subscriptionId = `sub_${now}_${Math.random().toString(36).substr(2,5)}`;
        user.customerId = user.customerId || `cus_${Math.random().toString(36).substr(2,8)}`;
        user.cancelAtPeriodEnd = false;

        // 2. Generate Invoice
        const invoice: DbInvoice = {
            id: `inv_${now}_${Math.random().toString(36).substr(2, 4)}`,
            userId,
            date: now,
            amount: 14.99,
            status: 'Paid',
            billingPeriodStart: now,
            billingPeriodEnd: periodEnd
        };
        
        if (!this.db.invoices) this.db.invoices = [];
        this.db.invoices.push(invoice);

        this.logEvent('INFO', `Subscription activated for ${userId} [Plan: ${planId}]. Invoice ${invoice.id} generated.`);
        this.save();
        return user;
    }

    logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
        this.db.logs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            level,
            message
        });
        if (this.db.logs.length > 200) this.db.logs = this.db.logs.slice(-200);
        this.save();
    }
}

export const db = new DatabaseService();