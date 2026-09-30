import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Sparkles, Send, X, User as UserIcon, Copy, Check } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VitAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExperienceId?: string;
}

export const VitAssistantModal: React.FC<VitAssistantModalProps> = ({
  isOpen,
  onClose,
  currentExperienceId,
}) => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const studentSuggestions = [
    'Which visits am I eligible for?',
    'What should I carry for my visit?',
    'When is my next visit schedule?',
    'What is the reporting time for Siemens?',
    'Show my boarding pass requirements',
  ];

  const facultySuggestions = [
    'How many students are registered for my visits?',
    'Are there any pending leave requests?',
    'What is the upcoming visit schedule?',
    'Show attendance summary for completed visits',
  ];

  const adminSuggestions = [
    'Show institutional attendance rate',
    'How many total students are registered?',
    'Summarize faculty coordinator activity',
    'What is the overall waitlist volume?',
  ];

  const suggestions =
    role === 'ADMIN'
      ? adminSuggestions
      : role === 'FACULTY'
      ? facultySuggestions
      : studentSuggestions;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const firstName = user?.name ? user.name.split(' ')[0] : 'there';
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Greetings, ${firstName}. I am the **VIT Industrial Exposure Intelligence Assistant**.\n\nI can provide verified insights into eligibility guidelines, transit schedules, required attire and safety gear, boarding credentials, waitlist queues, and institutional protocols. How may I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user, role]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.askAssistant(textToSend, historyPayload, currentExperienceId);
      const assistantMessage: Message = {
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, the assistant is temporarily unreachable. Please retry momentarily.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = [];
      const regex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-xs text-slate-700">
            <span className="text-[#0B2545] font-bold">•</span>
            <span>{parts.length > 0 ? parts : line.substring(2)}</span>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 text-xs text-slate-700 leading-relaxed">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[620px] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900 bg-[#0B2545] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                VIT Intelligence Assistant
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 text-[9px] font-mono">
                  ACTIVE
                </span>
              </h3>
              <p className="text-[10px] text-blue-200">
                Experiential Learning Portal Guide • Vidyalankar Institute of Technology
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#0B2545] text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div>{formatContent(msg.content)}</div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#0B2545] cursor-pointer flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B2545] text-amber-400">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white p-3.5 text-xs text-slate-500 border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B2545] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B2545] animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B2545] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Analyzing portal guidelines...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-200 bg-slate-100 px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0 mr-1">
              SUGGESTED:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                disabled={loading}
                className="flex-shrink-0 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0B2545] hover:text-[#0B2545] transition-all cursor-pointer shadow-2xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about guidelines, schedules, boarding passes, waitlists..."
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2545] text-white hover:bg-[#133E87] disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
