export type LocalHelpFallbackContext = {
  userRole?: string;
  module?: string;
  screen?: string;
  facilityId?: string;
  departmentId?: string;
  error?: string;
};

export type LocalHelpFallbackMessage = {
  role: "assistant" | "user";
  content: string;
};

const OPENAI_ERROR_MARKERS = [
  "input_text",
  "output_text",
  "you exceeded your current quota",
  "openai",
  "api-errors",
];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isGreeting(text: string) {
  return (
    !text ||
    text === "hi" ||
    text === "hello" ||
    text === "hey" ||
    text.includes("good morning") ||
    text.includes("good afternoon") ||
    text.includes("good evening")
  );
}

function hasOpenAiError(text: string) {
  return OPENAI_ERROR_MARKERS.some((token) => text.includes(token));
}

function fromHistory(history: LocalHelpFallbackMessage[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const row = history[i];
    if (row.role === "user" && row.content.trim()) {
      return row.content.trim();
    }
  }
  return "";
}

function isContinueWord(text: string) {
  return (
    text === "continue" ||
    text === "next" ||
    text === "yes" ||
    text === "ok" ||
    text === "okay"
  );
}

function structured(params: {
  what: string;
  steps: string[];
  mistakes: string[];
  fails: string[];
  tip: string;
}) {
  return [
    "1) What You're Trying To Do",
    params.what,
    "",
    "2) Step-by-Step Instructions",
    ...params.steps.map((s) => `- ${s}`),
    "",
    "3) Common Mistakes",
    ...params.mistakes.map((s) => `- ${s}`),
    "",
    "4) What To Do If It Fails",
    ...params.fails.map((s) => `- ${s}`),
    "",
    "5) Optional Best Practice Tip",
    `- ${params.tip}`,
  ].join("\n");
}

export function generateLocalHelpFallbackReply(params: {
  question: string;
  context: LocalHelpFallbackContext;
  history: LocalHelpFallbackMessage[];
  backendError?: string;
}) {
  const rawQuestion = String(params.question || "").trim();
  const normalizedQuestion = normalize(rawQuestion);
  const errorText = normalize(params.backendError || "");
  const effectiveQuestion = isContinueWord(normalizedQuestion)
    ? fromHistory(params.history) || rawQuestion
    : rawQuestion;
  const lookup = normalize(
    `${effectiveQuestion} ${params.context.module || ""} ${params.context.screen || ""} ${
      params.context.error || ""
    } ${params.backendError || ""}`,
  );

  if (isGreeting(normalize(effectiveQuestion))) {
    return "Hello 👋\nI am Medilink AI — your intelligent hospital assistant.\nI can guide you step-by-step through any task, explain reports, clarify errors, and help you navigate the system efficiently.\nHow can I assist you today?";
  }

  if (hasOpenAiError(errorText) || hasOpenAiError(lookup)) {
    return structured({
      what: "Use the local Medilink AI help flow and avoid OpenAI-dependent failure paths.",
      steps: [
        "Restart backend to load the local knowledge assistant implementation.",
        "Open Help Widget again and ask the same question.",
        "Confirm replies are workflow guidance and not provider error text.",
      ],
      mistakes: [
        "Running an old backend process after code changes.",
        "Using cached desktop session without refreshing API state.",
      ],
      fails: [
        "Stop all backend processes and start only the latest service.",
        "Re-login to refresh API session and retry Help Widget.",
      ],
      tip: "Keep Help AI on local provider mode for production reliability.",
    });
  }

  if (lookup.includes("registered patient") || lookup.includes("not seen") || lookup.includes("queue")) {
    return structured({
      what: "Move a checked-in patient to the next module and make them visible downstream.",
      steps: [
        "Save current stage first.",
        "Use Next Queue Route and pick the destination module.",
        "In destination module, filter by correct facility, today, and waiting status.",
        "Open patient from queue list, not manual form.",
      ],
      mistakes: [
        "Skipping Next Queue Route after save.",
        "Wrong date/status/facility filter in target module.",
      ],
      fails: [
        "Refresh queue and clear filters.",
        "Check patient timeline for routing event.",
      ],
      tip: "Keep shared fields read-only in downstream forms to preserve pattern consistency.",
    });
  }

  if (lookup.includes("lab") || lookup.includes("laboratory")) {
    return structured({
      what: "Process laboratory work through queue-routed orders.",
      steps: [
        "Open order from Laboratory queue.",
        "Verify specimen/test details.",
        "Enter and verify result.",
        "Release result and close task.",
      ],
      mistakes: [
        "Creating standalone lab forms instead of queue-routed order.",
      ],
      fails: [
        "Check queue filters and order status.",
      ],
      tip: "Publish only verified results.",
    });
  }

  return structured({
    what: `Complete your task in ${params.context.module || "the current module"}${
      params.context.screen ? ` (${params.context.screen})` : ""
    }.`,
    steps: [
      "Open the active queued record.",
      "Fill only editable fields; keep auto fields hidden/read-only.",
      "Save stage and route to next queue where required.",
    ],
    mistakes: [
      "Creating duplicate manual records.",
      "Editing locked values from previous stage.",
    ],
    fails: [
      "Refresh filters and reload queue.",
      "Retry using same patient visit context.",
    ],
    tip: "Use queue-driven workflow end-to-end.",
  });
}

