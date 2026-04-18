// Behavioral interview prompts — STAR method, level-tagged

export const BEHAVIORAL_PROMPTS = [
  // ─── Leadership / Ownership (heavy for L2/L3) ──────────
  { id: "bh-lead-1", cat: "Leadership", level: "L2", n: "Tell me about a time you drove a project with no clear owner",
    prompt: "Describe a situation where work needed doing but responsibility was unclear. What did you do? How did you align others? What was the outcome?",
    hints: ["Show ownership (didn't wait to be told)", "Navigated ambiguity", "Brought others along", "Quantify impact"],
  },
  { id: "bh-lead-2", cat: "Leadership", level: "L3", n: "Describe leading a cross-team initiative",
    prompt: "When did you lead work spanning multiple teams? How did you align goals, resolve conflicts, and drive to a shared outcome?",
    hints: ["Stakeholder mapping", "Communication cadence", "Conflict resolution", "Influence without authority"],
  },
  { id: "bh-lead-3", cat: "Leadership", level: "L2", n: "Tell me about a time you disagreed with your manager",
    prompt: "How did you handle it? What was the outcome?",
    hints: ["Data-driven disagreement", "Respectful disagreement", "Ability to commit even if not convinced (disagree-and-commit)"],
  },

  // ─── Technical Challenge ───────────────────────────────
  { id: "bh-tech-1", cat: "Technical", level: "L1", n: "Most challenging technical problem you've solved",
    prompt: "Describe the problem, why it was hard, how you approached it, and what you learned.",
    hints: ["Start with context + why it mattered", "Explain approach + alternatives considered", "Quantify outcome", "What you'd do differently"],
  },
  { id: "bh-tech-2", cat: "Technical", level: "L2", n: "A major system/service you designed or rearchitected",
    prompt: "What were the requirements? How did you design it? What trade-offs did you make? How did it perform in production?",
    hints: ["Requirements gathering", "Trade-off reasoning", "Production readiness (monitoring, rollback)", "Post-launch learnings"],
  },
  { id: "bh-tech-3", cat: "Technical", level: "L3", n: "Describe a time you had to reduce tech debt",
    prompt: "How did you identify it? How did you justify the investment? How did you execute without stopping feature work?",
    hints: ["Measured impact of debt", "Sold to stakeholders", "Incremental approach", "Outcome: speed, quality, team morale"],
  },

  // ─── Failure / Growth ──────────────────────────────────
  { id: "bh-fail-1", cat: "Failure", level: "L1", n: "A time you failed",
    prompt: "Pick a real failure. What happened? What did you learn? How did you apply that learning afterward?",
    hints: ["Real failure (not humble-brag)", "Ownership — no blame", "Concrete learning", "Changed behavior after"],
  },
  { id: "bh-fail-2", cat: "Failure", level: "L2", n: "A shipped feature that didn't work out",
    prompt: "Describe a feature you built that didn't achieve its goal. What went wrong? How did you respond?",
    hints: ["Goal vs outcome", "Root cause analysis", "Kill vs iterate decision", "Process improvements"],
  },
  { id: "bh-fail-3", cat: "Failure", level: "L2", n: "A production incident you caused",
    prompt: "Walk through the incident, your response, the fix, and the post-mortem.",
    hints: ["Timeline", "Mitigation before root-cause fix", "Blameless post-mortem", "Preventive actions"],
  },

  // ─── Conflict ──────────────────────────────────────────
  { id: "bh-conflict-1", cat: "Conflict", level: "L1", n: "Disagreement with a teammate",
    prompt: "How did you resolve it? What did you learn about yourself or them?",
    hints: ["Understand their perspective first", "Focus on shared goal", "Compromise + commit", "Improved relationship after"],
  },
  { id: "bh-conflict-2", cat: "Conflict", level: "L2", n: "Pushing back on an unreasonable deadline",
    prompt: "Tell me about a time PM/manager set a deadline you thought was unrealistic. How did you handle it?",
    hints: ["Bring data (estimates, risks)", "Offer alternatives (scope cut, more people)", "Commit to realistic plan", "Trust outcome"],
  },

  // ─── Mentoring / Growth ────────────────────────────────
  { id: "bh-mentor-1", cat: "Mentoring", level: "L2", n: "Mentoring a junior engineer",
    prompt: "Tell me about someone you helped grow. What was their gap? How did you work with them? Outcome?",
    hints: ["Specific person, specific gap", "Structured approach (pair coding, review, projects)", "Their growth is the outcome, not yours"],
  },
  { id: "bh-mentor-2", cat: "Mentoring", level: "L3", n: "Improving team's engineering practice",
    prompt: "A practice you changed or introduced — code review, testing, deployment, architecture. How did you identify the need, introduce it, and measure impact?",
    hints: ["Problem identification", "Buy-in / change management", "Adoption strategy (voluntary vs mandated)", "Measured improvement"],
  },

  // ─── Ambiguity / Decision Making ───────────────────────
  { id: "bh-dec-1", cat: "Decisions", level: "L2", n: "A decision you made with incomplete information",
    prompt: "How did you assess risk? What assumptions did you make? How did you hedge against being wrong?",
    hints: ["Info gathered before deciding", "Explicit assumptions", "Reversibility (one-way vs two-way door)", "Outcome + retrospective"],
  },
  { id: "bh-dec-2", cat: "Decisions", level: "L3", n: "Build vs buy decision",
    prompt: "A time you had to decide whether to build in-house or use a third-party solution. Walk through your analysis and decision.",
    hints: ["Total cost of ownership", "Strategic vs commodity", "Integration risk", "Exit cost if tool fails"],
  },

  // ─── Customer / Product ────────────────────────────────
  { id: "bh-prod-1", cat: "Product", level: "L2", n: "Influencing product direction",
    prompt: "A time you changed what was being built (scope, design, feature) based on technical insight. How did you make the case?",
    hints: ["User impact framing (not just tech)", "Concrete data", "Win-win framing", "PM partnership"],
  },
  { id: "bh-prod-2", cat: "Product", level: "L1", n: "Advocating for the user",
    prompt: "Tell me about a time you pushed back on a decision because it would hurt the user experience.",
    hints: ["Specific user impact", "Alternatives proposed", "Outcome"],
  },

  // ─── Hiring / Culture ──────────────────────────────────
  { id: "bh-cult-1", cat: "Culture", level: "L2", n: "Why do you want to work here?",
    prompt: "Give a thoughtful, specific answer. Reference the company's product, culture, recent news, or engineering blog.",
    hints: ["Research the company", "Connect to your goals/strengths", "Show enthusiasm without flattery"],
  },
  { id: "bh-cult-2", cat: "Culture", level: "L1", n: "Why are you leaving your current role?",
    prompt: "Frame positively. What are you moving toward (not running from)?",
    hints: ["Growth, impact, scope", "Don't bash current employer", "Truthful but diplomatic"],
  },
  { id: "bh-cult-3", cat: "Culture", level: "L3", n: "Where do you see yourself in 5 years?",
    prompt: "Show ambition + self-awareness. What's next after this role?",
    hints: ["Growth trajectory", "Specific — tech lead? principal? founding eng?", "How this role fits"],
  },
];

export const STAR_TEMPLATE = `# STAR Method

**Situation** — Set the context (30 sec). What was the project, your role, why it mattered?

**Task** — What was your specific responsibility or goal?

**Action** — What *you* did (not "we"). Steps, decisions, trade-offs. This is the bulk.

**Result** — Quantified outcome. What changed? What did you learn?

## Tips
- 2-3 minute answers, not 10
- Real stories — interviewers smell fake
- Same 5-8 stories can cover most questions — prep them well
- Include: 1 leadership, 1 failure, 1 conflict, 1 technical, 1 ambiguity, 1 mentoring
- Practice out loud — different than writing`;
