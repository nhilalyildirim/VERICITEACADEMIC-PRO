import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const TermsOfService: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white shadow-sm my-8 rounded-lg">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Terms of Service</h1>
      
      <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
        <p className="text-sm text-gray-500">Last Updated: March 1, 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Agreement to Terms</h2>
          <p>By accessing or using VeriCite Academic, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Use of Service</h2>
          <p>VeriCite Academic provides an AI-powered citation verification tool for academic purposes. You agree to use the service only for lawful purposes and in accordance with academic integrity standards.</p>
          <p className="mt-2">You explicitly agree NOT to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Use the service to generate fraudulent academic work or facilitate plagiarism.</li>
            <li>Reverse engineer, decompile, or disassemble any aspect of the service.</li>
            <li>Share your account credentials with third parties.</li>
            <li>Automate access to the service via bots or scrapers without API authorization.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Subscription and Payments</h2>
          <p>Services are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly basis.</p>
          <p>We use Paddle as our Merchant of Record. By subscribing, you agree to Paddle's Terms of Use in addition to ours.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Intellectual Property</h2>
          <p>The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of VeriCite Academic and its licensors.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Disclaimer of Warranties</h2>
          <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. VeriCite Academic makes no representations or warranties of any kind, express or implied, regarding the accuracy, reliability, or completeness of any verification results. Users are responsible for final verification of their academic work.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Limitation of Liability</h2>
          <p>In no event shall VeriCite Academic, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        </section>
      </div>
    </div>
  );
};