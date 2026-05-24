"use client";

export default function Terms() {
  return (
    <main className="min-h-screen bg-oled text-white p-8 max-w-3xl mx-auto font-mono">
      <h1 className="text-2xl text-neon-green mb-6">Terms of Service</h1>
      <p className="text-gray-400 mb-4 text-sm">Last updated: May 17, 2026</p>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>By using AxiomID (&quot;the App&quot;), you agree to the following terms.</p>
        <h2 className="text-white text-lg mt-6">Use of Service</h2>
        <p>The App provides decentralized identity verification and reputation tracking. You may use it in compliance with applicable laws.</p>
        <h2 className="text-white text-lg mt-6">Wallet Connection</h2>
        <p>Connecting your Pi wallet is required for authentication. You are responsible for maintaining the security of your wallet.</p>
        <h2 className="text-white text-lg mt-6">AI Agent Verification</h2>
        <p>One AI agent per user may be verified. The verified agent may interact with ecosystem products on your behalf.</p>
        <h2 className="text-white text-lg mt-6">Limitation of Liability</h2>
        <p>The App is provided &quot;as is&quot; without warranties. We are not liable for damages arising from use of the service.</p>
        <h2 className="text-white text-lg mt-6">Changes</h2>
        <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
      </div>
    </main>
  );
}
