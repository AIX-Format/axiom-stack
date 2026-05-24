"use client";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-oled text-white p-8 max-w-3xl mx-auto font-mono">
      <h1 className="text-2xl text-neon-green mb-6">Privacy Policy</h1>
      <p className="text-gray-400 mb-4 text-sm">Last updated: May 17, 2026</p>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>AxiomID (&quot;the App&quot;) respects your privacy. This policy describes how we handle your information.</p>
        <h2 className="text-white text-lg mt-6">Information We Collect</h2>
        <p>When you connect your wallet, we collect your wallet address and Pi Network UID for the purpose of authentication and XP tracking.</p>
        <h2 className="text-white text-lg mt-6">How We Use Information</h2>
        <p>We use your information solely to operate the App, track reputation scores, and enable AI agent verification. We do not sell or share your data with third parties.</p>
        <h2 className="text-white text-lg mt-6">Data Storage</h2>
        <p>Your data is stored securely in our PostgreSQL database. You may request deletion of your data at any time by contacting us.</p>
        <h2 className="text-white text-lg mt-6">Contact</h2>
        <p>For questions, reach out via GitHub: <a href="https://github.com/Moeabdelaziz007" target="_blank" rel="noopener noreferrer" className="text-neon-green underline">Moeabdelaziz007 on GitHub</a></p>
      </div>
    </main>
  );
}
