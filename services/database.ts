import { AnalysisReport, User } from '../types';

const DB_KEY = 'vericite_core_db_v1';

export interface DbUser {
    id: string;
    email: string;
    isPremium: boolean;
    joinedAt: number;
    lastLogin: number;
    analysisCount: number;
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
}

interface DatabaseSchema {
    users: DbUser[];
    analyses: DbAnalysis[];
    logs: DbLog[];
    invoices: DbInvoice[];
}

// Seed data to ensure the admin panel isn't completely empty initially
const SEED_DATA: DatabaseSchema = {
    users: [
        { id: 'u_demo_1', email: 'student@university.edu', isPremium: false, joinedAt: Date.now() - 5000000, lastLogin: Date.now() - 100000, analysisCount: 12 },
        { id: 'u_demo_2', email: 'researcher@lab.org', isPremium: true, joinedAt: Date.now() - 2000000, lastLogin: Date.now() - 50000, analysisCount: 45 }
    ],
    analyses: [
        { id: 'RPT-SEED-1', userId: 'u_demo_1', timestamp: Date.now() - 100000, trustScore: 92, citationCount: 15, verifiedCount: 14, hallucinatedCount: 0 },
        { id: 'RPT-SEED-2', userId: 'u_demo_1', timestamp: Date.now() - 80000, trustScore: 65, citationCount: 8, verifiedCount: 5, hallucinatedCount: 2 },
        { id: 'RPT-SEED-3', userId: 'u_demo_2', timestamp: Date.now() - 40000, trustScore: 100, citationCount: 22, verifiedCount: 22, hallucinatedCount: 0 }
    ],
    logs: [
        { id: 'l1', timestamp: Date.now() - 1000000, level: 'INFO', message: 'System initialized' },
        { id: 'l2', timestamp: Date.now() - 50000, level: 'INFO', message: 'Database migration applied' }
    ],
    invoices: [
        { id: 'inv_demo_1', userId: 'u_demo_2', date: Date.now() - 2600000000, amount: 14.99, status: 'Paid' },
        { id: 'inv_demo_2', userId: 'u_demo_2', date: Date.now() - 5000000, amount: 14.99, status: 'Paid' }
    ]
};

class DatabaseService {
    private db: DatabaseSchema;

    constructor() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            try {
                this.db = JSON.parse(raw);
                if (!this.db.invoices) this.db.invoices = []; // Migration safety
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

    // --- METRICS & READS ---

    getDashboardStats() {
        const totalUsers = this.db.users.length;
        const totalAnalyses = this.db.analyses.length;
        const premiumUsers = this.db.users.filter(u => u.isPremium).length;
        const freeUsers = totalUsers - premiumUsers;
        
        // Calculate mock revenue based on premium users * $14.99
        const revenue = premiumUsers * 14.99;

        // Calculate file uploads (approximated from analyses for demo purposes)
        const fileUploads = Math.floor(totalAnalyses * 0.4); 

        return {
            totalUsers,
            totalAnalyses,
            premiumUsers,
            freeUsers,
            revenue,
            fileUploads
        };
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
            existing.isPremium = user.isPremium;
            this.save();
        } else {
            this.db.users.push({
                id: user.id,
                email: email,
                isPremium: user.isPremium,
                joinedAt: Date.now(),
                lastLogin: Date.now(),
                analysisCount: user.analysisCount
            });
            this.save();
        }
    }

    recordAnalysis(report: AnalysisReport, userId: string) {
        // Add to analyses table
        this.db.analyses.push({
            id: report.id,
            userId: userId,
            timestamp: report.timestamp,
            trustScore: report.overallTrustScore,
            citationCount: report.totalCitations,
            verifiedCount: report.verifiedCount,
            hallucinatedCount: report.hallucinatedCount
        });

        // Update user record
        const user = this.db.users.find(u => u.id === userId);
        if (user) {
            user.analysisCount += 1;
        }

        this.save();
    }
    
    createInvoice(userId: string, amount: number) {
        const invoice: DbInvoice = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            userId,
            date: Date.now(),
            amount,
            status: 'Paid'
        };
        if (!this.db.invoices) this.db.invoices = [];
        this.db.invoices.push(invoice);
        this.save();
        return invoice;
    }

    logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
        this.db.logs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            level,
            message
        });
        
        // Keep logs from growing infinitely
        if (this.db.logs.length > 200) {
            this.db.logs = this.db.logs.slice(-200);
        }
        
        this.save();
    }
}

export const db = new DatabaseService();