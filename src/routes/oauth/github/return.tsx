import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/github/return")({
  head: () => ({
    meta: [
      { title: "Finishing GitHub connection — TalentIQ" },
      { name: "description", content: "Completing the authorized GitHub connection for your TalentIQ profile." },
      { property: "og:title", content: "Finishing GitHub connection — TalentIQ" },
      { property: "og:description", content: "Completing the authorized GitHub connection." },
    ],
  }),
  component: GithubOAuthReturn,
});

function GithubOAuthReturn() {
  const [message, setMessage] = useState("Finishing the GitHub connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "github", code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "The GitHub authorization did not complete.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("GitHub authorization completed without a usable code.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
