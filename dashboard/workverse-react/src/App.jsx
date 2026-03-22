import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useSyncExternalStore
} from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { STAGE_FLOW, STATIONS } from "./data";
import { createWorkverseStore } from "./simulation";

function formatBit(value) {
  return `${Math.round(value).toLocaleString()} BIT`;
}

function formatClock(seconds) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen?.();
}

export default function App() {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = createWorkverseStore();
  }
  const store = storeRef.current;
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const deferredFeed = useDeferredValue(state.feed);
  const deferredContracts = useDeferredValue(state.contracts);

  const focusAgent = state.agents.find((agent) => agent.id === state.focusAgentId) ?? state.agents[0];
  const focusContract =
    deferredContracts.find((contract) => contract.id === focusAgent?.contractId && contract.status === "active") ??
    deferredContracts.find((contract) => contract.status === "active") ??
    deferredContracts[0];
  const focusStage = focusContract ? STAGE_FLOW[focusContract.stageIndex] : STAGE_FLOW[0];
  const activeContracts = deferredContracts.filter((contract) => contract.status === "active");
  const velocity = Math.max(0, state.mintedToday / Math.max(1, state.timeSeconds / 60));

  const refreshMemory = useEffectEvent(() => {
    void store.loadMemory();
  });

  const handleKeyDown = useEffectEvent((event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      store.togglePause();
    }
    if (event.key === "n") {
      store.spawnContract();
    }
    if (event.key === "c") {
      store.forceConference();
    }
    if (event.key === "f") {
      toggleFullscreen();
    }
    if (event.key === "ArrowLeft") {
      store.rotateCamera(-0.18);
    }
    if (event.key === "ArrowRight") {
      store.rotateCamera(0.18);
    }
  });

  useEffect(() => {
    store.start();
    refreshMemory();
    const syncTimer = window.setInterval(refreshMemory, 15000);
    window.render_game_to_text = () => store.renderToText();
    window.advanceTime = (ms) => store.advanceBy(ms);
    window.WorkverseDashboard = {
      setMemoryData(payload) {
        store.setMemoryData(payload);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      store.stop();
      window.clearInterval(syncTimer);
      window.removeEventListener("keydown", handleKeyDown);
      delete window.render_game_to_text;
      delete window.advanceTime;
      delete window.WorkverseDashboard;
    };
  }, [handleKeyDown, refreshMemory, store]);

  return (
    <div className="workverse-app">
      <div className="noise-layer" />
      <header className="hero-shell">
        <div className="hero-copy panel-card">
          <span className="eyebrow">Offline agent economy</span>
          <h1>Workverse</h1>
          <p>
            A local Three Fiber world where specialized agents source work, debate it, build the solution,
            clear approval gates, deploy into the real world, and mint BIT only after verified outcomes.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => store.togglePause()}>
              {state.isPaused ? "Resume flow" : "Pause flow"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => {
                startTransition(() => store.spawnContract());
              }}
            >
              Commission contract
            </button>
            <button
              className="secondary-btn"
              onClick={() => {
                startTransition(() => store.forceConference());
              }}
            >
              Force conference
            </button>
          </div>
        </div>

        <div className="metric-grid">
          <article className="metric-card panel-card">
            <span>Shared bank</span>
            <strong>{formatBit(state.bank)}</strong>
            <small>Coins earned from verified work</small>
          </article>
          <article className="metric-card panel-card">
            <span>Minted today</span>
            <strong>{formatBit(state.mintedToday)}</strong>
            <small>Fresh BIT from closed contracts</small>
          </article>
          <article className="metric-card panel-card">
            <span>Contracts closed</span>
            <strong>{state.contractsClosed}</strong>
            <small>End-to-end jobs completed</small>
          </article>
          <article className="metric-card panel-card">
            <span>Velocity</span>
            <strong>{velocity.toFixed(1)} BIT/min</strong>
            <small>Live output across the active crew</small>
          </article>
        </div>
      </header>

      <main className="workspace-grid">
        <section className="scene-column panel-card">
          <div className="scene-toolbar">
            <div>
              <span className="toolbar-label">Clock</span>
              <strong>{formatClock(state.timeSeconds)}</strong>
            </div>
            <div>
              <span className="toolbar-label">Current stage</span>
              <strong>{focusStage.label}</strong>
            </div>
            <div>
              <span className="toolbar-label">Memory sync</span>
              <strong>{state.memory.status}</strong>
            </div>
            <div className="toolbar-buttons">
              <button className="ghost-btn" onClick={() => store.cycleFocus()}>
                Cycle focus
              </button>
              <button className="ghost-btn" onClick={toggleFullscreen}>
                Fullscreen
              </button>
            </div>
          </div>

          <div className="scene-frame">
            <Canvas
              shadows
              camera={{ position: [16, 12, 20], fov: 42 }}
              dpr={[1, 1.6]}
            >
              <Scene state={state} onSelectAgent={(agentId) => store.focusAgent(agentId)} />
            </Canvas>

            <div className="overlay-row">
              <section className="overlay-card">
                <span className="overlay-label">Focused worker</span>
                <h2>{focusAgent?.label ?? "No agent"}</h2>
                <p>{focusAgent?.thought ?? "No thought available."}</p>
                <dl className="overlay-stats">
                  <div>
                    <dt>Job</dt>
                    <dd>{focusAgent?.title}</dd>
                  </div>
                  <div>
                    <dt>Stage</dt>
                    <dd>{focusAgent?.currentStageId}</dd>
                  </div>
                  <div>
                    <dt>Wallet</dt>
                    <dd>{formatBit(focusAgent?.bitBalance ?? 0)}</dd>
                  </div>
                </dl>
              </section>

              <section className="overlay-card">
                <span className="overlay-label">Workflow state</span>
                <h2>{focusStage.label}</h2>
                <p>{state.activeStageCaption}</p>
                <dl className="overlay-stats">
                  <div>
                    <dt>Contract</dt>
                    <dd>{focusContract?.title ?? "No active contract"}</dd>
                  </div>
                  <div>
                    <dt>Client</dt>
                    <dd>{focusContract?.client ?? "Waiting"}</dd>
                  </div>
                  <div>
                    <dt>Urgency</dt>
                    <dd>{focusContract?.urgency ?? 0}%</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          <footer className="hint-strip">
            <span>`space` pause</span>
            <span>`n` new contract</span>
            <span>`c` conference</span>
            <span>`f` fullscreen</span>
            <span>arrow keys orbit camera</span>
            <span>click an agent to inspect it</span>
          </footer>
        </section>

        <aside className="sidebar-column">
          <section className="panel-card sidebar-card">
            <div className="card-heading">
              <h3>Worker roster</h3>
              <span>{state.agents.length}</span>
            </div>
            <div className="list-stack">
              {state.agents.map((agent) => (
                <button
                  key={agent.id}
                  className={`list-item agent-item ${agent.id === state.focusAgentId ? "is-focused" : ""}`}
                  onClick={() => store.focusAgent(agent.id)}
                >
                  <div className="list-topline">
                    <strong>{agent.label}</strong>
                    <span>{agent.status}</span>
                  </div>
                  <small>{agent.title}</small>
                  <p>{agent.realWorldJob}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel-card sidebar-card">
            <div className="card-heading">
              <h3>Contracts</h3>
              <span>{activeContracts.length} active</span>
            </div>
            <div className="list-stack">
              {activeContracts.map((contract) => (
                <article key={contract.id} className="list-item contract-item">
                  <div className="list-topline">
                    <strong>{contract.title}</strong>
                    <span>{contract.category}</span>
                  </div>
                  <small>{contract.client}</small>
                  <p>{contract.problem}</p>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.max(8, contract.stageProgress * 100)}%` }}
                    />
                  </div>
                  <div className="micro-meta">
                    <span>{STAGE_FLOW[contract.stageIndex].label}</span>
                    <span>{contract.urgency}% urgency</span>
                    <span>{formatBit(contract.payout)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-card sidebar-card">
            <div className="card-heading">
              <h3>Conference feed</h3>
              <span>{state.conferenceCount} rooms</span>
            </div>
            <div className="list-stack">
              {deferredFeed.slice(0, 8).map((entry) => (
                <article key={entry.id} className="list-item feed-item">
                  <div className="list-topline">
                    <strong>{entry.type}</strong>
                    <span>{formatClock(entry.time)}</span>
                  </div>
                  <small>{entry.agentId ?? "system"}</small>
                  <p>{entry.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-card sidebar-card inspector-card">
            <div className="card-heading">
              <h3>Inspector</h3>
              <span>{focusAgent?.targetStationId}</span>
            </div>
            <p>{focusAgent?.bias}</p>
            <dl className="inspector-grid">
              <div>
                <dt>Domain</dt>
                <dd>{focusAgent?.domain}</dd>
              </div>
              <div>
                <dt>Station</dt>
                <dd>{STATIONS[focusAgent?.targetStationId]?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Current contract</dt>
                <dd>{focusContract?.title ?? "Idle"}</dd>
              </div>
              <div>
                <dt>Memory task</dt>
                <dd>{state.memory.session?.active_task_id ?? "None"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>
    </div>
  );
}
