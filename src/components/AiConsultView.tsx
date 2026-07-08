import { useState, useRef, useEffect, FormEvent } from "react";
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Heart, 
  User as UserIcon, 
  Sparkles, 
  AlertTriangle,
  Lightbulb,
  Check
} from "lucide-react";
import { ChatMessage } from "../types.js";

interface AiConsultViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (question: string) => Promise<ChatMessage>;
  token: string;
}

export function AiConsultView({ chatHistory, onSendMessage }: AiConsultViewProps) {
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What is the Koebner phenomenon?",
    "How does cold weather trigger plaque flare-ups?",
    "What key ingredients should I look for in moisturizer?",
    "Explain the clinical meaning of PASI scoring."
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setErrorMsg("");
    setQuestion("");

    try {
      await onSendMessage(text);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to communicate with PsoriCare AI. Please verify API configuration.");
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(question);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, sending]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 max-h-[calc(100vh-120px)]">
      {/* Left Column: Educational Guidelines and Quick Prompts */}
      <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Medical Safety Alert */}
          <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/20 p-5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-teal-700">
              <AlertTriangle className="h-4.5 w-4.5 text-teal-600 shrink-0" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Clinical Guidance Guard</span>
            </div>
            <p className="text-[10px] text-teal-900 leading-relaxed">
              Our AI Dermatological assistant is highly knowledgeable regarding published skin-health journals, trigger research, and lifestyle clearing protocols.
            </p>
            <p className="text-[10px] text-teal-950/80 leading-relaxed font-semibold">
              Always verify any drug interactions or treatment therapies with your certified clinician.
            </p>
          </div>

          {/* Quick Prompts list */}
          <div className="rounded-3xl border border-teal-50 bg-white p-5 shadow-xs shadow-teal-950/2 space-y-3">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Lightbulb className="h-4.5 w-4.5 text-teal-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">Quick Consult Prompts</h3>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              Click on any standard diagnostic prompt to start an instant educational session.
            </p>

            <div className="space-y-1.5 pt-1">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  disabled={sending}
                  className="w-full text-left rounded-xl border border-teal-50 hover:border-teal-200 hover:bg-teal-50/10 p-2.5 text-xs text-teal-950 font-medium transition active:scale-[0.98] disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="rounded-2xl bg-teal-50/50 border border-teal-100 p-4 flex items-center gap-3">
          <Heart className="h-8 w-8 text-teal-500 fill-teal-500 shrink-0" />
          <div className="text-[10px] text-teal-900 leading-relaxed">
            Every chat helps track triggers and builds a robust qualitative overview for your next clinician visit.
          </div>
        </div>
      </div>

      {/* Right Column: Chat Box */}
      <div className="lg:col-span-8 flex flex-col h-[600px] border border-teal-50 bg-white rounded-3xl shadow-xs shadow-teal-950/2 overflow-hidden">
        {/* Chat header */}
        <div className="bg-teal-50/30 border-b border-teal-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-teal-600/10">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">PsoriCare Consult Companion</p>
              <p className="text-[9px] font-mono font-medium text-teal-600 mt-1 uppercase tracking-wider">AI Clinical Companion</p>
            </div>
          </div>
          <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Secure Session
          </span>
        </div>

        {/* Message timeline stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-teal-300 mb-3" />
              <p className="text-xs font-bold text-teal-950">Start an Educational Consultation</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                Ask anything regarding psoriasis classifications, symptoms, plaque tracking, or moisturizing guidelines.
              </p>
            </div>
          ) : (
            chatHistory.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}>
                  {/* Icon */}
                  <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border ${
                    isUser 
                      ? "bg-teal-50 border-teal-100 text-teal-700" 
                      : "bg-teal-600 border-teal-500 text-white"
                  }`}>
                    {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble body */}
                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser 
                      ? "bg-teal-50 border border-teal-100/50 text-teal-950 rounded-tr-none" 
                      : "bg-teal-50/20 border border-teal-50 text-teal-950 rounded-tl-none font-sans"
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Loading placeholder */}
          {sending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-teal-600 border border-teal-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-teal-50/20 border border-teal-50 px-4 py-3 text-xs flex items-center gap-2 text-teal-800">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                <span>PsoriCare AI is formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box */}
        <div className="border-t border-teal-50 p-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 mb-3 text-[11px] text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about skin care, triggers, moisturizing, PASI..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={sending}
              className="flex-1 rounded-xl border border-teal-50 bg-teal-50/10 px-4 py-3 text-xs text-teal-950 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={sending || !question.trim()}
              className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-700 active:scale-95 transition text-white rounded-xl flex items-center justify-center disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
