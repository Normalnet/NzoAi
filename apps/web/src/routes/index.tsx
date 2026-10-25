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
} from "lucide-react";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-[#800020] text-white flex items-center justify-center font-black">
              N
            </div>
            <span>NzoAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#solutions" className="hover:text-foreground transition-colors">RAG Training</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs text-white bg-[#800020] hover:bg-[#800020]/90">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-xs font-semibold text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Next-Gen Multi-Tenant AI Support Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Supercharge Customer Support with <span className="text-[#800020]">Trained AI Agents</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Train custom AI agents on your documents, website pages, and FAQs. Embed an interactive chat bubble anywhere in seconds, capture qualified leads, and seamlessly escalate to human agents over live WebSockets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-white bg-[#800020] hover:bg-[#800020]/90 gap-2">
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/admin/overview">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <Bot className="w-4 h-4" />
              <span>Explore Dashboard</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-muted/20 border-y px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Everything You Need for Autonomous Support</h2>
            <p className="text-sm text-muted-foreground">
              Built from the ground up for high reliability, enterprise knowledge retrieval, and live human collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">Retrieval-Augmented Generation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Postgres + pgvector with HNSW cosine indexes. Extract knowledge from PDFs, Word docs, raw text, and crawled website links.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">Realtime Human Escalation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When complex queries arise, the bot alerts your team via Resend emails and hands off the conversation over high-performance WebSockets.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">Action Tools & Lead Capture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Intelligent tool execution that dynamically renders interactive lead capture forms, custom CTA buttons, and Calendly/Cal.com appointment pickers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Predictable, Transparent SaaS Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Choose the ideal plan for your customer support scale. Upgrade or change anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Starter</h3>
                <p className="text-xs text-muted-foreground">Ideal for startups and small websites</p>
              </div>
              <div className="text-3xl font-extrabold">$29<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1 AI Chatbot</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 2 Team Members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Standard Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Bubble & Iframe Embed</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" className="w-full text-xs">Start with Starter</Button>
            </Link>
          </div>

          {/* Growth */}
          <div className="p-6 rounded-2xl border-2 border-primary bg-card flex flex-col justify-between space-y-6 shadow-md relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Growth</h3>
                <p className="text-xs text-muted-foreground">For scaling support and sales teams</p>
              </div>
              <div className="text-3xl font-extrabold">$79<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 3 AI Chatbots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 5 Team Members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Realtime Human Escalation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Web Scraper & Crawler</li>
              </ul>
            </div>
            <Link to="/register">
              <Button className="w-full text-xs text-white bg-[#800020] hover:bg-[#800020]/90">Get Growth</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-2xl border bg-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Professional</h3>
                <p className="text-xs text-muted-foreground">For high-traffic enterprises</p>
              </div>
              <div className="text-3xl font-extrabold">$199<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 5 AI Chatbots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 10 Team Members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Remove Branding</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Priority Support & Webhooks</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" className="w-full text-xs">Get Professional</Button>
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
          <p>© {new Date().getFullYear()} NzoAI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
