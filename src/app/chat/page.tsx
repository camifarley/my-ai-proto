"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  // useChat still manages the messages + sending
  const { messages, append, isLoading, error, stop } = useChat({
    api: "/api/chat",
  });

  // local text state for the input
  const [text, setText] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">AI Chat</h1>

      <div
        ref={listRef}
        className="border rounded-md p-4 h-[60vh] overflow-y-auto space-y-3 bg-white"
      >
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block px-3 py-2 rounded-md break-words " +
                (m.role === "user" ? "bg-black text-white" : "bg-gray-100")
              }
            >
              <strong className="mr-2">{m.role === "user" ? "You" : "AI"}:</strong>
              {m.content}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-500">Thinking…</div>}
        {error && <div className="text-sm text-red-600">{error.message || "Something went wrong."}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          append({ role: "user", content: value });
          setText("");
        }}
        className="flex gap-2"
      >
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
          <button
            type="button"
            onClick={stop}
            className="border rounded-md px-3 py-2"
            title="Stop generating"
          >
            Stop
          </button>
        )}
      </form>
    </main>
  );
}
