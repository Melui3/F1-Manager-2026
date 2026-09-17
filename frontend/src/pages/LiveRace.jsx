import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera, Check, ChevronRight, CloudRain, Flag, Gauge, Pause, Play, Radio, RotateCcw, Shield, SkipForward, Sun, Trophy, Wrench, X, Zap } from "lucide-react";
import { useGame } from "../context/GameContext";
import { apiFetch } from "../services/api";
import { ALLOWED_LAPS, PACES, PIT_COST, TYRES, weatherAt } from "../services/liveRaceEngine";
import { getTeamLivery } from "../data/teamLiveries";
import { driverPortrait } from "../data/visualAssets";
import FlagBadge from "../components/ui/FlagBadge";
import { SceneBoundary } from "../components/presentation/CarShowcase";
import useReducedMotion from "../hooks/useReducedMotion";
import "../components/race/liveRace.css";

const RaceTrack = lazy(() => import("../components/race/RaceTrack"));
const LAP_DURATION = 8500;
const money = (value) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 2 }).format(value ?? 0);
const lapTime = (value) => !value ? "--:--.---" : `${Math.floor(value / 60)}:${(value % 60).toFixed(3).padStart(6, "0")}`;

function IconButton({ label, children, ...props }) {
    return <button type="button" className="race-icon-button" aria-label={label} title={label} {...props}>{children}<span className="race-tooltip" aria-hidden="true">{label}</span></button>;
}

function TyreChoice({ value, onChange, disabled, label }) {
    return <div className="race-tyres" role="group" aria-label={label}>{Object.entries(TYRES).map(([key, tyre]) => (
        <button key={key} type="button" aria-label={`${tyre.label}, ${tyre.life}`} title={tyre.label} aria-pressed={value === key} onClick={() => onChange(key)} disabled={disabled} className="race-tyre-choice" style={{ "--tyre": tyre.color }}>
            <span className="race-tyre-symbol">{tyre.code}</span><strong>{key === "intermediate" ? "Interm." : tyre.label}</strong><small>{tyre.life}</small>
        </button>
    ))}</div>;
}

function TimingTower({ cars, playerId, lap, totalLaps }) {
    const leader = cars[0];
    return <aside className="race-tower" aria-label="Classement de la course">
        <div className="race-tower-heading"><Flag size={15} /><strong>CLASSEMENT</strong><span>{lap ?? 0}/{totalLaps}</span></div>
        <ol>{cars.map((car, index) => {
            const selected = car.id === playerId;
            const tyre = TYRES[car.tyre ?? "medium"];
            return <li key={car.id} className={selected ? "is-player" : ""} style={{ "--team-color": getTeamLivery(car.team).color }} aria-current={selected ? "true" : undefined}>
                <span className="race-position">{index + 1}</span><span className="race-team-stripe" />
                <span className="race-driver-code" title={`${car.name} ${car.surname}`}>{car.surname.slice(0, 3).toUpperCase()}</span>
                <span className="race-gap">{car.lastPit ? "BOX" : index === 0 ? "LEADER" : `+${Math.max(0, (car.totalTime ?? index * 0.55) - (leader?.totalTime ?? 0)).toFixed(1)}`}</span>
                <span className="race-small-tyre" style={{ color: tyre.color }} title={tyre.label}>{tyre.code}</span>
            </li>;
        })}</ol>
        <div className="race-tower-footer"><span /> TON PILOTE</div>
    </aside>;
}

function TrackFallback({ player, position }) {
    return <div className="race-track-fallback">
        <img src={driverPortrait(player)} alt={`${player.name} ${player.surname}`} />
        <div><span>CHRONOMÉTRAGE EN DIRECT</span><strong>{position ? `P${position}` : `#${player.number}`}</strong><p>{player.name} {player.surname}</p></div>
    </div>;
}

export default function LiveRace() {
    const { activeSessionId, team, driver, setDriver, setSim, ready } = useGame();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { sessionIndex } = useParams();
    const requested = sessionIndex ?? params.get("session");
    const reduced = useReducedMotion();
    const [race, setRace] = useState(null);
    const [calendar, setCalendar] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [budget, setBudget] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [routeError, setRouteError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [paused, setPaused] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [totalLaps, setTotalLaps] = useState(10);
    const [tyre, setTyre] = useState("medium");
    const [pitTyre, setPitTyre] = useState("medium");
    const [camera, setCamera] = useState("overview");
    const [noWebGL, setNoWebGL] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const requestPending = useRef(false);
    const activeSessionRef = useRef(activeSessionId);
    activeSessionRef.current = activeSessionId;

    useEffect(() => {
        if (!ready) return;
        if (!activeSessionId) { navigate("/login", { replace: true }); return; }
        if (!team || !driver) { navigate("/choose-team", { replace: true }); return; }
        let cancelled = false;
        setLoading(true);
        setPaused(true);
        window.scrollTo({ top: 0, behavior: "instant" });
        Promise.all([apiFetch("/api/live-race/"), apiFetch("/api/season/calendar/"), apiFetch("/api/drivers/")]).then(([live, sessions, roster]) => {
            if (cancelled) return;
            const saved = live.race;
            const next = sessions.find((item) => !item.is_simulated && ["GP", "S"].includes(item.session_type));
            const target = saved?.status === "racing" ? saved.session.index : next?.index ?? saved?.session.index;
            if (!sessionIndex && target !== undefined) { navigate(`/race/${requested ?? target}`, { replace: true }); return; }
            const isSaved = saved && String(saved.session.index) === requested;
            const isNext = next && String(next.index) === requested;
            if ((!isSaved && !isNext) || (saved?.status === "racing" && !isSaved)) {
                setRouteError("Cette course n'est pas disponible. Retrouve la manche actuelle dans le calendrier.");
                return;
            }
            setRouteError(null);
            setRace(saved?.status === "racing" || (saved && (requested === null || String(saved.session.index) === requested)) ? saved : null);
            setBudget(live.budget);
            setCalendar(sessions);
            setDrivers(roster);
            setError(null);
            progressRef.current = 0;
            setProgress(0);
        }).catch((cause) => { if (!cancelled) setError(cause.message); }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // Driver stats are refreshed at the finish without reopening this screen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, activeSessionId, requested, sessionIndex, navigate]);

    useEffect(() => {
        const visibility = () => { if (document.hidden) setPaused(true); };
        document.addEventListener("visibilitychange", visibility);
        return () => document.removeEventListener("visibilitychange", visibility);
    }, []);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) { setCountdown(null); setPaused(false); return; }
        const timer = window.setTimeout(() => setCountdown((value) => value - 1), 450);
        return () => window.clearTimeout(timer);
    }, [countdown]);

    const applySnapshot = useCallback((snapshot) => {
        setRace(snapshot.race);
        setBudget(snapshot.budget);
        if (snapshot.race.status === "finished") {
            setPaused(true);
            const result = snapshot.race.results.find((item) => item.id === snapshot.race.playerId);
            setDriver((current) => current?.id === result.id ? result : current);
            setSim((previous) => ({ ...previous, lastResults: snapshot.race.results, currentRound: snapshot.race.session.index + 1 }));
        }
    }, [setDriver, setSim]);

    const advance = useCallback(async () => {
        if (!race || race.status !== "racing" || requestPending.current) return;
        requestPending.current = true;
        setBusy(true);
        const sessionId = activeSessionRef.current;
        try {
            const snapshot = await apiFetch("/api/live-race/advance/", { method: "POST", body: JSON.stringify({ race_id: race.id, expected_lap: race.lap }) });
            if (sessionId !== activeSessionRef.current) return;
            progressRef.current = 0;
            setProgress(0);
            applySnapshot(snapshot);
            setError(null);
        } catch (cause) { setError(cause.message); setPaused(true); }
        finally { requestPending.current = false; setBusy(false); }
    }, [race, applySnapshot]);

    useEffect(() => {
        if (paused || busy || countdown !== null || race?.status !== "racing") return;
        let previous = performance.now();
        let frame;
        let lastDisplay = previous;
        function tick(now) {
            progressRef.current = Math.min(1, progressRef.current + Math.min(100, now - previous) * speed / LAP_DURATION);
            previous = now;
            if (now - lastDisplay > 100) { setProgress(progressRef.current); lastDisplay = now; }
            if (progressRef.current >= 1) { advance(); return; }
            frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [race?.id, race?.lap, race?.status, paused, speed, busy, countdown, advance]);

    async function sendCommand(command) {
        if (!race || requestPending.current) return;
        requestPending.current = true;
        setBusy(true);
        const sessionId = activeSessionRef.current;
        try {
            const snapshot = await apiFetch("/api/live-race/command/", { method: "POST", body: JSON.stringify({ race_id: race.id, command }) });
            if (sessionId === activeSessionRef.current) { applySnapshot(snapshot); setError(null); }
        } catch (cause) { setError(cause.message); }
        finally { requestPending.current = false; setBusy(false); }
    }

    const nextSession = calendar.find((session) => !session.is_simulated && ["GP", "S"].includes(session.session_type));
    const session = race?.session ?? nextSession;
    const cars = race?.cars ?? [...drivers].sort((a, b) => b.racing - a.racing);
    const player = race?.cars.find((car) => car.id === race.playerId) ?? driver;
    const finished = race?.status === "finished";
    const racing = race?.status === "racing";
    const livery = getTeamLivery(player?.team ?? team);
    const currentTyre = TYRES[player?.tyre ?? tyre];
    const recommendedPit = race?.wetness >= 40 ? "intermediate" : "medium";

    async function start() {
        if (!nextSession || requestPending.current) return;
        requestPending.current = true;
        setBusy(true);
        const sessionId = activeSessionRef.current;
        try {
            const snapshot = await apiFetch("/api/live-race/start/", { method: "POST", body: JSON.stringify({ session_index: nextSession.index, player_id: driver.id, total_laps: totalLaps, tyre }) });
            if (sessionId !== activeSessionRef.current) return;
            applySnapshot(snapshot);
            progressRef.current = 0;
            setProgress(0);
            setCountdown(reduced ? null : 5);
            setPaused(!reduced);
            setError(null);
        } catch (cause) { setError(cause.message); }
        finally { requestPending.current = false; setBusy(false); }
    }

    async function nextRace() {
        try {
            const sessions = await apiFetch("/api/season/calendar/");
            const next = sessions.find((item) => !item.is_simulated && ["GP", "S"].includes(item.session_type));
            if (next) navigate(`/race/${next.index}`);
            else navigate("/end-of-season");
        } catch (cause) { setError(cause.message); }
    }

    if (loading || !player) return <div className="live-race-loading"><span className="f1-spinner" /> Ouverture du pit wall…</div>;
    if (routeError || (!session && error)) return <div className="live-race-empty" role="alert"><h1>Course indisponible</h1><p>{routeError ?? error}</p><button onClick={() => navigate("/calendar")}>Retour au calendrier</button></div>;
    if (!session) return <div className="live-race-empty"><Trophy size={42} /><h1>La saison est terminée</h1><button onClick={() => navigate("/end-of-season")}>Voir le bilan</button></div>;

    return <div className="live-race" style={{ "--player-color": livery.color }}>
        <header className="live-race-header">
            <div><span className="race-eyebrow">F1 MANAGER / PIT WALL</span><h1><FlagBadge gpName={session.gp_name} compact />{session.gp_name}</h1></div>
            <div className="race-header-actions"><span className="race-wallet">BUDGET<strong>{money(budget)}</strong></span><IconButton label="Retour au calendrier" onClick={() => navigate("/calendar")}><ArrowLeft size={19} /></IconButton></div>
        </header>

        {error && <div role="alert" className="race-error">{error}<button type="button" onClick={() => setError(null)} aria-label="Fermer le message"><X size={16} /></button></div>}

        <div className="race-stage">
            <TimingTower cars={cars} playerId={race?.playerId ?? player.id} lap={race?.lap ?? 0} totalLaps={race?.totalLaps ?? totalLaps} />
            <section className="race-track-stage" aria-label="Circuit en direct">
                <SceneBoundary fallback={<TrackFallback player={player} position={player.position} />} onUnavailable={() => setNoWebGL(true)}>
                    {noWebGL ? <TrackFallback player={player} position={player.position} /> : <Suspense fallback={<div className="race-track-loading"><span className="f1-spinner" /> Mise en grille…</div>}>
                        <RaceTrack race={race} entrants={cars} player={player} progressRef={progressRef} cameraMode={camera} paused={paused} reducedMotion={reduced} onUnavailable={() => setNoWebGL(true)} />
                    </Suspense>}
                </SceneBoundary>
                <div className="race-broadcast-top">
                    <span className={`race-live-badge ${race?.safetyCar ? "is-yellow" : ""}`}><span />{finished ? "ARRIVÉE" : race?.safetyCar ? "SAFETY CAR" : !racing ? "AVANT COURSE" : paused ? "PAUSE" : "EN DIRECT"}</span>
                    <span className="race-lap-counter">TOUR <strong>{finished ? race.totalLaps : racing ? Math.min(race.lap + 1, race.totalLaps) : 0}</strong> / {race?.totalLaps ?? totalLaps}</span>
                    <span className="race-weather">{race?.wetness > 20 ? <CloudRain size={17} /> : <Sun size={17} />} {race?.wetness ?? 0}%</span>
                </div>
                <div className="race-broadcast-bottom"><div><strong>{session.circuit_name}</strong><span>Tracé de jeu · {session.session_type === "S" ? "Sprint" : "Mini-GP"}</span></div>
                    {!noWebGL && <div className="race-camera-controls" role="group" aria-label="Caméras de course">
                        <IconButton label="Vue du circuit" aria-pressed={camera === "overview"} onClick={() => setCamera("overview")}><RotateCcw size={18} /></IconButton>
                        <IconButton label="Suivre mon pilote" aria-pressed={camera === "chase"} disabled={reduced} onClick={() => setCamera("chase")}><Camera size={18} /></IconButton>
                    </div>}
                </div>
                {countdown !== null && <div className="race-start-lights" role="status" aria-label="Départ imminent"><div>{[0, 1, 2, 3, 4].map((light) => <i key={light} className={light < 6 - countdown ? "lit" : ""} />)}</div><span>PRÊT POUR LE DÉPART</span></div>}
                {finished && <div className="race-winner-banner"><Trophy size={30} /><div><span>VICTOIRE</span><strong>{race.cars[0].name} {race.cars[0].surname}</strong></div><FlagBadge country={race.cars[0].country} compact /></div>}
                <div className="race-lap-progress"><span style={{ transform: `scaleX(${finished ? 1 : progress})` }} /></div>
            </section>
        </div>

        {racing && <div className="race-control-bar">
            <div className="race-player-position"><span>P<strong>{player.position}</strong></span><div><b>{player.name} {player.surname}</b><small>{player.gridPosition - player.position > 0 ? "+" : ""}{player.gridPosition - player.position} place(s) depuis la grille</small></div></div>
            <div className="race-clock"><span>DERNIER TOUR</span><strong>{lapTime(player.lapTime)}</strong></div>
            <div className="race-playback"><div className="race-speed" role="group" aria-label="Vitesse de lecture">{[1, 2, 4].map((value) => <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>×{value}</button>)}</div>
                <IconButton label={paused ? "Reprendre la course" : "Mettre la course en pause"} onClick={() => setPaused((value) => !value)} disabled={countdown !== null || busy}>{paused ? <Play size={19} /> : <Pause size={19} />}</IconButton>
                <IconButton label="Avancer d'un tour" onClick={advance} disabled={!paused || busy || countdown !== null}><SkipForward size={19} /></IconButton>
            </div>
        </div>}

        {!race && <section className="race-briefing">
            <div><span className="race-eyebrow">PLAN DE COURSE</span><h2>Le départ t'appartient.</h2><p>{player.name} {player.surname} · {livery.name}</p><div className="race-distance" role="group" aria-label="Distance de course">{ALLOWED_LAPS.map((laps) => <button key={laps} type="button" onClick={() => setTotalLaps(laps)} aria-pressed={laps === totalLaps}>{laps} tours</button>)}</div><small>Grille issue des qualifications. Essais et qualifs manquants préparés au départ.</small></div>
            <div><h3>Pneus au départ</h3><TyreChoice value={tyre} onChange={setTyre} disabled={busy} label="Pneus au départ" /><button className="race-primary" type="button" onClick={start} disabled={busy}><Flag size={17} />{busy ? "Préparation de la grille…" : "Prendre le départ"}<ChevronRight size={18} /></button></div>
        </section>}

        {racing && <div className="race-strategy-grid">
            <section className="race-strategy-section"><h2><Gauge size={18} /> Rythme & voiture</h2>
                <div className="race-pace-options" role="group" aria-label="Rythme du pilote">{Object.entries(PACES).map(([key, pace]) => {
                    const Icon = key === "attack" ? Zap : key === "conserve" ? Shield : Gauge;
                    return <button key={key} type="button" aria-pressed={race.command.pace === key} disabled={busy || countdown !== null} onClick={() => sendCommand({ pace: key })} title={pace.detail}><Icon size={17} /><strong>{pace.label}</strong><small>{key === "attack" ? "Usure ×1,5" : key === "conserve" ? "Usure ×0,66" : "Usure ×1"}</small></button>;
                })}</div>
                <div className="race-condition"><span className="race-tyre-symbol" style={{ "--tyre": currentTyre.color }}>{currentTyre.code}</span><div><div><span>État des pneus</span><strong>{Math.round(100 - player.wear)}%</strong></div><meter min="0" max="100" low="25" high="60" optimum="100" value={100 - player.wear} aria-label="État des pneus" /></div></div>
                <div className="race-car-stats"><span>Carrosserie <strong>{Math.round(100 - player.damage)}%</strong></span><span>Arrêts <strong>{player.pitStops}</strong></span><span>Meilleur tour <strong>{lapTime(player.bestLap)}</strong></span></div>
            </section>

            <section className="race-strategy-section"><h2><Wrench size={18} /> Stand</h2><div className="race-pit-cost"><span>{money(PIT_COST)} / arrêt</span><span>~{race.safetyCar ? "8" : "14"} s perdues</span></div>
                <TyreChoice value={pitTyre} onChange={setPitTyre} disabled={busy} label="Pneus au prochain arrêt" />
                {race.command.pit ? <div className="race-pit-pending"><Check size={18} /><span>BOX ce tour · {TYRES[race.command.pit].label}</span><IconButton label="Annuler l'arrêt" onClick={() => sendCommand({ pit: null })} disabled={busy}><X size={16} /></IconButton></div> : <button className="race-primary" type="button" disabled={busy || countdown !== null || race.lap >= race.totalLaps - 1 || budget < PIT_COST} onClick={() => sendCommand({ pit: pitTyre })}><Wrench size={16} />{race.lap >= race.totalLaps - 1 ? "Dernier tour" : budget < PIT_COST ? "Budget insuffisant" : "Rentrer aux stands ce tour"}</button>}
                <div className="race-weather-forecast"><CloudRain size={16} /><span>Humidité prévue</span>{[1, 2].map((offset) => <strong key={offset}>T{Math.min(race.totalLaps, race.lap + offset)} · {weatherAt(race, Math.min(race.totalLaps, race.lap + offset))}%</strong>)}</div>
            </section>

            <section className="race-strategy-section race-radio"><h2><Radio size={18} /> Radio ingénieur<span className={!paused && !reduced ? "radio-wave is-active" : "radio-wave"}><i /><i /><i /><i /></span></h2>
                <div className="race-radio-current" aria-live="polite" aria-atomic="true"><span>TOUR {race.messages[0]?.lap ?? 0}</span><p>{race.messages[0]?.text}</p></div>
                {!race.command.pit && race.lap < race.totalLaps - 1 && (player.wear > 65 || (race.wetness >= 40 && player.tyre !== "intermediate")) && <button className="race-radio-action" type="button" onClick={() => { setPitTyre(recommendedPit); sendCommand({ pit: recommendedPit }); }} disabled={busy || budget < PIT_COST}><Wrench size={15} />Préparer les {TYRES[recommendedPit].label.toLowerCase()}</button>}
                <div className="race-radio-history">{race.messages.slice(1, 5).map((entry) => <p key={entry.id}><span>T{entry.lap}</span>{entry.text}</p>)}</div>
            </section>
        </div>}

        {finished && <section className="race-finish">
            <div><span className="race-eyebrow">DRAPEAU À DAMIER</span><h2>P{player.position}. {player.position <= 3 ? "Sur le podium !" : "Au bout de la bataille."}</h2><p>{player.name} {player.surname} · {race.totalLaps} tours · {player.pitStops} arrêt(s)</p>
                <div className="race-finish-stats"><div><span>CHAMPIONNAT</span><strong>+{race.settlement.points} pts</strong></div><div><span>BUDGET NET</span><strong>{race.settlement.net >= 0 ? "+" : ""}{money(race.settlement.net)}</strong></div><div><span>MEILLEUR TOUR</span><strong>{lapTime(player.bestLap)}</strong></div></div>
                <p className="race-settlement">Prime {money(race.settlement.reward)} · Stands −{money(race.settlement.pitCosts)} · Réparations −{money(race.settlement.repairs)}</p>
                <div className="race-finish-actions"><button className="race-primary" type="button" onClick={nextRace}>Course suivante <ChevronRight size={18} /></button><button className="race-secondary" type="button" onClick={() => navigate("/calendar")}>Retour au calendrier</button></div>
            </div>
            <div className="race-lap-history"><h3>Ta course, tour après tour</h3><div>{race.history.map((lap) => <div key={lap.lap} className={lap.pit ? "was-pit" : ""} title={`${lapTime(lap.lapTime)} · ${TYRES[lap.tyre].label}`}><span>T{lap.lap}</span><strong>P{lap.position}</strong>{lap.pit ? <Wrench size={13} /> : <span className="race-small-tyre" style={{ color: TYRES[lap.tyre].color }}>{TYRES[lap.tyre].code}</span>}</div>)}</div></div>
        </section>}
    </div>;
}
