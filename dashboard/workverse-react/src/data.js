export const STAGE_FLOW = [
  { id: "signal", label: "Signal Dock", stationId: "signal-dock", duration: 12 },
  { id: "interpret", label: "Insight Forge", stationId: "insight-forge", duration: 16 },
  { id: "conference", label: "Conference Ring", stationId: "conference-ring", duration: 14 },
  { id: "build", label: "Maker Bay", stationId: "maker-bay", duration: 18 },
  { id: "approval", label: "Approval Bridge", stationId: "approval-bridge", duration: 10 },
  { id: "field", label: "Field Gate", stationId: "field-gate", duration: 20 },
  { id: "cashout", label: "Treasury Spire", stationId: "treasury-spire", duration: 8 }
];

export const STATIONS = {
  "signal-dock": {
    id: "signal-dock",
    name: "Signal Dock",
    position: [-14, 0, 10],
    scale: [4.8, 1.2, 4.2],
    tone: "#5dd6ff",
    accent: "#b2efff"
  },
  "insight-forge": {
    id: "insight-forge",
    name: "Insight Forge",
    position: [-6, 0, -4],
    scale: [4.2, 1.4, 4.2],
    tone: "#ff965c",
    accent: "#ffd2bb"
  },
  "conference-ring": {
    id: "conference-ring",
    name: "Conference Ring",
    position: [0, 0, 0],
    scale: [6.2, 1.3, 6.2],
    tone: "#98ffb2",
    accent: "#dfffe8"
  },
  "maker-bay": {
    id: "maker-bay",
    name: "Maker Bay",
    position: [9, 0, 8],
    scale: [5.2, 1.4, 4.2],
    tone: "#9f8cff",
    accent: "#d8d1ff"
  },
  "approval-bridge": {
    id: "approval-bridge",
    name: "Approval Bridge",
    position: [14, 0, -3],
    scale: [5.4, 1.1, 4.4],
    tone: "#ffe069",
    accent: "#fff3b8"
  },
  "field-gate": {
    id: "field-gate",
    name: "Field Gate",
    position: [4, 0, -14],
    scale: [4.8, 1.2, 5.1],
    tone: "#58f1a8",
    accent: "#bcffe0"
  },
  "treasury-spire": {
    id: "treasury-spire",
    name: "Treasury Spire",
    position: [-11, 0, -13],
    scale: [4.4, 1.8, 4.4],
    tone: "#74f3ff",
    accent: "#d4fdff"
  }
};

export const AGENT_BLUEPRINTS = [
  {
    id: "antigravity",
    label: "Antigravity",
    title: "Field Economist",
    realWorldJob: "Turns underused city blocks into profitable solar yards.",
    homeStationId: "signal-dock",
    domain: "urban systems",
    bias: "Sees hidden leverage in rough terrain.",
    color: "#48d8ff",
    accent: "#c6f7ff"
  },
  {
    id: "gemini",
    label: "Gemini",
    title: "Clinic Strategist",
    realWorldJob: "Cuts waiting time for neighborhood health clinics.",
    homeStationId: "insight-forge",
    domain: "health operations",
    bias: "Optimizes intake before anyone else sees the queue.",
    color: "#88ffb7",
    accent: "#d8ffe6"
  },
  {
    id: "codex",
    label: "Codex",
    title: "Automation Engineer",
    realWorldJob: "Builds permit bots and civic workflow automations.",
    homeStationId: "maker-bay",
    domain: "automation",
    bias: "Prefers shipping a working loop before polishing it.",
    color: "#ff9b5d",
    accent: "#ffe1cf"
  },
  {
    id: "claude",
    label: "Claude",
    title: "Policy Researcher",
    realWorldJob: "Writes compliant service playbooks for public rollout.",
    homeStationId: "approval-bridge",
    domain: "governance",
    bias: "Red-teams every idea until it is defensible.",
    color: "#fff08c",
    accent: "#fffad8"
  },
  {
    id: "cursor",
    label: "Cursor",
    title: "UX Architect",
    realWorldJob: "Designs kiosks and citizen-facing digital touchpoints.",
    homeStationId: "conference-ring",
    domain: "experience design",
    bias: "Translates abstract plans into human actions.",
    color: "#bda9ff",
    accent: "#ece6ff"
  },
  {
    id: "copilot",
    label: "Copilot",
    title: "Dispatch Planner",
    realWorldJob: "Routes crews, parts, and timing across the city.",
    homeStationId: "field-gate",
    domain: "logistics",
    bias: "Optimizes the path before the meeting ends.",
    color: "#65f0c6",
    accent: "#d7fff2"
  },
  {
    id: "claw",
    label: "Claw",
    title: "Negotiation Lead",
    realWorldJob: "Closes partner contracts and district agreements.",
    homeStationId: "approval-bridge",
    domain: "dealmaking",
    bias: "Knows the price of delay and pushes signatures through.",
    color: "#ff7bb0",
    accent: "#ffd9e8"
  },
  {
    id: "tiny-claw",
    label: "Tiny Claw",
    title: "Street Scout",
    realWorldJob: "Collects demand signals from retail corners and markets.",
    homeStationId: "signal-dock",
    domain: "field sensing",
    bias: "Finds weak signals before they turn into crises.",
    color: "#7ce7ff",
    accent: "#d9f8ff"
  },
  {
    id: "pico-claw",
    label: "Pico Claw",
    title: "Sensor Technician",
    realWorldJob: "Maintains low-cost field sensors and device health.",
    homeStationId: "field-gate",
    domain: "hardware",
    bias: "Trusts instrumentation over intuition.",
    color: "#ffb870",
    accent: "#ffebd4"
  },
  {
    id: "micro-claw",
    label: "Micro Claw",
    title: "Microfabricator",
    realWorldJob: "Prints replacement parts overnight for live repairs.",
    homeStationId: "maker-bay",
    domain: "fabrication",
    bias: "Shrinks turnaround time with rapid part swaps.",
    color: "#9fd2ff",
    accent: "#e3f3ff"
  },
  {
    id: "nano-claw",
    label: "Nano Claw",
    title: "Inventory Runner",
    realWorldJob: "Keeps scarce components moving across last-meter routes.",
    homeStationId: "field-gate",
    domain: "supply chains",
    bias: "Treats every minute in storage as wasted BIT.",
    color: "#8fffda",
    accent: "#dcfff2"
  },
  {
    id: "rtiny-claw",
    label: "RTiny Claw",
    title: "Risk Analyst",
    realWorldJob: "Approves edge cases, risk gates, and payout safety checks.",
    homeStationId: "treasury-spire",
    domain: "risk controls",
    bias: "Blocks fragile plans before they burn cash.",
    color: "#ffd86c",
    accent: "#fff2c4"
  }
];

export const CONTRACT_TEMPLATES = [
  {
    id: "urban",
    client: "Ward Grid 11",
    titleParts: ["Microgrid", "Storm Drain Twin", "Transit Queue", "Heat Map"],
    problem: "Rework city infrastructure so it pays back in weekly BIT.",
    payoutRange: [120, 240],
    urgencyRange: [58, 92],
    crew: ["antigravity", "codex", "cursor", "copilot"],
    keywords: ["grid", "permit", "city", "urban", "transit", "civic"]
  },
  {
    id: "health",
    client: "Clinic Mesh North",
    titleParts: ["Triage Loop", "Shift Tuner", "Care Router", "Queue Compressor"],
    problem: "Remove bottlenecks in clinics without breaking compliance.",
    payoutRange: [130, 260],
    urgencyRange: [64, 96],
    crew: ["gemini", "claude", "codex", "rtiny-claw"],
    keywords: ["health", "clinic", "care", "patient", "medical"]
  },
  {
    id: "education",
    client: "Learning Block 5",
    titleParts: ["Attendance Orbit", "Scholar Route", "Lab Refresh", "Tutor Mesh"],
    problem: "Deliver better school operations with visible local outcomes.",
    payoutRange: [110, 210],
    urgencyRange: [48, 88],
    crew: ["cursor", "codex", "claw", "tiny-claw"],
    keywords: ["school", "education", "student", "campus", "learning"]
  },
  {
    id: "retail",
    client: "Market Ring East",
    titleParts: ["Shelf Pulse", "Night Restock", "Demand Radar", "Footfall Loop"],
    problem: "Match inventory to block-by-block demand before losses pile up.",
    payoutRange: [90, 190],
    urgencyRange: [54, 84],
    crew: ["claw", "tiny-claw", "nano-claw", "copilot"],
    keywords: ["retail", "market", "shop", "store", "demand"]
  },
  {
    id: "infrastructure",
    client: "Public Works Delta",
    titleParts: ["Signal Retrofit", "Bridge Audit", "Water Relay", "Repair Grid"],
    problem: "Keep civic services alive under tight physical constraints.",
    payoutRange: [150, 300],
    urgencyRange: [62, 98],
    crew: ["antigravity", "pico-claw", "micro-claw", "rtiny-claw"],
    keywords: ["bridge", "repair", "water", "signal", "infrastructure"]
  },
  {
    id: "logistics",
    client: "Freight Weave South",
    titleParts: ["Dock Sync", "Route Twin", "Last Meter", "Parcel Pulse"],
    problem: "Shorten delivery paths while preserving margin and reliability.",
    payoutRange: [100, 220],
    urgencyRange: [55, 90],
    crew: ["copilot", "nano-claw", "pico-claw", "codex"],
    keywords: ["route", "delivery", "logistics", "freight", "parcel"]
  }
];

export const STAGE_LINES = {
  signal: [
    "I found a live signal. Route it before the city notices the lag.",
    "Demand just spiked on a real block. We can monetize the response.",
    "Fresh telemetry is clean. This contract is grounded in real need."
  ],
  interpret: [
    "The pattern is stable enough to model. We can shape the response.",
    "The signal was noise until the data lined up. Now it is a market.",
    "This looks solvable if we cut three redundant steps."
  ],
  conference: [
    "Bring the crew in. We need friction, counterarguments, then a decision.",
    "Conference mode is live. Challenge the idea until it survives.",
    "No more solo thinking. The contract needs a hard room."
  ],
  build: [
    "Prototype first, explain second. Working systems win the room.",
    "Maker Bay is hot. We can move from concept to toolchain now.",
    "The model is good enough. Ship the machinery."
  ],
  approval: [
    "Push it through compliance without losing the speed advantage.",
    "Approval is a design problem too. Make the evidence legible.",
    "No payout without a defensible risk envelope."
  ],
  field: [
    "Field crews are moving. Reality is about to grade the plan.",
    "Deployment window is open. The job is real now.",
    "Outcomes only count once the district can feel them."
  ],
  cashout: [
    "The treasury sees verified value. Mint the BIT.",
    "Payout is unlocked. Route earnings back into the bank.",
    "Proof landed. We can close the loop and count the return."
  ]
};

export const STAGE_CAPTIONS = {
  signal: "Signals are scanned from memory, market noise, and field reports.",
  interpret: "Agents explain the signal, model the opportunity, and narrow options.",
  conference: "Agents debate, combine ideas, and lock a defendable plan.",
  build: "Tools, flows, and prototypes are assembled into a working system.",
  approval: "Risk, policy, and partner approval gates are negotiated in sequence.",
  field: "Crews take the work into real neighborhoods, clinics, and supply lines.",
  cashout: "Verified impact unlocks BIT and rolls it back into the shared bank."
};
