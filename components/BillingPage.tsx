import React from 'react';
import { User } from '../types';
import { DbInvoice } from '../services/database';
import { Download, CreditCard, CheckCircle, Clock, AlertTriangle, ArrowLeft, Calendar } from 'lucide-react';

interface BillingPageProps {
    user: User;
    invoices: DbInvoice[];
    onBack: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ user, invoices, onBack }) => {
    // Derived state from User object
    const isActive = user.subscriptionStatus === 'active';
    const planName = isActive ? 'Pro Academic' : 'Free Tier';
    const amount = isActive ? '$14.99' : '$0.00';
    
    const nextBillingDate = user.currentPeriodEnd 
        ? new Date(user.currentPeriodEnd).toLocaleDateString() 
        : 'N/A';
    
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Payments</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-500" /> Current Subscription
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500">Plan</p>
                            <p className="font-medium text-gray-900 text-lg">{planName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium text-gray-900 text-lg">{amount} <span className="text-sm text-gray-400 font-normal">/ month</span></p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className={`font-medium flex items-center gap-2 mt-1 ${isActive ? 'text-emerald-600' : 'text-gray-600'}`}>
                                {isActive ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                <span className="capitalize">{user.subscriptionStatus === 'none' ? 'Free' : user.subscriptionStatus}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Next Billing Date</p>
                            <div className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4 text-gray-400" /> {nextBillingDate}
                            </div>
                        </div>
                    </div>
                    {isActive && (
                        <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                            <button className="text-blue-600 text-sm font-medium hover:underline">Update Payment Method</button>
                            <button className="text-red-600 text-sm font-medium hover:underline">Cancel Subscription</button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Payment Provider</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded shadow-sm flex items-center justify-center font-bold text-xs border">Paddle</div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Paddle.com</p>
                            <p className="text-xs text-gray-500">Merchant of Record</p>
                        </div>
                    </div>
                    {user.customerId && (
                         <div className="mt-3 pt-3 border-t border-slate-200">
                             <p className="text-xs text-gray-400">Customer ID</p>
                             <p className="text-xs font-mono text-gray-600">{user.customerId}</p>
                         </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Invoice History</h3>
                </div>
                {invoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No invoices found.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-gray-500 font-medium">Date</th>
                                <th className="px-6 py-3 text-gray-500 font-medium">Amount</th>
                                <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                                <th className="px-6 py-3 text-gray-500 font-medium text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">${inv.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                                            ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                              inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {inv.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                                            {inv.status === 'Pending' && <Clock className="w-3 h-3" />}
                                            {inv.status === 'Failed' && <AlertTriangle className="w-3 h-3" />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Download PDF">
                                            <Download className="w-4 h-4 ml-auto" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};