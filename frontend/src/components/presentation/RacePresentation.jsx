import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getTeamLivery } from "../../data/teamLiveries";
import useReducedMotion from "../../hooks/useReducedMotion";
import { CarScene, CarFallback, SceneBoundary } from "./CarShowcase";

const PresentationContext = createContext((_, done) => done());

function Flyby({ entry, onFinish }) {
    const livery = getTeamLivery(entry.team);
    const [ready, setReady] = useState(false);
    const skipRef = useRef(null);
    const start = useCallback(() => setReady(true), []);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const root = document.getElementById("root");
        const previousInert = root?.inert;
        const overflow = document.body.style.overflow;
        if (root) root.inert = true;
        document.body.style.overflow = "hidden";
        skipRef.current?.focus();
        return () => {
            if (root) root.inert = previousInert;
            document.body.style.overflow = overflow;
            if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        };
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(onFinish, ready ? 1650 : 2800);
        return () => window.clearTimeout(timeout);
    }, [ready, onFinish]);

    const fallback = <CarFallback livery={livery} />;
    return createPortal(
        <div className={`race-flyby ${ready ? "is-running" : ""}`} style={{ "--livery": livery.color }} role="dialog" aria-modal="true" aria-labelledby="race-intro-title" onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); onFinish(); }
            if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus(); }
        }}>
            <div className="race-flyby-scene">
                <SceneBoundary fallback={fallback} onUnavailable={onFinish}>
                    <Suspense fallback={fallback}>
                        <CarScene livery={livery} number={entry.driver?.number ?? "26"} mode="flyby" direction={entry.direction} onReady={start} onUnavailable={onFinish} />
                    </Suspense>
                </SceneBoundary>
            </div>
            <div className="race-flyby-stripes" aria-hidden="true"><i /><i /><i /></div>
            <div className="race-flyby-heading">
                <span className="showroom-eyebrow">{entry.driver ? "PILOTE EN APPROCHE" : "BIENVENUE AU GARAGE"}</span>
                <h2 id="race-intro-title">{entry.driver ? entry.driver.surname : livery.name}</h2>
                <p>{entry.driver ? `${entry.driver.name} ${entry.driver.surname} · ${livery.name}` : "La saison commence ici."}</p>
            </div>
            {entry.driver && <span className="race-flyby-number" aria-hidden="true">{entry.driver.number}</span>}
            <div className="race-flyby-bottom"><span>F1 MANAGER / 2026</span><button type="button" ref={skipRef} onClick={onFinish}>Passer l'animation <ChevronRight size={17} /></button></div>
            <div className="race-flyby-progress" aria-hidden="true" />
        </div>, document.body
    );
}

export function RacePresentationProvider({ children }) {
    const reduced = useReducedMotion();
    const location = useLocation();
    const [entry, setEntry] = useState(null);
    const pending = useRef(null);
    const direction = useRef(1);
    const finish = useCallback(() => {
        const done = pending.current;
        pending.current = null;
        setEntry(null);
        done?.();
    }, []);

    useEffect(() => {
        pending.current = null;
        setEntry(null);
    }, [location.pathname]);

    useEffect(() => { if (reduced) finish(); }, [reduced, finish]);

    const present = useCallback((data, done) => {
        if (reduced) { done?.(); return; }
        if (pending.current) return;
        pending.current = done ?? (() => {});
        direction.current *= -1;
        setEntry({ ...data, direction: direction.current });
    }, [reduced]);

    return <PresentationContext.Provider value={present}>{children}{entry && <Flyby entry={entry} onFinish={finish} />}</PresentationContext.Provider>;
}

export function useRacePresentation() { return useContext(PresentationContext); }
