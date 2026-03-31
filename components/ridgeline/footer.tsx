export default function RidgelineFooter() {
  return (
    <footer className="relative bg-[#1B3A4B] border-t border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Logo + Founder Story */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-[10px] px-2.5 py-1 rounded-xl rounded-bl-sm relative">
                RUUF
                <div className="absolute -bottom-1 left-0 w-2.5 h-2.5 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
              </div>
              <div className="bg-[#D4863E] text-white font-black text-[10px] px-2.5 py-1 rounded-full border border-white/20">
                PRO
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-[200px]">
              Built by a solo founder who saw great roofers losing jobs to competitors with better websites.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-xs text-white/30 hover:text-white/60 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-xs text-white/30 hover:text-white/60 transition-colors">Pricing</a></li>
              <li><a href="#demo" className="text-xs text-white/30 hover:text-white/60 transition-colors">Demo</a></li>
              <li><a href="#faq" className="text-xs text-white/30 hover:text-white/60 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="mailto:hello@ruufpro.com" className="text-xs text-white/30 hover:text-white/60 transition-colors">Contact</a></li>
              <li><a href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">Log In</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* For Roofers */}
          <div>
            <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-4">For Roofers</h4>
            <ul className="space-y-2.5">
              <li><a href="/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Free Website</a></li>
              <li><a href="/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Estimate Widget</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} RuufPro. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Satellite data powered by Google Solar API
          </p>
        </div>
      </div>
    </footer>
  );
}
