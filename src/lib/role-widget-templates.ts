export type RoleWidgetStep = {
  id: string
  label: string
  eta: string
}

export type RoleWidgetLane = {
  id: string
  title: string
  subtitle: string
  steps: RoleWidgetStep[]
}

export type RoleWidgetTemplateFamily =
  | "sales"
  | "agentic_eng"
  | "marketing"
  | "implementation"
  | "data_steward"
  | "people_ops"

const roleWidgetTemplates: Record<RoleWidgetTemplateFamily, RoleWidgetLane[]> = {
  sales: [
    {
      id: "discovery-assist",
      title: "Discovery Assist",
      subtitle: "question quality -> value map -> close",
      steps: [
        { id: "d1", label: "Discovery question coverage", eta: "08s" },
        { id: "d2", label: "Value quantification cues", eta: "06s" },
        { id: "d3", label: "Closing-step readiness", eta: "05s" }
      ]
    },
    {
      id: "objection-lens",
      title: "Objection Lens",
      subtitle: "tone -> objection -> recovery",
      steps: [
        { id: "o1", label: "Objection type detection", eta: "07s" },
        { id: "o2", label: "Response posture scoring", eta: "09s" },
        { id: "o3", label: "Recovery path suggestion", eta: "06s" }
      ]
    },
    {
      id: "integrity-guard",
      title: "Integrity Guard",
      subtitle: "promise safety -> realism -> policy",
      steps: [
        { id: "i1", label: "Overpromise risk scan", eta: "04s" },
        { id: "i2", label: "Commitment realism check", eta: "07s" },
        { id: "i3", label: "Policy-safe language check", eta: "05s" }
      ]
    }
  ],
  agentic_eng: [
    {
      id: "decomposition",
      title: "Decomposition Flow",
      subtitle: "scope -> architecture -> edge cases",
      steps: [
        { id: "e1", label: "Task decomposition map", eta: "09s" },
        { id: "e2", label: "Interface contract shaping", eta: "08s" },
        { id: "e3", label: "Failure path coverage", eta: "06s" }
      ]
    },
    {
      id: "verification",
      title: "Verification Engine",
      subtitle: "tests -> assertions -> regressions",
      steps: [
        { id: "v1", label: "Test plan synthesis", eta: "07s" },
        { id: "v2", label: "Assertion completeness", eta: "06s" },
        { id: "v3", label: "Regression surface scan", eta: "08s" }
      ]
    },
    {
      id: "security-latency",
      title: "Security & Perf",
      subtitle: "abuse paths -> hotspots -> fixes",
      steps: [
        { id: "s1", label: "Security risk triage", eta: "05s" },
        { id: "s2", label: "Latency hotspot hints", eta: "06s" },
        { id: "s3", label: "Safe patch outline", eta: "07s" }
      ]
    }
  ],
  marketing: [
    {
      id: "positioning",
      title: "Positioning Assist",
      subtitle: "ICP -> message -> evidence",
      steps: [
        { id: "m1", label: "ICP signal extraction", eta: "08s" },
        { id: "m2", label: "Message pillar framing", eta: "06s" },
        { id: "m3", label: "Proof strategy mapping", eta: "07s" }
      ]
    },
    {
      id: "experiment-loop",
      title: "Experiment Loop",
      subtitle: "hypothesis -> channel -> metric",
      steps: [
        { id: "x1", label: "Hypothesis quality check", eta: "06s" },
        { id: "x2", label: "Channel-cadence fit", eta: "07s" },
        { id: "x3", label: "Metric clarity check", eta: "05s" }
      ]
    },
    {
      id: "quality-guard",
      title: "Brand Quality Guard",
      subtitle: "tone -> consistency -> ownership",
      steps: [
        { id: "q1", label: "Brand tone validation", eta: "04s" },
        { id: "q2", label: "Consistency pass", eta: "06s" },
        { id: "q3", label: "Candidate ownership signal", eta: "05s" }
      ]
    }
  ],
  implementation: [
    {
      id: "customer-clarity",
      title: "Customer Clarity",
      subtitle: "facts -> next step -> confidence",
      steps: [
        { id: "c1", label: "Fact restatement quality", eta: "05s" },
        { id: "c2", label: "Timeline precision check", eta: "06s" },
        { id: "c3", label: "De-escalation posture", eta: "07s" }
      ]
    },
    {
      id: "internal-sync",
      title: "Internal Sync",
      subtitle: "questions -> handoff -> alignment",
      steps: [
        { id: "n1", label: "Internal question quality", eta: "06s" },
        { id: "n2", label: "Dependency handoff notes", eta: "08s" },
        { id: "n3", label: "Scope alignment check", eta: "05s" }
      ]
    },
    {
      id: "risk-monitor",
      title: "Risk Monitor",
      subtitle: "risk -> mitigation -> ownership",
      steps: [
        { id: "r1", label: "Risk signal extraction", eta: "06s" },
        { id: "r2", label: "Mitigation quality check", eta: "07s" },
        { id: "r3", label: "Ownership articulation", eta: "05s" }
      ]
    }
  ],
  data_steward: [
    {
      id: "taxonomy",
      title: "Taxonomy Builder",
      subtitle: "entity -> labels -> auditability",
      steps: [
        { id: "t1", label: "Entity class clarity", eta: "06s" },
        { id: "t2", label: "Labeling rule precision", eta: "07s" },
        { id: "t3", label: "Audit path coverage", eta: "06s" }
      ]
    },
    {
      id: "retrieval-diagnostics",
      title: "Retrieval Diagnostics",
      subtitle: "source -> chunking -> freshness",
      steps: [
        { id: "g1", label: "Source gap detection", eta: "07s" },
        { id: "g2", label: "Chunk quality analysis", eta: "06s" },
        { id: "g3", label: "Freshness mismatch detection", eta: "05s" }
      ]
    },
    {
      id: "evaluation-loop",
      title: "Evaluation Loop",
      subtitle: "baseline -> fix -> verify",
      steps: [
        { id: "l1", label: "Baseline metric setup", eta: "05s" },
        { id: "l2", label: "Change impact estimate", eta: "06s" },
        { id: "l3", label: "Verification checklist", eta: "06s" }
      ]
    }
  ],
  people_ops: [
    {
      id: "sensitivity",
      title: "Sensitivity Guard",
      subtitle: "tone -> discretion -> compliance",
      steps: [
        { id: "p1", label: "Tone appropriateness", eta: "05s" },
        { id: "p2", label: "Discretion risk check", eta: "05s" },
        { id: "p3", label: "Policy alignment", eta: "06s" }
      ]
    },
    {
      id: "onboarding",
      title: "Onboarding Planner",
      subtitle: "timeline -> owner -> follow-ups",
      steps: [
        { id: "o1", label: "Timeline structure", eta: "06s" },
        { id: "o2", label: "Owner mapping", eta: "05s" },
        { id: "o3", label: "Cadence reminders", eta: "06s" }
      ]
    },
    {
      id: "communication",
      title: "Communication Coach",
      subtitle: "clarity -> empathy -> action",
      steps: [
        { id: "h1", label: "Clarity check", eta: "04s" },
        { id: "h2", label: "Empathy signal review", eta: "05s" },
        { id: "h3", label: "Actionability pass", eta: "06s" }
      ]
    }
  ]
}

export function getRoleWidgetTemplate(roleFamily: string): RoleWidgetLane[] {
  const fallback: RoleWidgetTemplateFamily = "sales"
  const alias: Record<string, RoleWidgetTemplateFamily> = {
    fullstack: "agentic_eng",
    engineering: "agentic_eng",
    implementation_cs: "implementation",
    hr: "people_ops"
  }
  const mapped = alias[String(roleFamily).toLowerCase()] || roleFamily
  const key = mapped as RoleWidgetTemplateFamily
  return structuredClone(roleWidgetTemplates[key] || roleWidgetTemplates[fallback])
}

export function normalizeRoleWidgetConfig(input: unknown): RoleWidgetLane[] {
  if (!Array.isArray(input)) return []

  return input
    .map((lane: any, laneIndex) => ({
      id: String(lane?.id || `lane-${laneIndex + 1}`),
      title: String(lane?.title || `Lane ${laneIndex + 1}`),
      subtitle: String(lane?.subtitle || "flow"),
      steps: Array.isArray(lane?.steps)
        ? lane.steps.slice(0, 6).map((step: any, stepIndex: number) => ({
          id: String(step?.id || `step-${stepIndex + 1}`),
          label: String(step?.label || `Step ${stepIndex + 1}`),
          eta: String(step?.eta || "06s")
        }))
        : []
    }))
    .filter((lane) => lane.steps.length > 0)
}

export const roleWidgetFamilies: Array<{ value: RoleWidgetTemplateFamily; label: string }> = [
  { value: "sales", label: "Sales" },
  { value: "agentic_eng", label: "Agentic Engineering" },
  { value: "marketing", label: "Marketing" },
  { value: "implementation", label: "Implementation / CS" },
  { value: "data_steward", label: "Data Steward" },
  { value: "people_ops", label: "People Ops" }
]
