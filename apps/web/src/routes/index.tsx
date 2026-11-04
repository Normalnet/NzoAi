import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  Zap,
  Shield,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe,
  Code,
  Users,
  ChevronRight,
  Cpu,
  Smartphone,
  CreditCard,
  Building2,
  Layers,
  Activity,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-[#800020] selection:text-white">
      {/* Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center font-black shadow-md shadow-[#800020]/20">
              N
            </div>
            <span className="font-extrabold tracking-tight">NzoAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#models" className="hover:text-foreground transition-colors">AI Models</a>
            <a href="#solutions" className="hover:text-foreground transition-colors">RAG Training</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs text-white bg-[#800020] hover:bg-[#800020]/90 font-semibold shadow-sm">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 text-xs font-semibold text-foreground shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Next-Generation Autonomous Customer Support</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-[#800020] font-bold">Multi-Model Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground">
          Autonomous AI Customer Support <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#800020] via-rose-600 to-amber-600">
            Trained on Your Enterprise Data
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Ingest your documents, website links, and FAQs with PostgreSQL pgvector. Deflect up to 80% of support volume, switch AI intelligence engines dynamically, and escalate complex inquiries to human agents in realtime.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-white bg-[#800020] hover:bg-[#800020]/90 font-bold px-8 shadow-md shadow-[#800020]/20 gap-2">
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/admin/overview">
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-6 gap-2">
              <Bot className="w-4 h-4 text-[#800020]" />
              <span>Explore Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Floating Chat Mockup */}
        <div className="pt-10 max-w-3xl mx-auto">
          <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xl relative overflow-hidden text-left">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#800020] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  N
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>Acme Concierge</span>
                    <Badge variant="outline" className="text-[10px] py-0 font-normal border-emerald-500/30 text-emerald-600">
                      Online
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Powered by NzoGem 3 Cool • 0.3s response</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
            </div>

            {/* Conversation Preview */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-end">
                <div className="bg-[#800020] text-white p-3 rounded-2xl rounded-tr-xs max-w-md shadow-xs">
                  Hi! Can your platform ingest our 80-page product manual and book demo appointments for our sales team?
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  AI
                </div>
                <div className="bg-muted/50 border p-3.5 rounded-2xl rounded-tl-xs max-w-lg text-foreground space-y-2">
                  <p>
                    Yes, exactly! NzoAI extracts knowledge from your PDFs, Word documents, and live websites using pgvector HNSW semantic search.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When visitors request a demo, the agent dynamically renders an appointment scheduler or lead form right inside the chat.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" />
                      Lead Form Rendered
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      <Zap className="w-3 h-3" />
                      Live WebSocket Escalation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Model Showcase (Addressing user's interest in Gemini, OpenAI, Claude) */}
      <section id="models" className="py-20 border-t bg-muted/15 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 uppercase text-[10px] tracking-wider font-bold">
              White-label AI Engine Stack
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Choose the Best Model for Every Conversation
            </h2>
            <p className="text-sm text-muted-foreground">
              Never get locked into a single AI provider. Tenants can switch foundation engines dynamically with 1 click right from their settings dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Model 1: NzoGem 3 Cool */}
            <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs hover:border-foreground/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">NzoGem 3 Cool</span>
                <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/30 text-[10px]">
                  Google Gemini 2.0 Flash
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ultra-low latency generation with advanced contextual comprehension. Perfect for rapid customer deflection and real-time chat bubbles.
              </p>
              <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t flex items-center justify-between">
                <span>Speed: &lt; 350ms</span>
                <span className="text-emerald-600 font-bold">Ultra Fast</span>
              </div>
            </div>

            {/* Model 2: NzoOpen 4 Basic */}
            <div className="p-6 rounded-2xl border-2 border-[#800020]/40 bg-card space-y-4 shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#800020] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Flagship
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">NzoOpen 4 Basic</span>
                <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px]">
                  OpenAI GPT-4o
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full-capability multimodal intelligence for intricate inquiries, multilingual nuance, and complex company policy interpretation.
              </p>
              <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t flex items-center justify-between">
                <span>Reasoning: Frontier</span>
                <span className="text-emerald-600 font-bold">Multimodal</span>
              </div>
            </div>

            {/* Model 3: NzoClaude 3 Smart */}
            <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs hover:border-foreground/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">NzoClaude 3 Smart</span>
                <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 text-[10px]">
                  Anthropic Claude 3.5
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Exceptional natural conversation tone, high empathy, and polite customer engagement tailored for enterprise brands.
              </p>
              <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t flex items-center justify-between">
                <span>Tone: Empathetic</span>
                <span className="text-amber-600 font-bold">Nuanced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 border-t px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Built for High-Growth Companies</h2>
            <p className="text-sm text-muted-foreground">
              Everything required to deploy, train, brand, and monitor AI support bots across your digital footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">PostgreSQL pgvector Knowledge</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct cosine vector retrieval in Neon PostgreSQL with zero AWS S3 dependencies. Ingest PDFs, Word docs, raw text, and crawled website URLs.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Realtime Human Escalation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When complex queries arise, the bot alerts your team via Resend emails and hands off the conversation over high-performance WebSockets.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Paystack Billing (Ghana & Global)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accept subscriptions natively via Mobile Money (MTN, Telecel, AT) in Ghana Cedis (GH₵) and international credit/debit cards in USD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto w-full border-t">
        <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Transparent, Value-Driven Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Billed locally in Ghana Cedis (GH₵) via Paystack or in USD globally. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Starter</h3>
                <p className="text-xs text-muted-foreground">Ideal for startups and small websites</p>
              </div>
              <div className="text-3xl font-black text-foreground">
                GH₵ 400 <span className="text-xs text-muted-foreground font-normal">($29) / mo</span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1 AI Chatbot</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 2 Team Seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Standard Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Bubble & Iframe Embed</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" className="w-full text-xs font-semibold">Start with Starter</Button>
            </Link>
          </div>

          {/* Growth */}
          <div className="p-6 rounded-2xl border-2 border-[#800020] bg-card flex flex-col justify-between space-y-6 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#800020] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Growth</h3>
                <p className="text-xs text-muted-foreground">For scaling support and sales teams</p>
              </div>
              <div className="text-3xl font-black text-foreground">
                GH₵ 1,100 <span className="text-xs text-muted-foreground font-normal">($79) / mo</span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 3 AI Chatbots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 5 Team Seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Realtime Human Escalation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Web Scraper & Crawler</li>
              </ul>
            </div>
            <Link to="/register">
              <Button className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90 font-bold">Get Growth</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Professional</h3>
                <p className="text-xs text-muted-foreground">For high-traffic enterprises</p>
              </div>
              <div className="text-3xl font-black text-foreground">
                GH₵ 2,800 <span className="text-xs text-muted-foreground font-normal">($199) / mo</span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 5 AI Chatbots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 10 Team Seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Remove "Powered by NzoAI"</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Priority Support & Webhooks</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" className="w-full text-xs font-semibold">Get Professional</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-card mt-auto text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="w-6 h-6 rounded-md bg-[#800020] text-white flex items-center justify-center font-bold text-xs">
              N
            </div>
            <span>NzoAI</span>
          </div>
          <p>© {new Date().getFullYear()} NzoAI Inc. Autonomous AI Customer Support Platform.</p>
        </div>
      </footer>
    </div>
  );
}
