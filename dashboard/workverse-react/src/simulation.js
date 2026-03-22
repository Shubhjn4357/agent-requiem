import {
  AGENT_BLUEPRINTS,
  CONTRACT_TEMPLATES,
  STAGE_CAPTIONS,
  STAGE_FLOW,
  STAGE_LINES,
  STATIONS
} from "./data";

const FIXED_STEP_MS = 50;
const MAX_ACTIVE_CONTRACTS = 5;
const FEED_LIMIT = 16;

function createRng(seed = 48271) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function createAgent(blueprint, index) {
  const station = STATIONS[blueprint.homeStationId];
  const angle = (Math.PI * 2 * index) / AGENT_BLUEPRINTS.length;
  return {
    ...blueprint,
    x: station.position[0] + Math.cos(angle) * 1.2,
    y: 0.7,
    z: station.position[2] + Math.sin(angle) * 1.2,
    targetX: station.position[0],
    targetY: 0.7,
    targetZ: station.position[2],
    targetStationId: blueprint.homeStationId,
    contractId: null,
    currentStageId: "idle",
    thought: `${blueprint.title} waiting for the next contract.`,
    status: "idle",
    bitBalance: 24 + index * 5,
    thoughtCooldown: 2 + index * 0.4,
    pulse: index * 0.36
  };
}

function createBaseState() {
  return {
    initializedAt: Date.now(),
    timeSeconds: 0,
    isPaused: false,
    bank: 620,
    mintedToday: 0,
    contractsClosed: 0,
    conferenceCount: 0,
    cameraOrbit: 0.72,
    focusAgentId: "codex",
    activeStageId: "signal",
    activeStageCaption: STAGE_CAPTIONS.signal,
    agents: AGENT_BLUEPRINTS.map(createAgent),
    contracts: [],
    archivedContracts: [],
    feed: [],
    lastContractId: 0,
    lastFeedId: 0,
    nextSuggestionAt: 8,
    memory: {
      store: null,
      session: null,
      usage: null,
      status: "idle",
      syncedAt: null
    }
  };
}

function addFeed(state, entry) {
  state.lastFeedId += 1;
  state.feed.unshift({
    id: `feed-${state.lastFeedId}`,
    time: state.timeSeconds,
    ...entry
  });
  state.feed = state.feed.slice(0, FEED_LIMIT);
}

function makeContract(state, random, template, options = {}) {
  state.lastContractId += 1;
  const payoutMin = options.payout ?? template.payoutRange[0];
  const payoutMax = options.payout ?? template.payoutRange[1];
  const payout = options.payout ?? Math.round(payoutMin + random() * (payoutMax - payoutMin));
  const urgency = options.urgency ?? Math.round(template.urgencyRange[0] + random() * (template.urgencyRange[1] - template.urgencyRange[0]));
  const crewIds = [...(options.crewIds ?? template.crew)];
  const titleBase = options.title ?? `${pick(random, template.titleParts)} ${template.id === "urban" ? "Grid" : "Loop"}`;
  return {
    id: options.id ?? `contract-${state.lastContractId}`,
    source: options.source ?? "generated",
    memoryTaskId: options.memoryTaskId ?? null,
    title: titleBase,
    client: options.client ?? template.client,
    category: template.id,
    problem: options.problem ?? template.problem,
    payout,
    urgency,
    crewIds,
    stageIndex: options.stageIndex ?? 0,
    stageProgress: options.stageProgress ?? 0,
    status: options.status ?? "active",
    notes: options.notes ?? "",
    createdAt: state.timeSeconds,
    closedAt: null
  };
}

function selectTemplateForTask(task) {
  const haystack = `${task.title || ""} ${task.description || ""}`.toLowerCase();
  const matched = CONTRACT_TEMPLATES.find((template) =>
    template.keywords.some((keyword) => haystack.includes(keyword))
  );
  return matched ?? CONTRACT_TEMPLATES[0];
}

function createMemoryContracts(state, random, memoryStore, session) {
  if (!memoryStore?.tasks?.length) {
    return [];
  }
  const activeTaskId = session?.active_task_id;
  const rankedTasks = [...memoryStore.tasks]
    .filter((task) => task.status !== "cancelled")
    .sort((left, right) => {
      if (left.id === activeTaskId) {
        return -1;
      }
      if (right.id === activeTaskId) {
        return 1;
      }
      return String(right.updated_at || "").localeCompare(String(left.updated_at || ""));
    })
    .slice(0, 3);

  return rankedTasks.map((task, index) => {
    const template = selectTemplateForTask(task);
    return makeContract(state, random, template, {
      id: `memory-${task.id}`,
      memoryTaskId: task.id,
      source: "memory",
      title: task.title || `Memory Task ${index + 1}`,
      client: task.agent ? `${task.agent} queue` : "Live memory queue",
      problem: task.description || template.problem,
      payout: task.status === "completed" ? 96 : 150 + index * 18,
      urgency: task.status === "completed" ? 48 : 82 - index * 8,
      notes: task.status,
      crewIds: template.crew
    });
  });
}

function ensureActiveContracts(state, random) {
  const activeCount = state.contracts.filter((contract) => contract.status === "active").length;
  if (activeCount >= MAX_ACTIVE_CONTRACTS) {
    return;
  }

  const needed = MAX_ACTIVE_CONTRACTS - activeCount;
  for (let index = 0; index < needed; index += 1) {
    const template = CONTRACT_TEMPLATES[index % CONTRACT_TEMPLATES.length];
    const contract = makeContract(state, random, template);
    state.contracts.push(contract);
    addFeed(state, {
      type: "contract",
      agentId: template.crew[0],
      contractId: contract.id,
      text: `${contract.title} surfaced from ${contract.client}. Crew assembled for ${template.id}.`
    });
  }
}

function findStage(contract) {
  return STAGE_FLOW[Math.min(contract.stageIndex, STAGE_FLOW.length - 1)];
}

function calculateVelocity(state) {
  const minutes = Math.max(1, state.timeSeconds / 60);
  const active = state.contracts.filter((contract) => contract.status === "active").length;
  return round((state.mintedToday / minutes) * (1 + active * 0.08), 1);
}

function generateThought(random, agent, contract, stageId) {
  if (!contract) {
    return `${agent.bias} ${pick(random, [
      "Scanning for the next paid constraint.",
      "Holding position until a signal becomes a job.",
      "Watching the floor for a contract worth BIT."
    ])}`;
  }
  const line = pick(random, STAGE_LINES[stageId] ?? STAGE_LINES.signal);
  return `${agent.label}: ${line} ${contract.title} is moving through ${findStage(contract).label.toLowerCase()}.`;
}

function awardCrew(state, contract) {
  const share = Math.max(8, Math.round(contract.payout / Math.max(1, contract.crewIds.length * 2.2)));
  for (const agent of state.agents) {
    if (contract.crewIds.includes(agent.id)) {
      agent.bitBalance += share;
      agent.status = "idle";
      agent.contractId = null;
      agent.currentStageId = "idle";
    }
  }
}

function transitionContract(state, random, contract) {
  const currentStage = findStage(contract);
  const leadId = contract.crewIds[contract.stageIndex % contract.crewIds.length];
  const leadAgent = state.agents.find((agent) => agent.id === leadId) ?? state.agents[0];

  if (currentStage.id === "conference") {
    state.conferenceCount += 1;
  }

  if (contract.stageIndex >= STAGE_FLOW.length - 1) {
    contract.status = "closed";
    contract.closedAt = state.timeSeconds;
    state.bank += contract.payout;
    state.mintedToday += contract.payout;
    state.contractsClosed += 1;
    awardCrew(state, contract);
    addFeed(state, {
      type: "cashout",
      agentId: leadAgent.id,
      contractId: contract.id,
      text: `${leadAgent.label} closed ${contract.title} for ${contract.payout} BIT. Treasury verified the field result.`
    });
    return;
  }

  contract.stageIndex += 1;
  contract.stageProgress = 0;
  const nextStage = findStage(contract);
  addFeed(state, {
    type: "stage",
    agentId: leadAgent.id,
    contractId: contract.id,
    text: `${leadAgent.label} pushed ${contract.title} into ${nextStage.label}.`
  });
}

function updateContracts(state, random, dt) {
  for (const contract of state.contracts) {
    if (contract.status !== "active") {
      continue;
    }

    const stage = findStage(contract);
    const speed =
      dt *
      (0.9 + contract.crewIds.length * 0.08 + contract.urgency / 160) /
      stage.duration;
    contract.stageProgress += speed;

    if (stage.id === "conference" && random() < dt * 0.3) {
      const speakerId = contract.crewIds[Math.floor(random() * contract.crewIds.length)];
      const speaker = state.agents.find((agent) => agent.id === speakerId) ?? state.agents[0];
      addFeed(state, {
        type: "conference",
        agentId: speaker.id,
        contractId: contract.id,
        text: `${speaker.label} says ${pick(random, STAGE_LINES.conference).toLowerCase()}`
      });
    }

    if (stage.id === "approval" && random() < dt * 0.22) {
      const reviewer = state.agents.find((agent) => agent.id === "rtiny-claw") ?? state.agents[0];
      addFeed(state, {
        type: "approval",
        agentId: reviewer.id,
        contractId: contract.id,
        text: `${reviewer.label} cleared a risk gate for ${contract.title}.`
      });
    }

    if (contract.stageProgress >= 1) {
      transitionContract(state, random, contract);
    }
  }

  const keepActive = [];
  for (const contract of state.contracts) {
    if (contract.status === "closed" && state.timeSeconds - contract.closedAt > 24) {
      state.archivedContracts.unshift(contract);
      continue;
    }
    keepActive.push(contract);
  }
  state.archivedContracts = state.archivedContracts.slice(0, 12);
  state.contracts = keepActive;
}

function updateAgents(state, random, dt) {
  const activeContracts = state.contracts.filter((contract) => contract.status === "active");

  for (const agent of state.agents) {
    const contract = activeContracts.find((item) => item.crewIds.includes(agent.id)) ?? null;
    const stage = contract ? findStage(contract) : null;
    const station = STATIONS[stage?.stationId ?? agent.homeStationId];
    const crewIndex = contract ? contract.crewIds.indexOf(agent.id) : 0;
    const orbit = contract ? (Math.PI * 2 * crewIndex) / Math.max(1, contract.crewIds.length) : agent.pulse;
    const radius = contract ? 1.7 + crewIndex * 0.18 : 1.2;

    agent.targetStationId = station.id;
    agent.targetX = station.position[0] + Math.cos(state.timeSeconds * 0.2 + orbit) * radius;
    agent.targetY = 0.6 + (contract ? 0.15 : 0.05);
    agent.targetZ = station.position[2] + Math.sin(state.timeSeconds * 0.2 + orbit) * radius;
    agent.contractId = contract?.id ?? null;
    agent.currentStageId = stage?.id ?? "idle";
    agent.status = contract ? stage.id : "idle";

    const blend = clamp(dt * 1.9, 0.04, 0.22);
    agent.x += (agent.targetX - agent.x) * blend;
    agent.y += (agent.targetY + Math.sin(state.timeSeconds * 2.4 + agent.pulse) * 0.08 - agent.y) * blend;
    agent.z += (agent.targetZ - agent.z) * blend;

    agent.thoughtCooldown -= dt;
    if (agent.thoughtCooldown <= 0) {
      agent.thought = generateThought(random, agent, contract, stage?.id ?? "signal");
      agent.thoughtCooldown = 4 + random() * 6;
    }
  }
}

function updateGlobalStage(state) {
  const active = state.contracts.find((contract) => contract.status === "active") ?? state.contracts[0];
  const stage = active ? findStage(active) : STAGE_FLOW[0];
  state.activeStageId = stage.id;
  state.activeStageCaption = STAGE_CAPTIONS[stage.id];
}

function bootstrapState(random) {
  const state = createBaseState();
  ensureActiveContracts(state, random);
  addFeed(state, {
    type: "system",
    agentId: "codex",
    contractId: state.contracts[0]?.id ?? null,
    text: "Workverse initialized. Agents are scanning for paid work in the local memory graph."
  });
  return state;
}

function toTextState(state) {
  const focus = state.agents.find((agent) => agent.id === state.focusAgentId) ?? state.agents[0];
  const activeContracts = state.contracts
    .filter((contract) => contract.status === "active")
    .slice(0, 5)
    .map((contract) => {
      const stage = findStage(contract);
      return {
        id: contract.id,
        title: contract.title,
        category: contract.category,
        payout: contract.payout,
        urgency: contract.urgency,
        stage: stage.id,
        stageLabel: stage.label,
        progress: round(contract.stageProgress * 100, 1),
        crew: contract.crewIds
      };
    });

  return JSON.stringify({
    mode: state.isPaused ? "paused" : "running",
    coordinateSystem: "x grows east, z grows south, y is height above the floor plane",
    clockSeconds: round(state.timeSeconds, 2),
    bitBank: state.bank,
    mintedToday: state.mintedToday,
    contractsClosed: state.contractsClosed,
    velocity: calculateVelocity(state),
    focusAgent: focus
      ? {
          id: focus.id,
          label: focus.label,
          stage: focus.currentStageId,
          station: focus.targetStationId,
          position: [round(focus.x, 2), round(focus.y, 2), round(focus.z, 2)],
          thought: focus.thought
        }
      : null,
    agents: state.agents.map((agent) => ({
      id: agent.id,
      station: agent.targetStationId,
      stage: agent.currentStageId,
      position: [round(agent.x, 2), round(agent.y, 2), round(agent.z, 2)]
    })),
    contracts: activeContracts,
    feed: state.feed.slice(0, 4).map((entry) => ({
      type: entry.type,
      agentId: entry.agentId,
      contractId: entry.contractId,
      text: entry.text
    }))
  });
}

export function createWorkverseStore() {
  const random = createRng(99173);
  const listeners = new Set();
  let state = bootstrapState(random);
  let frameHandle = 0;
  let accumulator = 0;
  let lastTick = 0;

  const publish = () => {
    state = {
      ...state,
      agents: [...state.agents],
      contracts: [...state.contracts],
      archivedContracts: [...state.archivedContracts],
      feed: [...state.feed],
      memory: { ...state.memory }
    };
    for (const listener of listeners) {
      listener();
    }
  };

  const step = (dt, { force = false } = {}) => {
    if (state.isPaused && !force) {
      return;
    }

    state.timeSeconds += dt;
    state.nextSuggestionAt -= dt;

    updateContracts(state, random, dt);
    updateAgents(state, random, dt);

    if (state.nextSuggestionAt <= 0) {
      ensureActiveContracts(state, random);
      const scout = state.agents.find((agent) => agent.id === "tiny-claw") ?? state.agents[0];
      addFeed(state, {
        type: "signal",
        agentId: scout.id,
        contractId: state.contracts[0]?.id ?? null,
        text: `${scout.label} pushed a fresh neighborhood signal into the queue.`
      });
      state.nextSuggestionAt = 12 + random() * 12;
    }

    updateGlobalStage(state);
  };

  const drive = (now) => {
    if (!lastTick) {
      lastTick = now;
    }
    const delta = Math.min(250, now - lastTick);
    lastTick = now;
    accumulator += delta;

    let changed = false;
    while (accumulator >= FIXED_STEP_MS) {
      step(FIXED_STEP_MS / 1000);
      accumulator -= FIXED_STEP_MS;
      changed = true;
    }

    if (changed) {
      publish();
    }

    frameHandle = window.requestAnimationFrame(drive);
  };

  const syncMemoryContracts = (store, session) => {
    const newContracts = createMemoryContracts(state, random, store, session);
    for (const contract of newContracts) {
      const existing = state.contracts.find((item) => item.memoryTaskId === contract.memoryTaskId);
      if (!existing) {
        state.contracts.unshift(contract);
        addFeed(state, {
          type: "memory",
          agentId: contract.crewIds[0],
          contractId: contract.id,
          text: `${contract.title} was injected from the shared memory queue.`
        });
      }
    }
    state.contracts = state.contracts.slice(0, 10);
    ensureActiveContracts(state, random);
    updateGlobalStage(state);
  };

  const api = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
    start() {
      if (!frameHandle) {
        frameHandle = window.requestAnimationFrame(drive);
      }
    },
    stop() {
      if (frameHandle) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = 0;
      }
      lastTick = 0;
      accumulator = 0;
    },
    togglePause() {
      state.isPaused = !state.isPaused;
      publish();
    },
    spawnContract() {
      const template = pick(random, CONTRACT_TEMPLATES);
      const contract = makeContract(state, random, template);
      state.contracts.unshift(contract);
      addFeed(state, {
        type: "contract",
        agentId: template.crew[0],
        contractId: contract.id,
        text: `${contract.title} was commissioned manually from ${contract.client}.`
      });
      updateGlobalStage(state);
      publish();
    },
    forceConference() {
      const contract = state.contracts.find((item) => item.status === "active");
      if (!contract) {
        return;
      }
      const conferenceIndex = STAGE_FLOW.findIndex((stage) => stage.id === "conference");
      contract.stageIndex = Math.max(contract.stageIndex, conferenceIndex);
      contract.stageProgress = 0.15;
      state.conferenceCount += 1;
      addFeed(state, {
        type: "conference",
        agentId: contract.crewIds[0],
        contractId: contract.id,
        text: `${contract.title} was escalated into a live conference review.`
      });
      updateGlobalStage(state);
      publish();
    },
    cycleFocus() {
      const currentIndex = state.agents.findIndex((agent) => agent.id === state.focusAgentId);
      const next = state.agents[(currentIndex + 1 + state.agents.length) % state.agents.length];
      state.focusAgentId = next.id;
      publish();
    },
    focusAgent(agentId) {
      if (!state.agents.some((agent) => agent.id === agentId)) {
        return;
      }
      state.focusAgentId = agentId;
      publish();
    },
    rotateCamera(delta) {
      state.cameraOrbit += delta;
      publish();
    },
    async loadMemory() {
      state.memory.status = "loading";
      publish();
      try {
        const [storeResponse, sessionResponse, usageResponse] = await Promise.all([
          fetch("/runtime/memory-store.json"),
          fetch("/runtime/session.json"),
          fetch("/runtime/usage-tracker.json").catch(() => null)
        ]);
        const [store, session, usage] = await Promise.all([
          storeResponse.json(),
          sessionResponse.json(),
          usageResponse?.json?.() ?? null
        ]);
        state.memory = {
          store,
          session,
          usage,
          status: "ready",
          syncedAt: new Date().toISOString()
        };
        syncMemoryContracts(store, session);
        publish();
      } catch (error) {
        state.memory.status = "error";
        addFeed(state, {
          type: "system",
          agentId: "codex",
          contractId: null,
          text: `Memory sync failed: ${error.message}`
        });
        publish();
      }
    },
    setMemoryData({ store, session, usage }) {
      state.memory = {
        store,
        session,
        usage,
        status: "ready",
        syncedAt: new Date().toISOString()
      };
      syncMemoryContracts(store, session);
      publish();
    },
    advanceBy(ms) {
      const iterations = Math.max(1, Math.round(ms / FIXED_STEP_MS));
      for (let index = 0; index < iterations; index += 1) {
        step(FIXED_STEP_MS / 1000, { force: true });
      }
      publish();
    },
    renderToText() {
      return toTextState(state);
    }
  };

  return api;
}
