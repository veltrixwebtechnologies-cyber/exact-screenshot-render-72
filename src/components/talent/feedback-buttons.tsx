import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { myFeedback, submitFeedback } from "@/lib/feedback.functions";

type TargetType = "capability" | "role" | "learning" | "roadmap" | "chat";

/**
 * Was this recommendation useful? Answers are stored against the person's
 * profile and taken into account the next time recommendations are generated.
 */
export function FeedbackButtons({
  targetType,
  targetLabel,
  label = "Was this useful?",
}: {
  targetType: TargetType;
  targetLabel: string;
  label?: string;
}) {
  const queryClient = useQueryClient();
  const load = useServerFn(myFeedback);
  const send = useServerFn(submitFeedback);

  const { data } = useQuery({
    queryKey: ["my-feedback"],
    queryFn: () => load(),
    staleTime: 60_000,
  });

  const current = data?.feedback.find(
    (row) => row.target_type === targetType && row.target_label === targetLabel,
  )?.rating;

  const mutation = useMutation({
    mutationFn: (rating: 1 | -1) => send({ data: { targetType, targetLabel, rating } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-feedback"] });
      toast.success("Thanks — future recommendations will take this into account.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const button = (rating: 1 | -1) => {
    const active = current === rating;
    const Icon = rating === 1 ? ThumbsUp : ThumbsDown;
    return (
      <button
        type="button"
        aria-label={rating === 1 ? "Useful" : "Not relevant"}
        aria-pressed={active}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(rating)}
        className={`inline-flex size-7 items-center justify-center rounded-md border transition-colors ${
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground"
        } disabled:opacity-50`}
      >
        <Icon aria-hidden className="size-3.5" />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {button(1)}
      {button(-1)}
    </div>
  );
}
