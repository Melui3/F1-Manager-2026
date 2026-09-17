import { Component, lazy, Suspense, useState } from "react";
import { Camera, Pause, Play, RotateCcw, ScanLine, View } from "lucide-react";
import { getTeamLivery } from "../../data/teamLiveries";
import useReducedMotion from "../../hooks/useReducedMotion";
import FlagBadge from "../ui/FlagBadge";
import TeamLogo from "../ui/TeamLogo";
import "./presentation.css";

const CarScene = lazy(() => import("./CarScene"));

export class SceneBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onUnavailable?.(); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function CarFallback({ livery }) {
    return (
        <div className="race-car-fallback">
            <TeamLogo team={livery.name} />
        </div>
    );
}

function SceneButton({ label, children, ...props }) {
    return <button type="button" className="showroom-control" title={label} aria-label={label} {...props}>{children}<span className="showroom-tooltip" aria-hidden="true">{label}</span></button>;
}

export default function CarShowcase({ team, driver, title, eyebrow, children }) {
    const livery = getTeamLivery(team);
    const reduced = useReducedMotion();
    const [paused, setPaused] = useState(false);
    const [view, setView] = useState("perspective");
    const [resetKey, setResetKey] = useState(0);
    const [unavailable, setUnavailable] = useState(false);
    const [ready, setReady] = useState(false);
    const fallback = <CarFallback livery={livery} />;

    return (
        <section className="race-showroom" style={{ "--livery": livery.color }} aria-label={`Garage ${livery.name}`}>
            <SceneBoundary onUnavailable={() => setUnavailable(true)} fallback={fallback}>
                {unavailable ? fallback : (
                    <Suspense fallback={fallback}>
                        <CarScene key={resetKey} livery={livery} number={driver?.number ?? "26"} playing={!paused} reducedMotion={reduced} view={view} onReady={() => setReady(true)} onUnavailable={() => setUnavailable(true)} />
                    </Suspense>
                )}
            </SceneBoundary>
            <div className="showroom-topline">
                <div>
                    <p className="showroom-eyebrow"><span />{eyebrow}</p>
                    <h1>{title}</h1>
                </div>
                <div className="showroom-step">SAISON <strong>2026</strong></div>
            </div>
            <div className="showroom-caption" key={`${livery.key}-${driver?.number ?? "team"}`}>
                <div className="showroom-identity">
                    <span className="showroom-team-mark" />
                    <div>
                        <span className="showroom-kicker">{driver ? livery.name : "Dans le garage"}</span>
                        <h2>{driver ? `${driver.name} ${driver.surname}` : livery.name}</h2>
                    </div>
                    {driver && <FlagBadge country={driver.country} compact />}
                </div>
                <div className="showroom-car-label">{driver ? `N° ${driver.number}` : "MONOPLACE"}<span>Livrée stylisée</span></div>
            </div>
            {!unavailable && (
                <div className="showroom-controls" role="group" aria-label="Vues de la monoplace">
                    <SceneButton label="Vue trois quarts" aria-pressed={view === "perspective"} onClick={() => setView("perspective")}><Camera size={18} /></SceneButton>
                    <SceneButton label="Vue de profil" aria-pressed={view === "side"} onClick={() => { setView("side"); setPaused(true); }}><View size={18} /></SceneButton>
                    <SceneButton label="Vue du dessus" aria-pressed={view === "top"} onClick={() => { setView("top"); setPaused(true); }}><ScanLine size={18} /></SceneButton>
                    <span className="showroom-control-separator" />
                    <SceneButton label={paused || reduced ? "Lancer la rotation" : "Mettre la rotation en pause"} disabled={reduced || !ready} aria-pressed={!paused && !reduced} onClick={() => setPaused((value) => !value)}>{paused || reduced ? <Play size={18} /> : <Pause size={18} />}</SceneButton>
                    <SceneButton label="Recentrer la voiture" onClick={() => { setView("perspective"); setResetKey((key) => key + 1); }}><RotateCcw size={18} /></SceneButton>
                </div>
            )}
            {children && <div className="showroom-extra">{children}</div>}
        </section>
    );
}

export { CarScene };
