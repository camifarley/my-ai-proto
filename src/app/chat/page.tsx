"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || isLoading) return;

    setLastError(null);
    setIsLoading(true);

    // 1) append the user message
    const userMsg: Msg = { role: "user", content: value };
    setMessages((prev) => [...prev, userMsg]);
    setText("");

    try {
      // 2) call your API with the full message history (user included)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${txt || res.statusText}`);
      }

      // 3) stream the assistant reply
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      // add a placeholder assistant message we’ll keep updating
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });

        // update the last (assistant) message with streamed text
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
            copy[lastIdx] = { role: "assistant", content: acc };
          }
          return copy;
        });
      }
    } catch (err) {
    if (err instanceof Error) {
      setLastError(err.message);
    } else {
      setLastError("Unknown error");
    }
    } finally {
      setIsLoading(false);
    }
  }

  function stopStreaming() {
    // Simple UX affordance; for a real cancel you’d use an AbortController
    setIsLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">AI Chat</h1>

      <div
        ref={listRef}
        className="border rounded-md p-4 h-[60vh] overflow-y-auto space-y-3 bg-white"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block px-3 py-2 rounded-md break-words whitespace-pre-wrap " +
                (m.role === "user" ? "bg-black text-white" : "bg-gray-100")
              }
            >
              <strong className="mr-2">{m.role === "user" ? "You" : "AI"}:</strong>
              {m.content}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-500">Thinking…</div>}
        {lastError && <div className="text-sm text-red-600">{lastError}</div>}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask me anything…"
          className="flex-1 border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          className="border rounded-md px-4 py-2 bg-black text-white disabled:opacity-50"
          disabled={isLoading || !text.trim()}
        >
          Send
        </button>
        {isLoading && (
          <button type="button" onClick={stopStreaming} className="border rounded-md px-3 py-2" title="Stop">
            Stop
          </button>
        )}
      </form>

      <p className="text-xs text-gray-500">
        {isLoading ? "Streaming…" : lastError ? "Error" : "Ready"}
      </p>
    </main>
  );
}
