import { db } from './database';

/**
 * Subscription Service
 * 
 * Simulates Paddle.com payment flow and webhook handling.
 * Enforces strict backend-like processing for subscriptions.
 */

export const PADDLE_CONFIG = {
    vendorId: 123456, // Placeholder
    monthlyPlanId: 'plan_monthly_pro',
};

/**
 * Initiates the checkout process.
 * 
 * Rules:
 * 1. User must be authenticated (checked by caller).
 * 2. User must NOT have an active subscription.
 */
export const initiateCheckout = async (userId: string, planId: string): Promise<{ success: boolean, message?: string }> => {
    // 1. Backend Check: Is user already active?
    const user = db.getUser(userId);
    if (!user) {
        return { success: false, message: "User not found." };
    }
    
    if (user.subscriptionStatus === 'active') {
        return { success: false, message: "User already has an active subscription." };
    }

    console.log(`[Paddle] Initializing checkout for user: ${userId}, plan: ${planId}`);
    
    // 2. Simulate User filling out Paddle Overlay
    return new Promise((resolve) => {
        setTimeout(() => {
            // Random failure simulation (very rare)
            if (Math.random() > 0.99) {
                 resolve({ success: false, message: "Payment declined by bank." });
            } else {
                 console.log("[Paddle] Payment authorized.");
                 resolve({ success: true });
            }
        }, 1500);
    });
};

/**
 * Simulates the backend receiving a webhook from Paddle.
 * This is the ONLY place where the database is actually updated to "Premium".
 */
export const handlePaymentWebhook = async (userId: string, planId: string): Promise<boolean> => {
    console.log(`[Webhook] Processing 'subscription_created' for ${userId}`);
    
    // Delegate to database service to perform atomic update
    const updatedUser = db.activateSubscription(userId, planId);
    
    return !!updatedUser;
};