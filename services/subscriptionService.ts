import { db } from './database';

/**
 * Subscription Service
 * 
 * Simulates Secure Payment Gateway flow (e.g., Paddle, Stripe).
 * Enforces strict backend-like processing for subscriptions.
 */

// Mock Configuration
export const PAYMENT_CONFIG = {
    vendorId: 'mock_vendor_id', 
    monthlyPlanId: 'plan_monthly_pro',
};

/**
 * Initiates the checkout process.
 * 
 * Rules:
 * 1. User must be authenticated (checked by caller).
 * 2. User must NOT have an active subscription.
 * 3. Does NOT activate subscription; only returns checkout URL/Status.
 */
export const initiateCheckout = async (userId: string, planId: string): Promise<{ success: boolean, checkoutUrl?: string, message?: string }> => {
    // 1. Backend Check: Is user already active?
    const user = db.getUser(userId);
    if (!user) {
        return { success: false, message: "User session invalid." };
    }
    
    if (user.subscriptionStatus === 'active') {
        return { success: false, message: "Subscription already active." };
    }

    console.log(`[PaymentGateway] Initializing secure checkout for user: ${userId}, plan: ${planId}`);
    
    // 2. Simulate Network Request to Payment Provider
    return new Promise((resolve) => {
        setTimeout(() => {
            // Random failure simulation (rare)
            if (Math.random() > 0.99) {
                 resolve({ success: false, message: "Gateway connection timeout." });
            } else {
                 console.log("[PaymentGateway] Checkout session created.");
                 // In a real app, this would be the specific URL to the hosted checkout page.
                 resolve({ success: true, checkoutUrl: 'https://secure-checkout.example.com/pay/...' });
            }
        }, 1200);
    });
};

/**
 * Simulates the backend receiving a webhook from the Payment Provider.
 * This is the ONLY place where the database is actually updated to "Premium".
 * 
 * NOTE: In a production environment, this function would reside on a secured Node/Python server
 * and would be triggered by an HTTP POST from Paddle/Stripe.
 */
export const simulatePaymentWebhook = async (userId: string, planId: string): Promise<boolean> => {
    console.log(`[Webhook] Server received 'payment_succeeded' event for ${userId}`);
    
    // Delegate to database service to perform atomic update (Source of Truth)
    const updatedUser = db.activateSubscription(userId, planId);
    
    return !!updatedUser;
};
