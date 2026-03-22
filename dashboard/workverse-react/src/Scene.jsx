import * as THREE from "three";
import { Line, Sparkles, Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { AGENT_BLUEPRINTS, STAGE_FLOW, STATIONS } from "./data";

function CameraRig({ state }) {
  const { camera } = useThree();
  const cameraTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  useFrame(() => {
    const focus = state.agents.find((agent) => agent.id === state.focusAgentId) ?? state.agents[0];
    const radius = 24;
    cameraTarget.set(
      focus.x + Math.cos(state.cameraOrbit) * radius,
      12 + Math.sin(state.timeSeconds * 0.16) * 1.2,
      focus.z + Math.sin(state.cameraOrbit) * radius
    );
    lookTarget.set(focus.x, 1.1, focus.z);
    camera.position.lerp(cameraTarget, 0.05);
    camera.lookAt(lookTarget);
  });

  return null;
}

function Floor() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#07111d" metalness={0.15} roughness={0.92} />
      </mesh>
      <gridHelper args={[80, 40, "#17354f", "#102030"]} position={[0, 0, 0]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[8, 28, 96]} />
        <meshBasicMaterial color="#0d334f" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ContractLanes({ contracts }) {
  return contracts
    .filter((contract) => contract.status === "active")
    .slice(0, 5)
    .map((contract, index) => {
      const path = STAGE_FLOW.map((stage) => {
        const station = STATIONS[stage.stationId];
        return [station.position[0], 0.25 + index * 0.06, station.position[2]];
      });
      return (
        <Line
          key={contract.id}
          points={path}
          color={index % 2 === 0 ? "#63d8ff" : "#8df7b2"}
          transparent
          opacity={0.25}
          lineWidth={1.2}
        />
      );
    });
}

function StationCluster({ station, activeCount }) {
  const towerHeight = 1.8 + activeCount * 0.45;
  const glowStrength = 0.2 + activeCount * 0.12;
  return (
    <group position={station.position}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[station.scale[0] * 0.5, station.scale[2] * 0.55, 0.36, 24]} />
        <meshStandardMaterial color="#0e1725" metalness={0.25} roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, towerHeight * 0.5 + 0.2, 0]}>
        <boxGeometry args={[station.scale[0] * 0.56, towerHeight, station.scale[2] * 0.44]} />
        <meshStandardMaterial
          color={station.tone}
          emissive={station.tone}
          emissiveIntensity={glowStrength}
          metalness={0.4}
          roughness={0.28}
        />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0.15, 0]}>
        <torusGeometry args={[station.scale[0] * 0.68, 0.06, 18, 48]} />
        <meshStandardMaterial color={station.accent} emissive={station.accent} emissiveIntensity={0.35 + activeCount * 0.14} />
      </mesh>
      {activeCount > 0 ? (
        <Sparkles
          count={10 + activeCount * 6}
          scale={[station.scale[0] * 1.5, 3.2, station.scale[2] * 1.5]}
          size={3}
          speed={0.5 + activeCount * 0.12}
          color={station.accent}
          position={[0, 1.8, 0]}
        />
      ) : null}
    </group>
  );
}

function TreasuryBits({ bank }) {
  const count = Math.max(4, Math.min(18, Math.round(bank / 120)));
  const station = STATIONS["treasury-spire"];
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const radius = 1.6 + (index % 3) * 0.32;
    return (
      <mesh
        key={`bit-${index}`}
        position={[
          station.position[0] + Math.cos(angle) * radius,
          2.3 + (index % 4) * 0.28,
          station.position[2] + Math.sin(angle) * radius
        ]}
        rotation={[angle, angle * 0.5, 0]}
        castShadow
      >
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#74f3ff" emissive="#74f3ff" emissiveIntensity={0.55} metalness={0.8} roughness={0.1} />
      </mesh>
    );
  });
}

function AgentMesh({ agent, focused, onSelect }) {
  return (
    <group position={[agent.x, agent.y, agent.z]} onClick={() => onSelect(agent.id)}>
      {focused ? (
        <mesh rotation-x={Math.PI / 2} position={[0, -0.14, 0]}>
          <torusGeometry args={[0.66, 0.06, 12, 32]} />
          <meshBasicMaterial color={agent.accent} transparent opacity={0.9} />
        </mesh>
      ) : null}
      <mesh castShadow>
        <sphereGeometry args={[0.38, 18, 18]} />
        <meshPhysicalMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={focused ? 0.95 : 0.5}
          roughness={0.2}
          metalness={0.42}
          clearcoat={0.4}
        />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation-z={Math.PI * 0.25}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={agent.accent} emissive={agent.accent} emissiveIntensity={0.48} />
      </mesh>
    </group>
  );
}

function WorldLights() {
  return (
    <>
      <color attach="background" args={["#030916"]} />
      <fog attach="fog" args={["#030916", 24, 68]} />
      <ambientLight intensity={0.55} color="#8bc8ff" />
      <directionalLight
        castShadow
        intensity={1.6}
        color="#f5f0d0"
        position={[12, 18, 8]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-14, 7, 10]} intensity={14} distance={18} color="#5dd6ff" />
      <pointLight position={[9, 8, 8]} intensity={12} distance={18} color="#9f8cff" />
      <pointLight position={[-11, 10, -13]} intensity={13} distance={22} color="#74f3ff" />
    </>
  );
}

export default function Scene({ state, onSelectAgent }) {
  const stationLoad = Object.values(STATIONS).reduce((accumulator, station) => {
    accumulator[station.id] = state.contracts.filter((contract) => {
      return contract.status === "active" && STAGE_FLOW[contract.stageIndex]?.stationId === station.id;
    }).length;
    return accumulator;
  }, {});

  return (
    <>
      <WorldLights />
      <Stars radius={120} depth={64} count={2200} factor={4} fade speed={0.45} />
      <CameraRig state={state} />
      <Floor />
      <ContractLanes contracts={state.contracts} />

      {Object.values(STATIONS).map((station) => (
        <StationCluster key={station.id} station={station} activeCount={stationLoad[station.id] ?? 0} />
      ))}

      <group>
        {state.agents.map((agent) => (
          <AgentMesh
            key={agent.id}
            agent={agent}
            focused={agent.id === state.focusAgentId}
            onSelect={onSelectAgent}
          />
        ))}
      </group>

      <TreasuryBits bank={state.bank} />
      <Sparkles count={34} scale={[58, 10, 58]} size={2.4} speed={0.18} color="#8fd9ff" position={[0, 3.6, 0]} />
    </>
  );
}
