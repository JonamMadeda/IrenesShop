import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Package2,
  ReceiptText,
  TrendingUp,
  Database,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    title: "Sales Recording",
    description: "Streamlined interface for recording every transaction with precision and speed.",
    icon: CreditCard,
    tone: "blue",
  },
  {
    title: "Inventory Capturing",
    description: "Digitize your stock management with seamless inventory capturing and tracking.",
    icon: Package2,
    tone: "emerald",
  },
  {
    title: "Debt Sales Tracking",
    description: "Specifically track items sold on credit and manage customer payment commitments.",
    icon: ReceiptText,
    tone: "amber",
  },
  {
    title: "System Reports",
    description: "Generate professional operational reports to audit your shop performance.",
    icon: BarChart3,
    tone: "indigo",
  },
];

const kenyaShopBackground =
  "https://images.pexels.com/photos/28505434/pexels-photo-28505434.jpeg?cs=srgb&dl=pexels-natalia-msungu-1576571204-28505434.jpg&fm=jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Refined Hero Section */}
      <section
        className="relative min-h-[90vh] flex flex-col overflow-hidden border-b border-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url("${kenyaShopBackground}")` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.7)),linear-gradient(115deg,rgba(255,255,255,0.95),rgba(255,255,255,0.2))]" />
        
        {/* Navbar with 'Open system' and 'Sign In' */}
        <div className="relative mx-auto w-full max-w-7xl px-6 pt-8 sm:px-8">
          <nav className="flex items-center justify-between rounded-3xl border border-white/50 bg-white/70 px-6 py-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-900 rounded-lg text-white group-hover:scale-105 transition-transform">
                <TrendingUp size={18} />
              </div>
              <span className="text-xl font-bold tracking-tighter text-slate-900 uppercase">
                IRENE&apos;S SHOP
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="hidden sm:inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-800 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-800 hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-900/10"
              >
                Open system
                <ArrowRight size={14} />
              </Link>
            </div>
          </nav>
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 mx-auto grid max-w-7xl gap-16 px-6 py-12 sm:px-8 md:grid-cols-2 md:items-center">
          <div className="max-w-2xl">
            <div className="p-2 md:p-4">
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-100/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-800">
                Workspace Portal
              </p>
              <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.1]">
                Sales, Debt & <br />
                Inventory. <span className="text-blue-700 underline decoration-blue-100 decoration-8 underline-offset-8">Managed.</span>
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-slate-800 font-semibold bg-white/10 backdrop-blur-[2px] rounded-lg">
                Capture the pulse of Irene&apos;s Shop. A dedicated workspace for recording sales, tracking items sold in debt, and generating professional shop reports.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-700 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-800 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-1 active:translate-y-0 shadow-xl shadow-blue-900/10"
                >
                  Open system
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-slate-800 transition-all hover:bg-slate-50 hover:border-slate-400 group"
                >
                  View Areas
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Preview Visual with reduced font weights */}
          <div className="relative hidden md:block group">
            <div className="relative rounded-[40px] border border-white/50 bg-white/40 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition-transform hover:scale-[1.01] duration-500">
              <div className="grid gap-6">
                <div className="rounded-3xl bg-white/90 p-8 border border-white shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Live Status</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Inventory Tracking", status: "Active" },
                      { label: "Sales Recording", status: "Ready" },
                      { label: "Debt Management", status: "Online" }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-3xl bg-blue-700 p-6 text-white shadow-xl shadow-blue-900/10">
                  <div className="flex items-center gap-3">
                    <Database size={20} className="text-white" />
                    <p className="text-sm font-bold tracking-tight">Cloud Database Active</p>
                  </div>
                  <p className="mt-3 text-xs text-blue-50 leading-relaxed font-semibold">
                    All transactions recorded are synced to Irene&apos;s shop secure ledger in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with refined weights */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
             Core Operations
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
             Everything you need for shop management.
          </h2>
          <p className="mt-6 text-xl text-slate-400 font-semibold italic">
            Essential tools for recording daily shop activities and reviewing performance.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((card) => {
            const Icon = card.icon;
            
            const tones = {
              blue: "border-blue-100 bg-blue-50/50 text-blue-700",
              emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
              amber: "border-amber-100 bg-amber-50/50 text-amber-700",
              indigo: "border-indigo-100 bg-indigo-50/50 text-indigo-700",
            };

            return (
              <div
                key={card.title}
                className="group rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[card.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900 uppercase tracking-tight">{card.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-500 font-semibold">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="mx-auto max-w-7xl px-6 pb-20 sm:px-8">
        <div className="rounded-[40px] bg-blue-700 p-12 md:p-20 text-center relative overflow-hidden group border border-blue-600 shadow-2xl">
          {/* Background Highlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/10 blur-[120px] rounded-full group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 leading-tight">
               Ready to manage <br className="hidden md:block"/>IRENE&apos;S SHOP?
            </h2>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-sm font-bold uppercase tracking-widest text-blue-700 transition-all hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
            >
              Open system
              <ArrowRight size={18} />
            </Link>
            
            <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100/60">
               Official Admin Workspace • 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
