import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  startAssessment,
  nextQuestion,
  submitAnswer,
  completeAssessment,
} from "@/lib/talent.functions";
import { AIDisclosure, Chip, PageHeader } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/talent-discovery/assessment")({
  head: () => ({
    meta: [
      { title: "Discovery session — TalentIQ" },
      {
        name: "description",
        content: "An adaptive interview that narrows in on your potential capabilities.",
      },
      { property: "og:title", content: "Discovery session — TalentIQ" },
      { property: "og:description", content: "Answer a short adaptive interview." },
    ],
  }),
  component: AssessmentPage,
});

interface Question {
  question: string;
  category: string;
  options: Array<{ label: string; signals: string[] }>;
  step: number;
  total: number;
  fallback: boolean;
}

function AssessmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const start = useServerFn(startAssessment);
  const fetchQuestion = useServerFn(nextQuestion);
  const answer = useServerFn(submitAnswer);
  const finish = useServerFn(completeAssessment);

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const started = useRef(false);

  const loadQuestion = useCallback(
    async (id: string) => {
      setLoading(true);
      setSelected(null);
      try {
        const result = await fetchQuestion({ data: { assessmentId: id } });
        if ("done" in result) {
          await complete(id);
          return;
        }
        setQuestion(result as Question);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load the next question");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const complete = useCallback(
    async (id: string) => {
      setFinishing(true);
      try {
        await finish({ data: { assessmentId: id } });
        await queryClient.invalidateQueries({ queryKey: ["employee-bundle"] });
        navigate({ to: "/talent-discovery/results" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not generate your results");
      } finally {
        setFinishing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start({})
      .then((result) => {
        setAssessmentId(result.assessmentId);
        return loadQuestion(result.assessmentId);
      })
      .catch((error: unknown) => {
        setLoading(false);
        toast.error(error instanceof Error ? error.message : "Could not start the session");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNext() {
    if (!assessmentId || !question || selected === null) return;
    const option = question.options[selected];
    if (!option) return;
    setLoading(true);
    try {
      await answer({
        data: {
          assessmentId,
          question: question.question,
          category: question.category,
          answer: option.label,
          signals: option.signals,
          step: question.step,
        },
      });
      if (question.step >= question.total) {
        await complete(assessmentId);
        return;
      }
      await loadQuestion(assessmentId);
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Could not save your answer");
    }
  }

  const progress = question ? Math.round(((question.step - 1) / question.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Discovery session"
        title="Tell us how you actually work"
        description="There are no right answers. Pick the option closest to how you behave at work."
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {question?.step ?? 1} of {question?.total ?? 10}
          </span>
          <span className="font-mono tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {finishing ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
          <p className="text-sm font-semibold">Reviewing your answers against your recorded evidence</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Combining this session with your projects, achievements and learning history.
          </p>
        </div>
      ) : loading || !question ? (
        <div className="panel flex items-center justify-center gap-3 px-6 py-16 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin text-primary" />
          Choosing the most useful next question…
        </div>
      ) : (
        <div className="panel space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary">{question.category}</Chip>
            {question.fallback ? <Chip tone="outline">Standard question set</Chip> : null}
          </div>
          <h2 className="text-lg font-semibold leading-snug">{question.question}</h2>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSelected(index)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected === index
                    ? "border-primary bg-primary-soft text-primary-soft-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={selected === null} onClick={handleNext}>
            {question.step >= question.total ? "Finish and see results" : "Next question"}
          </Button>
        </div>
      )}

      <AIDisclosure>
        Your answers are treated as signals, not proof. They are weighed against your recorded work to
        suggest potential capabilities worth exploring.
      </AIDisclosure>
    </div>
  );
}
