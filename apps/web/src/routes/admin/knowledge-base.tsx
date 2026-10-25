import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  FileCode,
  HelpCircle,
  Globe,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<"docs" | "text" | "qna" | "web">("docs");
  const [chatbot, setChatbot] = useState<any>(null);

  // Sources data
  const [docs, setDocs] = useState<any[]>([]);
  const [texts, setTexts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);

  // Forms
  const [textForm, setTextForm] = useState({ title: "", content: "" });
  const [qnaForm, setQnaForm] = useState({ question: "", answer: "" });
  const [webUrl, setWebUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState<any>(null);

  const loadAll = () => {
    fetch("/api/my-chatbot")
      .then((r) => r.ok && r.json())
      .then((d) => d && setChatbot(d.chatbot));

    fetch("/api/document-source")
      .then((r) => r.ok && r.json())
      .then((d) => d && setDocs(d.documents || []));

    fetch("/api/text-sources")
      .then((r) => r.ok && r.json())
      .then((d) => d && setTexts(d.textSources || []));

    fetch("/api/questions")
      .then((r) => r.ok && r.json())
      .then((d) => d && setQuestions(d.questions || []));

    fetch("/api/scrape")
      .then((r) => r.ok && r.json())
      .then((d) => d && setWebsites(d.websiteSources || []));

    fetch("/api/training-status")
      .then((r) => r.ok && r.json())
      .then((d) => d && setTrainStatus(d));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      await fetch("/api/train-agent", { method: "POST" });
      loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const upRes = await fetch("/api/upload-documents", { method: "POST", body: fd });
      const upData = await upRes.json();

      if (upData.success) {
        await fetch("/api/document-source", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: upData.name,
            type: upData.type,
            size: upData.size,
            url: upData.url,
          }),
        });
        loadAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textForm.title || !textForm.content) return;
    try {
      await fetch("/api/text-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(textForm),
      });
      setTextForm({ title: "", content: "" });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qnaForm.question || !qnaForm.answer) return;
    try {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qnaForm),
      });
      setQnaForm({ question: "", answer: "" });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl) return;
    setIsScraping(true);
    try {
      await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webUrl }),
      });
      setWebUrl("");
      loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScraping(false);
    }
  };

  const deleteItem = async (endpoint: string, id: string) => {
    try {
      await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const primaryColor = chatbot?.primaryColor || "#800020";

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Feed your agent company knowledge from documents, FAQs, text notes, and website pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={trainStatus?.trainingStatus === "completed" ? "success" : "secondary"}>
            {trainStatus?.trainingStatus || "idle"}
          </Badge>
          <Button
            size="sm"
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={handleTrain}
            disabled={isTraining}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTraining ? "animate-spin" : ""}`} />
            <span>{isTraining ? "Rebuilding Knowledge..." : "Train Agent"}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-muted rounded-xl border">
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === "docs" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({docs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === "text" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Text Notes ({texts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("qna")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === "qna" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Q&A Pairs ({questions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("web")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === "web" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Websites ({websites.length})</span>
        </button>
      </div>

      {/* Tab 1: Documents */}
      {activeTab === "docs" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Upload Documentation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/40 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">Click to upload or drag & drop</span>
                <span className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT (up to 20MB)</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              {isUploading && <p className="text-xs text-center text-primary mt-2">Uploading and indexing document...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Indexed Documents ({docs.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {docs.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No documents uploaded yet.</div>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(doc.size / 1024)} KB · {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem("/api/document-source", doc.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Text Notes */}
      {activeTab === "text" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Add Text Source</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddText} className="space-y-3">
                <Input
                  placeholder="Document Title (e.g. Return Policy, Pricing Details)"
                  value={textForm.title}
                  onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Paste or write detailed plain text or markdown content..."
                  className="min-h-[120px]"
                  value={textForm.content}
                  onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                  required
                />
                <Button type="submit" size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Text Snippet</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Text Sources ({texts.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {texts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No text sources added yet.</div>
              ) : (
                texts.map((t) => (
                  <div key={t.id} className="p-4 flex items-start justify-between hover:bg-muted/10">
                    <div className="space-y-1 max-w-[80%]">
                      <p className="font-semibold text-sm text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem("/api/text-sources", t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Q&A */}
      {activeTab === "qna" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Add Q&A Pair</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddQna} className="space-y-3">
                <Input
                  placeholder="Frequently Asked Question"
                  value={qnaForm.question}
                  onChange={(e) => setQnaForm({ ...qnaForm, question: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Direct, factual answer..."
                  className="min-h-[90px]"
                  value={qnaForm.answer}
                  onChange={(e) => setQnaForm({ ...qnaForm, answer: e.target.value })}
                  required
                />
                <Button type="submit" size="sm" className="text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Q&A Pair</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Q&A Questions ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {questions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No Q&A pairs added yet.</div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className="p-4 flex items-start justify-between hover:bg-muted/10">
                    <div className="space-y-1 max-w-[80%]">
                      <p className="font-semibold text-sm text-foreground">Q: {q.question}</p>
                      <p className="text-xs text-muted-foreground">A: {q.answer}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem("/api/questions", q.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Websites */}
      {activeTab === "web" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Scrape Web Page</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleScrape} className="flex gap-2">
                <Input
                  placeholder="https://example.com/faq"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}
                  disabled={isScraping}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isScraping ? "Scraping..." : "Scrape & Index"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Website Sources ({websites.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {websites.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No websites scraped yet.</div>
              ) : (
                websites.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div>
                        <a href={w.url} target="_blank" rel="noreferrer" className="font-medium text-sm text-primary hover:underline">
                          {w.url}
                        </a>
                        <p className="text-xs text-muted-foreground">Scraped {new Date(w.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem("/api/scrape", w.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
