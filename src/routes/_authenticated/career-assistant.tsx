import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { careerChat } from "@/lib/talent.functions";
import { AIDisclosure, Chip, PageHeader } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/career-assistant")({
  head: () => ({
    meta: [
      { title: "Career AI — TalentMap AI" },
      {
        name: "description",
        content: "Ask about your own skills, capabilities, role matches and development options.",
      },
      { property: "og:title", content: "Career AI — TalentMap AI" },
      { property: "og:description", content: "Answers grounded in your recorded data." },
    ],
  }),
  component: AssistantPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const starters = [
  "What roles could I realistically grow into?",
  "Why was I matched with my top role?",
  "What skills am I missing?",
  "Which project would strengthen my profile?",
  "Show me the evidence for my leadership capability.",
  "What are my strongest capabilities right now?",
];

function AssistantPage() {
  const ask = useServerFn(careerChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setBusy(true);
    try {
      const result = await ask({ data: { message, history } });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't reach the assistant just now. Your skills, capabilities and role matches are still available on their own pages.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Career AI"
        title="Ask TalentMap"
        description="Career AI answers only from your recorded profile, evidence and the published internal roles."
      />

      <div className="flex-1 space-y-4">
        {messages.length === 0 ? (
          <div className="panel space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Try one of these to start:
            </p>
            <div className="flex flex-wrap gap-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  className="rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                : "panel max-w-[92%] p-4"
            }
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            {message.sources?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {message.sources.map((source) => (
                  <Chip key={source} tone="outline">
                    {source}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {busy ? (
          <div className="panel flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="size-4 animate-spin text-primary" />
            Reading your profile…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 space-y-3 bg-background pb-2 pt-2"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your skills, roles or next steps"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()} aria-label="Send">
            <Send aria-hidden className="size-4" />
          </Button>
        </div>
        <AIDisclosure>
          Career AI never invents experience. If your record does not contain the answer it will say it
          doesn't have enough information yet.
        </AIDisclosure>
      </form>
    </div>
  );
}
