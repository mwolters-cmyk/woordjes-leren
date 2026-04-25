"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  slug: string;
  boek: Record<string, unknown>;
  examinatorPrompt: string;
}

const NIVEAUS = ["havo 4", "havo 5", "vwo 4", "vwo 5", "vwo 6"] as const;

export default function MondelingChat({ boek, examinatorPrompt }: Props) {
  const [niveau, setNiveau] = useState<string>("vwo 5");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll naar bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(userText: string) {
    if (!userText.trim() || streaming) return;
    setError(null);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userText.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Voeg lege assistant-message toe die we incrementeel vullen
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/mondeling/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boek,
          niveau,
          messages: newMessages,
          examinatorPrompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) {
              setMessages((m) => {
                const last = m[m.length - 1];
                if (last?.role !== "assistant") return m;
                return [
                  ...m.slice(0, -1),
                  { role: "assistant", content: last.content + obj.delta },
                ];
              });
            } else if (obj.error) {
              throw new Error(obj.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
      // Verwijder de lege/halve assistant-message
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last?.role === "assistant" && last.content === "") return m.slice(0, -1);
        return m;
      });
    } finally {
      setStreaming(false);
    }
  }

  if (!started) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Link
          href={`/mondelingen/${(boek.slug as string) ?? ""}`}
          className="text-primary-light hover:underline text-sm mb-4 inline-block"
        >
          &larr; Terug
        </Link>
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-2">Mondeling: {String(boek.titel)}</h2>
          <p className="text-sm text-text-light mb-6">
            Kies je niveau en start het mondeling. De examinator stelt vragen
            in maximaal ~15 minuten.
          </p>

          <label className="block text-sm font-medium mb-1">Niveau</label>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-4 text-sm"
          >
            {NIVEAUS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setStarted(true);
              // Eerste turn: laat examinator openen
              send("Ik ben klaar om te beginnen.");
            }}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-medium"
          >
            Start mondeling
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <Link
        href={`/mondelingen/${(boek.slug as string) ?? ""}`}
        className="text-primary-light hover:underline text-sm mb-2 inline-block"
      >
        &larr; Stop mondeling
      </Link>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 space-y-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {m.content || (streaming && i === messages.length - 1 ? "..." : "")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !streaming) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={streaming ? "Even wachten..." : "Typ je antwoord..."}
          disabled={streaming}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="px-5 py-2 rounded-lg bg-primary text-white font-medium text-sm disabled:opacity-50"
        >
          Stuur
        </button>
      </div>
    </div>
  );
}
