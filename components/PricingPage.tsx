import React, { useState } from 'react';
import { Check, Loader2, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { initiateCheckout, simulatePaymentWebhook } from '../services/subscriptionService';
import { User } from '../types';

interface PricingPageProps {
  user: User | null;
  onBack: () => void;
  onSubscribeSuccess: () => void;
  onAuthReq: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ user, onBack, onSubscribeSuccess, onAuthReq }) => {
  const [loading, setLoading] = useState(false);

  const isPro = user?.subscriptionStatus === 'active';

  const handleSubscribe = async () => {
    // 1. Auth Guard
    if (!user) {
        onAuthReq();
        return;
    }

    // 2. Double Check Status
    if (isPro) {
        alert("You already have an active subscription.");
        return;
    }

    setLoading(true);
    try {
        // 3. Initiate Checkout
        // This simulates redirecting the user to a secure hosted checkout page
        const result = await initiateCheckout(user.id, 'monthly_pro');
        
        if (result.success) {
            // DEMO ONLY:
            // Since we can't actually leave the page to a real payment processor in this environment,
            // we will simulate the user completing the payment and the webhook firing.
            // In a real app, the user would be redirected: window.location.href = result.checkoutUrl;
            
            console.log("Redirecting to payment provider...");
            
            // Artificial delay to simulate user entering details on checkout page
            setTimeout(async () => {
                // 4. Simulate Backend Webhook
                await simulatePaymentWebhook(user.id, 'monthly_pro');
                
                setLoading(false);
                onSubscribeSuccess();
            }, 2000);
            
        } else {
            setLoading(false);
            alert(result.message || "Payment initialization failed. Please try again.");
        }
    } catch (e) {
        setLoading(false);
        console.error(e);
        alert("An unexpected error occurred connecting to the payment provider.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-600">Invest in your academic integrity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col opacity-75 hover:opacity-100 transition-opacity">
            <h3 className="text-xl font-bold text-slate-900">Free Tier</h3>
            <div className="mt-4 mb-8">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-600">
                    <Check className="w-5 h-5 text-emerald-500" /> 5 Citations Checks / Month
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                    <Check className="w-5 h-5 text-emerald-500" /> Basic Crossref Verification
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                    <Check className="w-5 h-5 text-emerald-500" /> Text Input Only
                </li>
            </ul>
            <button 
                onClick={onBack}
                className="w-full py-3 rounded-lg border-2 border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition-colors"
            >
                Continue Free
            </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900 rounded-2xl shadow-xl p-8 flex flex-col relative overflow-hidden text-white transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
            <h3 className="text-xl font-bold">Pro Academic</h3>
            <div className="mt-4 mb-8">
                <span className="text-4xl font-bold">$14.99</span>
                <span className="text-slate-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1"><Check className="w-3 h-3" /></div> Unlimited Verification
                </li>
                <li className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1"><Check className="w-3 h-3" /></div> File Uploads (.pdf, .docx)
                </li>
                <li className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1"><Check className="w-3 h-3" /></div> Deep Web Search Grounding
                </li>
                <li className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1"><Check className="w-3 h-3" /></div> PDF Report Export
                </li>
                <li className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-1"><Check className="w-3 h-3" /></div> Priority Support
                </li>
            </ul>
            
            {isPro ? (
                 <button 
                    disabled
                    className="w-full py-3 rounded-lg bg-green-600 text-white font-bold opacity-90 cursor-default flex justify-center items-center gap-2"
                >
                    <Check className="w-5 h-5" /> Current Plan
                </button>
            ) : (
                <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {!user && <Lock className="w-4 h-4" />}
                    {loading ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" /> Processing Securely...
                        </>
                    ) : (
                        !user ? 'Log in to Subscribe' : 'Subscribe Now'
                    )}
                </button>
            )}
            
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400 opacity-80">
                <ShieldCheck className="w-3 h-3" />
                <span>Secure Payment Processing</span>
            </div>
        </div>
      </div>
    </div>
  );
};
