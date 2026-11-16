// Ported from Medilink-Frontend/src/app/ai-chat/page.tsx for desktop parity.
import { FormEvent, useState } from "react";
import { Bot, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { getAccessToken } from "../lib/apiClient";

const AI_URL = String(((import.meta as any).env?.VITE_MEDILINK_AI_URL) || "http://127.0.0.1:8088").replace(/\/+$/, "");
type Message = { role: "assistant" | "user"; text: string };

export default function AiChatView() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hello. I’m the Medilink AI assistant. Ask about approved hospital policies, procedures, or workflows." }]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = async (event: FormEvent) => {
    event.preventDefault(); const text = question.trim(); if (!text || busy) return;
    setQuestion(""); setMessages((current) => [...current, { role: "user", text }]); setBusy(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${AI_URL}/v1/knowledge`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ question: text }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || body.message || "The AI assistant could not respond.");
      setMessages((current) => [...current, { role: "assistant", text: body.text || body.issues?.join("\n") || "No answer was returned." }]);
    } catch (error: any) { setMessages((current) => [...current, { role: "assistant", text: error.message || "The AI assistant is unavailable." }]); }
    finally { setBusy(false); }
  };
  return <main className="ai-chat-page"><header className="ai-chat-header"><div className="ai-chat-brand"><span><Bot size={25} /></span><div><small>MEDILINK AI ASSISTANT</small><h1>Ask the hospital knowledge bot</h1><p>Answers are grounded in approved documents and remain advisory.</p></div></div><div className="ai-chat-safety"><ShieldCheck size={16} /> Read-only and human reviewed</div></header><section className="ai-chat-shell"><div className="ai-chat-messages" aria-live="polite">{messages.map((message, index) => <article key={`${message.role}-${index}`} className={`ai-chat-message ${message.role}`}><div className="ai-chat-avatar">{message.role === "assistant" ? <Sparkles size={16} /> : <UserRound size={16} />}</div><div><small>{message.role === "assistant" ? "Medilink AI" : "You"}</small><p>{message.text}</p></div></article>)}{busy && <article className="ai-chat-message assistant"><div className="ai-chat-avatar"><Sparkles size={16} /></div><div><small>Medilink AI</small><p className="ai-chat-thinking">Searching approved knowledge…</p></div></article>}</div><form className="ai-chat-compose module-form-body" onSubmit={ask}><div className="module-form-grid"><div className="module-form-field is-wide"><textarea className="module-form-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about a hospital policy or procedure…" rows={2} disabled={busy} /></div></div><div className="module-form-footer"><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={busy || !question.trim()} aria-label="Send question"><Send size={17} /> Send</button></div></form><p className="ai-chat-disclaimer"><ShieldCheck size={14} /> The assistant cannot diagnose, prescribe, approve transactions, or edit HMIS records.</p></section></main>;
}
