import { lazy, Suspense, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { getTeamLivery } from "../../data/teamLiveries";
import { driverPortrait } from "../../data/visualAssets";
import useReducedMotion from "../../hooks/useReducedMotion";
import FlagBadge from "../ui/FlagBadge";
import TeamLogo from "../ui/TeamLogo";
import { SceneBoundary } from "./CarShowcase";
import "./driverShowcase.css";

const DriverScene = lazy(() => import("./DriverScene"));
function Control({ label, children, ...props }) {
    return <button type="button" className="driver-scene-control" aria-label={label} title={label} {...props}>{children}<span aria-hidden="true">{label}</span></button>;
}

export default function DriverShowcase({ team, driver, onBack }) {
    const livery = getTeamLivery(team);
    const reduced = useReducedMotion();
    const [mode, setMode] = useState("3d");
    const [paused, setPaused] = useState(false);
    const [angle, setAngle] = useState(0);
    const [unavailable, setUnavailable] = useState(false);
    const [ready, setReady] = useState(false);
    const portrait = driver ? <img className="driver-portrait-main" src={driverPortrait(driver)} alt={`${driver.name} ${driver.surname}`} /> : null;
    const is3d = mode === "3d" && !unavailable;
    return <section className="driver-showcase" style={{ "--driver-color": livery.color }} aria-label="Présentation du pilote">
        {driver && <div className="driver-stage-media">{is3d ? <SceneBoundary onUnavailable={() => setUnavailable(true)} fallback={portrait}><Suspense fallback={portrait}><DriverScene driver={driver} livery={livery} paused={paused} reduced={reduced} angle={angle} onDrag={() => setPaused(true)} onReady={() => setReady(true)} onUnavailable={() => setUnavailable(true)} /></Suspense></SceneBoundary> : portrait}</div>}
        <header className="driver-stage-heading"><div><span>{livery.name.toUpperCase()} / LINE-UP {2026}</span><h1>Choisis ton pilote</h1></div><div className="driver-team-logo"><TeamLogo team={team} /></div></header>
        <div className="driver-display-mode" role="group" aria-label="Présentation du pilote"><button type="button" aria-pressed={is3d} disabled={unavailable} onClick={() => setMode("3d")}>Avatar 3D</button><button type="button" aria-pressed={!is3d} onClick={() => setMode("portrait")}>Portrait</button></div>
        {driver && <><div className="driver-stage-identity" key={driver.id}><img src={driverPortrait(driver)} alt="" /><div><FlagBadge country={driver.country} compact /><span className="driver-firstname">{driver.name}</span><h2>{driver.surname}</h2></div></div><span className="driver-stage-number" aria-hidden="true">{driver.number}</span></>}
        {is3d && <><span className="driver-model-note">Avatar casqué stylisé</span><div className="driver-scene-controls" role="group" aria-label="Rotation du pilote">
            <Control label="Tourner le pilote à gauche" onClick={() => { setPaused(true); setAngle((value) => value - Math.PI / 2); }}><ArrowLeft size={17} /></Control>
            <Control label="Tourner le pilote à droite" onClick={() => { setPaused(true); setAngle((value) => value + Math.PI / 2); }}><ArrowRight size={17} /></Control>
            <Control label={paused || reduced ? "Lancer la rotation du pilote" : "Mettre la rotation du pilote en pause"} disabled={reduced || !ready} onClick={() => setPaused((value) => !value)}>{paused || reduced ? <Play size={17} /> : <Pause size={17} />}</Control>
            <Control label="Recentrer le pilote" onClick={() => { setAngle((value) => Math.ceil(value / (Math.PI * 2)) * Math.PI * 2 + Math.PI * 2); setPaused(true); }}><RotateCcw size={17} /></Control>
        </div></>}
        <button type="button" className="driver-back-button" onClick={onBack}><ArrowLeft size={16} />Écuries</button>
    </section>;
}
