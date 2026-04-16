import { Metadata } from "next";
import RidgelineFooter from "@/components/ridgeline/footer";

export const metadata: Metadata = {
  title: "Cookie Policy — RuufPro",
  description: "Cookie Policy for RuufPro, operated by FEEDBACK FOOTPRINT LLC.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F2A37]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-6 py-4 md:px-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-[10px] px-2.5 py-1 rounded-xl rounded-bl-sm relative">
              RUUF
              <div className="absolute -bottom-1 left-0 w-2.5 h-2.5 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
            </div>
            <div className="bg-[#D4863E] text-white font-black text-[10px] px-2.5 py-1 rounded-full border border-white/20">
              PRO
            </div>
          </a>
          <a href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            &larr; Back to Home
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl md:text-4xl font-bold text-white mb-2">
          Cookie Policy
        </h1>
        <p className="text-sm text-white/40 mb-12">Last updated April 13, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed [&_h2]:font-[family-name:var(--font-sora)] [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-white/90 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_a]:text-[#D4863E] [&_a]:underline [&_ul]:space-y-1 [&_ul]:ml-4 [&_li]:text-white/60">

          <p>
            This Cookie Policy explains how FEEDBACK FOOTPRINT LLC (doing business as RuufPro) (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar tracking technologies when you visit our website at ruufpro.com or any contractor website hosted on our platform.
          </p>

          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the site. Cookies may be &quot;session&quot; cookies (deleted when you close your browser) or &quot;persistent&quot; cookies (remain until they expire or you delete them).
          </p>

          <h2>How We Use Cookies</h2>

          <h3>Essential cookies</h3>
          <p>Required for the site to function. These handle authentication, session management, and security. You cannot opt out of essential cookies.</p>
          <ul>
            <li><strong className="text-white/90">Authentication</strong> — Keeps you logged into your dashboard (Supabase auth tokens)</li>
            <li><strong className="text-white/90">Security</strong> — Prevents cross-site request forgery and protects your account</li>
          </ul>

          <h3>Functional cookies</h3>
          <p>Remember your preferences and choices to provide a better experience.</p>
          <ul>
            <li><strong className="text-white/90">Chat history</strong> — Stores Riley AI chatbot conversation state (localStorage)</li>
            <li><strong className="text-white/90">Cookie consent</strong> — Remembers that you accepted this cookie notice</li>
          </ul>

          <h3>Analytics cookies</h3>
          <p>Help us understand how visitors use our site so we can improve it.</p>
          <ul>
            <li><strong className="text-white/90">Vercel Analytics</strong> — Collects anonymous usage data (page views, performance metrics). No personally identifiable information is collected.</li>
          </ul>

          <h3>Third-party cookies</h3>
          <p>Set by services we use to provide features on our site.</p>
          <ul>
            <li><strong className="text-white/90">Google Maps Platform</strong> — Used in our estimate widget to display satellite imagery and process address lookups. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
            <li><strong className="text-white/90">Stripe</strong> — Used for payment processing. Subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
          </ul>

          <h2>How to Control Cookies</h2>
          <p>
            You can control and manage cookies in several ways:
          </p>
          <ul>
            <li><strong className="text-white/90">Browser settings</strong> — Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies may prevent you from using parts of our site.</li>
            <li><strong className="text-white/90">Our cookie banner</strong> — When you first visit our site, you can choose to accept cookies. Your preference is stored locally.</li>
          </ul>
          <p>
            For more information about cookies and how to manage them, visit{" "}
            <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">allaboutcookies.org</a>.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date at the top of this page.
          </p>

          <h2>Contact Us</h2>
          <p>If you have questions about our use of cookies, contact us at:</p>
          <p>
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a><br />
            FEEDBACK FOOTPRINT LLC<br />
            d/b/a RuufPro<br />
            8734 54th Ave E<br />
            Bradenton, FL 34211
          </p>

        </div>
      </main>

      <RidgelineFooter />
    </div>
  );
}
